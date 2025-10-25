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

    const { supabase, userId, customerId } = await getAuthContext(authHeader);

    const requestData = await req.json();
    const { action, query, domain, tags } = requestData;

    if (action === 'search') {
      // Search catalog
      let catalogQuery = supabase
        .from('data_catalog')
        .select('*')
        .eq('customer_id', customerId);

      if (query) {
        catalogQuery = catalogQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%,display_name.ilike.%${query}%`);
      }

      if (domain) {
        catalogQuery = catalogQuery.eq('domain', domain);
      }

      if (tags && Array.isArray(tags) && tags.length > 0) {
        catalogQuery = catalogQuery.contains('tags', tags);
      }

      const { data: results, error: searchError } = await catalogQuery
        .order('usage_count', { ascending: false })
        .limit(50);

      if (searchError) {
        console.error('Search error:', searchError);
        return new Response(JSON.stringify({ error: 'Search failed' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        success: true,
        results: results || [],
        count: results?.length || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'register') {
      // Register new catalog entry
      const { catalogType, name, displayName, description, domain, tags, dataClassification, containsPii, sourceLocation, schema } = requestData;

      if (!catalogType || !name) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: catalogEntry, error: registerError } = await supabase
        .from('data_catalog')
        .insert({
          customer_id: customerId,
          catalog_type: catalogType,
          name: name.slice(0, 200),
          display_name: displayName ? String(displayName).slice(0, 200) : null,
          description: description ? String(description).slice(0, 2000) : null,
          domain: domain ? String(domain).slice(0, 50) : null,
          tags: tags || [],
          data_classification: dataClassification || 'internal',
          contains_pii: containsPii || false,
          source_location: sourceLocation,
          schema_definition: schema || null,
          created_by: userId
        })
        .select()
        .single();

      if (registerError) {
        console.error('Register error:', registerError);
        return new Response(JSON.stringify({ error: 'Failed to register catalog entry' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Catalog entry registered:', catalogEntry.id);

      return new Response(JSON.stringify({ 
        success: true,
        id: catalogEntry.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'stats') {
      // Get catalog statistics
      const { data: stats } = await supabase
        .from('data_catalog')
        .select('catalog_type, domain, data_classification, contains_pii')
        .eq('customer_id', customerId);

      const summary: {
        totalEntries: number;
        byType: Record<string, number>;
        byDomain: Record<string, number>;
        byClassification: Record<string, number>;
        containsPii: number;
      } = {
        totalEntries: stats?.length || 0,
        byType: {},
        byDomain: {},
        byClassification: {},
        containsPii: stats?.filter((s: any) => s.contains_pii).length || 0
      };

      stats?.forEach((entry: any) => {
        summary.byType[entry.catalog_type] = (summary.byType[entry.catalog_type] || 0) + 1;
        if (entry.domain) {
          summary.byDomain[entry.domain] = (summary.byDomain[entry.domain] || 0) + 1;
        }
        if (entry.data_classification) {
          summary.byClassification[entry.data_classification] = (summary.byClassification[entry.data_classification] || 0) + 1;
        }
      });

      return new Response(JSON.stringify({ 
        success: true,
        summary
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in data-catalog:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});