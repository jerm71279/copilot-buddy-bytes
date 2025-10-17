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

    const requestData = await req.json();

    // Validate input
    if (!requestData || typeof requestData !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = String(requestData.url || '').slice(0, 2000);
    const source = String(requestData.source || '').slice(0, 200);
    const customerId = requestData.customerId;
    const vendorId = requestData.vendorId || null;

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
        vendor_id: vendorId,
        title,
        content: textContent,
        article_type: 'documentation',
        source_type: 'vendor_documentation',
        source_metadata: {
          url,
          source,
          ingested_at: new Date().toISOString()
        },
        status: 'published',
        version: 1,
        tags: ['technical', 'documentation', source.toLowerCase()],
        created_by: customerId
      })
      .select()
      .maybeSingle();

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
