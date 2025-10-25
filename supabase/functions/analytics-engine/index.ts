import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAuthContext } from "../_shared/supabaseAuth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { supabase, customerId } = await getAuthContext(authHeader);

    const requestData = await req.json();
    const { action, domains, metricName, aggregationType, dimensions, timeRange } = requestData;

    if (action === 'cross-domain-analytics') {
      // Query across multiple data products
      if (!domains || !Array.isArray(domains) || domains.length === 0) {
        return new Response(JSON.stringify({ error: 'Domains required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const results: Record<string, any> = {};

      for (const domain of domains) {
        const { data: silverData } = await supabase
          .from('data_lake_silver')
          .select('*')
          .eq('customer_id', customerId)
          .eq('domain', domain)
          .eq('validation_status', 'validated')
          .order('created_at', { ascending: false })
          .limit(100);

        if (silverData && silverData.length > 0) {
          results[domain] = {
            recordCount: silverData.length,
            avgQualityScore: Math.round(silverData.reduce((sum: number, r: any) => sum + (r.quality_score || 0), 0) / silverData.length),
            latestUpdate: silverData[0].created_at,
            sampleData: silverData.slice(0, 5).map((r: any) => r.transformed_data)
          };
        }
      }

      return new Response(JSON.stringify({ 
        success: true,
        results,
        queriedDomains: domains
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'metric-aggregation') {
      // Aggregate metrics from gold layer
      let goldQuery = supabase
        .from('data_lake_gold')
        .select('*')
        .eq('customer_id', customerId);

      if (metricName) {
        goldQuery = goldQuery.eq('metric_name', metricName);
      }

      if (timeRange && timeRange.from) {
        goldQuery = goldQuery.gte('valid_from', timeRange.from);
      }

      if (timeRange && timeRange.to) {
        goldQuery = goldQuery.lte('valid_from', timeRange.to);
      }

      const { data: metrics, error: metricsError } = await goldQuery
        .order('valid_from', { ascending: false })
        .limit(1000);

      if (metricsError) {
        console.error('Metrics error:', metricsError);
        return new Response(JSON.stringify({ error: 'Failed to fetch metrics' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Aggregate results
      const aggregated: {
        totalRecords: number;
        metricsByName: Record<string, any>;
        metricsByAggregation: Record<string, number>;
      } = {
        totalRecords: metrics?.length || 0,
        metricsByName: {},
        metricsByAggregation: {}
      };

      metrics?.forEach((metric: any) => {
        if (!aggregated.metricsByName[metric.metric_name]) {
          aggregated.metricsByName[metric.metric_name] = {
            count: 0,
            sum: 0,
            avg: 0,
            min: Infinity,
            max: -Infinity
          };
        }

        const metricStats = aggregated.metricsByName[metric.metric_name];
        metricStats.count++;
        metricStats.sum += Number(metric.metric_value) || 0;
        metricStats.min = Math.min(metricStats.min, Number(metric.metric_value) || 0);
        metricStats.max = Math.max(metricStats.max, Number(metric.metric_value) || 0);
        metricStats.avg = metricStats.sum / metricStats.count;

        if (metric.aggregation_type) {
          aggregated.metricsByAggregation[metric.aggregation_type] = (aggregated.metricsByAggregation[metric.aggregation_type] || 0) + 1;
        }
      });

      return new Response(JSON.stringify({ 
        success: true,
        aggregated,
        rawMetrics: metrics?.slice(0, 50) || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'data-products-overview') {
      // Get all data products
      const { data: products, error: productsError } = await supabase
        .from('data_products')
        .select('*')
        .eq('customer_id', customerId)
        .eq('is_active', true)
        .order('last_updated', { ascending: false });

      if (productsError) {
        console.error('Products error:', productsError);
        return new Response(JSON.stringify({ error: 'Failed to fetch data products' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const overview: {
        totalProducts: number;
        byDomain: Record<string, number>;
        byFrequency: Record<string, number>;
        byAccessPolicy: Record<string, number>;
      } = {
        totalProducts: products?.length || 0,
        byDomain: {},
        byFrequency: {},
        byAccessPolicy: {}
      };

      products?.forEach((product: any) => {
        overview.byDomain[product.domain] = (overview.byDomain[product.domain] || 0) + 1;
        overview.byFrequency[product.update_frequency] = (overview.byFrequency[product.update_frequency] || 0) + 1;
        overview.byAccessPolicy[product.access_policy] = (overview.byAccessPolicy[product.access_policy] || 0) + 1;
      });

      return new Response(JSON.stringify({ 
        success: true,
        overview,
        products: products || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analytics-engine:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});