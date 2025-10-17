import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { url, source, category, customerId, vendorId } = await req.json();

    if (!url || !source || !customerId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: url, source, customerId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching documentation from:', url);

    // Fetch the documentation page
    const fetchResponse = await fetch(url);
    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch documentation: ${fetchResponse.statusText}`);
    }

    const html = await fetchResponse.text();
    
    // Extract text content (basic HTML to text conversion)
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 50000); // Limit to 50k characters

    // Generate title from URL
    const title = `${source} - ${url.split('/').pop() || 'Documentation'}`;

    // Insert into knowledge_articles
    const { data: article, error } = await supabase
      .from('knowledge_articles')
      .insert({
        customer_id: customerId,
        vendor_id: vendorId || null,
        title,
        content: textContent,
        category: category || 'technical_documentation',
        source,
        source_url: url,
        is_verified: true,
        usage_count: 0,
        confidence_score: 0.95,
        tags: ['technical', 'documentation', source.toLowerCase()]
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting article:', error);
      throw error;
    }

    console.log('Documentation ingested successfully:', article.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        articleId: article.id,
        title: article.title
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ingest-documentation:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
