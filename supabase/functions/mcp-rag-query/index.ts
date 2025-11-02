import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RAGQueryRequest {
  query: string;
  serverId?: string;
  topK?: number;
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

    const requestData: RAGQueryRequest = await req.json();
    const query = String(requestData.query || '').slice(0, 1000);
    const serverId = requestData.serverId;
    const topK = Math.min(Number(requestData.topK) || 5, 10);

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startTime = Date.now();

    // Generate embedding using Lovable AI
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
        input: query,
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error('Failed to generate embedding');
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;

    // Search knowledge base using vector similarity
    const { data: searchResults, error: searchError } = await supabase.rpc(
      'search_mcp_knowledge',
      {
        query_embedding: embedding,
        query_customer_id: profile.customer_id,
        query_server_id: serverId || null,
        match_threshold: 0.7,
        match_count: topK,
      }
    );

    if (searchError) {
      console.error('Search error:', searchError);
      throw new Error('Failed to search knowledge base');
    }

    // Build context from retrieved documents
    const context = (searchResults || [])
      .map((doc: any, idx: number) => 
        `[Document ${idx + 1}] ${doc.title}\n${doc.content}`
      )
      .join('\n\n');

    // Generate AI response using retrieved context
    let aiResponse = '';
    if (context && searchResults.length > 0) {
      const aiRequest = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are a helpful assistant that answers questions based on the provided context. Use ONLY the information in the context to answer. If the context doesn't contain enough information, say so.

Context:
${context}`,
            },
            {
              role: 'user',
              content: query,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (aiRequest.ok) {
        const aiData = await aiRequest.json();
        aiResponse = aiData.choices[0].message.content;
      }
    } else {
      aiResponse = 'No relevant documents found in the knowledge base to answer this query.';
    }

    const responseTime = Date.now() - startTime;

    // Log query
    await supabase.from('mcp_rag_queries').insert({
      customer_id: profile.customer_id,
      server_id: serverId || null,
      user_id: user.id,
      query_text: query,
      retrieved_docs: searchResults || [],
      ai_response: aiResponse,
      response_time_ms: responseTime,
    });

    return new Response(
      JSON.stringify({
        success: true,
        response: aiResponse,
        retrievedDocs: searchResults || [],
        responseTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in mcp-rag-query:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
