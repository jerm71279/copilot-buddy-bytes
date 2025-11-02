import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KnowledgeUploadRequest {
  title: string;
  content: string;
  contentType?: string;
  serverId?: string;
  sourceUrl?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get customer_id
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile?.customer_id) {
      throw new Error('Customer profile not found');
    }

    const requestData: KnowledgeUploadRequest = await req.json();

    // Validate inputs
    const title = String(requestData.title || '').slice(0, 200);
    const content = String(requestData.content || '').slice(0, 50000);
    const contentType = String(requestData.contentType || 'document').slice(0, 50);
    const sourceUrl = requestData.sourceUrl ? String(requestData.sourceUrl).slice(0, 500) : null;
    const tags = Array.isArray(requestData.tags) ? requestData.tags.slice(0, 20) : [];

    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: 'Title and content are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate embedding
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const embeddingResponse = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: `${title}\n\n${content}`,
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error('Failed to generate embedding');
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;

    // Insert knowledge entry
    const { data: knowledgeEntry, error: insertError } = await supabase
      .from('mcp_knowledge_base')
      .insert({
        customer_id: profile.customer_id,
        server_id: requestData.serverId || null,
        title,
        content,
        content_type: contentType,
        source_url: sourceUrl,
        tags,
        metadata: requestData.metadata || {},
        embedding,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error('Failed to create knowledge entry');
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: knowledgeEntry,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in mcp-knowledge-upload:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
