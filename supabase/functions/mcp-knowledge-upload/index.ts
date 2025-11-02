import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { chunkDocument, getDefaultChunkingOptions, type ChunkingOptions } from '../_shared/chunking.ts';

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
  enableChunking?: boolean;
  chunkingOptions?: Partial<ChunkingOptions>;
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
    const enableChunking = requestData.enableChunking ?? true; // Default to chunking

    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: 'Title and content are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get or use chunking settings
    let chunkingOptions = getDefaultChunkingOptions();
    if (requestData.chunkingOptions) {
      chunkingOptions = { ...chunkingOptions, ...requestData.chunkingOptions };
    }

    if (enableChunking) {
      // Chunk the document
      const chunks = chunkDocument(content, chunkingOptions);
      console.log(`Document chunked into ${chunks.length} chunks`);

      // First, create parent document entry (no embedding, just metadata)
      const { data: parentDoc, error: parentError } = await supabase
        .from('mcp_knowledge_base')
        .insert({
          customer_id: profile.customer_id,
          server_id: requestData.serverId || null,
          title,
          content: content.slice(0, 500) + '...', // Preview only
          content_type: contentType,
          source_url: sourceUrl,
          tags,
          metadata: { ...requestData.metadata, isParent: true, totalChunks: chunks.length },
          is_chunked: true,
          total_chunks: chunks.length,
          created_by: user.id,
        })
        .select()
        .maybeSingle();

      if (parentError || !parentDoc) {
        console.error('Parent doc error:', parentError);
        throw new Error('Failed to create parent document');
      }

      // Generate embeddings for all chunks in parallel
      const embeddingPromises = chunks.map(chunk =>
        fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-ada-002',
            input: `${title}\n\n${chunk.content}`,
          }),
        }).then(r => r.json())
      );

      const embeddingResults = await Promise.all(embeddingPromises);

      // Insert all chunks
      const chunkInserts = chunks.map((chunk, idx) => ({
        customer_id: profile.customer_id,
        server_id: requestData.serverId || null,
        title: `${title} (Chunk ${chunk.index + 1}/${chunks.length})`,
        content: chunk.content,
        content_type: contentType,
        source_url: sourceUrl,
        tags,
        metadata: { ...requestData.metadata, ...chunk.metadata },
        embedding: embeddingResults[idx].data[0].embedding,
        parent_document_id: parentDoc.id,
        chunk_index: chunk.index,
        total_chunks: chunks.length,
        created_by: user.id,
      }));

      const { error: chunksError } = await supabase
        .from('mcp_knowledge_base')
        .insert(chunkInserts);

      if (chunksError) {
        console.error('Chunks error:', chunksError);
        throw new Error('Failed to create chunks');
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: parentDoc,
          chunksCreated: chunks.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // No chunking - create single document
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
        .maybeSingle();

      if (insertError || !knowledgeEntry) {
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
    }

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
