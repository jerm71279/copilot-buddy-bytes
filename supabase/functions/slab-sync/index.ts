import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const requestData = await req.json();
    
    // Validate input
    if (!requestData || typeof requestData !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const action = String(requestData.action || '').slice(0, 100);
    const customerId = requestData.customerId ? String(requestData.customerId).slice(0, 100) : undefined;
    
    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!customerId) {
      return new Response(
        JSON.stringify({ error: 'customerId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SLAB_API_KEY = Deno.env.get('SLAB_API_KEY');
    if (!SLAB_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'SLAB_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("📚 Processing Slab request:", action);

    switch (action) {
      case 'sync_posts': {
        // Fetch posts from Slab API
        const slabResponse = await fetch('https://api.slab.com/v1/posts', {
          headers: {
            'Authorization': `Bearer ${SLAB_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (!slabResponse.ok) {
          throw new Error(`Slab API error: ${slabResponse.statusText}`);
        }

        const slabData = await slabResponse.json();
        const posts = Array.isArray(slabData.data) ? slabData.data.slice(0, 100) : [];

        // Store in knowledge_articles table
        const articles = posts.map((post: any) => ({
          customer_id: customerId,
          title: String(post.title || '').slice(0, 200),
          content: String(post.content || '').slice(0, 50000),
          article_type: 'sop',
          status: 'published',
          integration_source: 'slab',
          external_id: String(post.id || '').slice(0, 100),
          tags: Array.isArray(post.tags) ? post.tags.slice(0, 20).map((t: any) => String(t).slice(0, 50)) : [],
          metadata: {
            slab_url: post.url,
            last_synced: new Date().toISOString(),
            author: post.author?.display_name
          }
        }));

        const { data: insertedArticles, error: insertError } = await supabaseClient
          .from('knowledge_articles')
          .upsert(articles, { onConflict: 'external_id', ignoreDuplicates: false });

        if (insertError) {
          throw insertError;
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            synced: articles.length,
            message: `Successfully synced ${articles.length} posts from Slab`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'sync_single_post': {
        const postId = requestData.postId ? String(requestData.postId).slice(0, 100) : undefined;
        
        if (!postId) {
          return new Response(
            JSON.stringify({ error: 'postId is required for sync_single_post action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Fetch single post from Slab
        const slabResponse = await fetch(`https://api.slab.com/v1/posts/${postId}`, {
          headers: {
            'Authorization': `Bearer ${SLAB_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (!slabResponse.ok) {
          throw new Error(`Slab API error: ${slabResponse.statusText}`);
        }

        const post = await slabResponse.json();

        // Store in knowledge_articles
        const article = {
          customer_id: customerId,
          title: String(post.title || '').slice(0, 200),
          content: String(post.content || '').slice(0, 50000),
          article_type: 'sop',
          status: 'published',
          integration_source: 'slab',
          external_id: String(post.id || '').slice(0, 100),
          tags: Array.isArray(post.tags) ? post.tags.slice(0, 20).map((t: any) => String(t).slice(0, 50)) : [],
          metadata: {
            slab_url: post.url,
            last_synced: new Date().toISOString(),
            author: post.author?.display_name
          }
        };

        const { data: insertedArticle, error: insertError } = await supabaseClient
          .from('knowledge_articles')
          .upsert(article, { onConflict: 'external_id', ignoreDuplicates: false })
          .select()
          .maybeSingle();

        if (insertError) {
          throw insertError;
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            article: insertedArticle,
            message: 'Successfully synced post from Slab'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'webhook': {
        // Handle Slab webhook events
        const event = requestData.event ? String(requestData.event).slice(0, 100) : undefined;
        const postId = requestData.post?.id ? String(requestData.post.id).slice(0, 100) : undefined;

        console.log('Slab webhook received:', event, postId);

        if (event === 'post.created' || event === 'post.updated') {
          // Trigger sync for the specific post
          const post = requestData.post;
          
          const article = {
            customer_id: customerId,
            title: String(post.title || '').slice(0, 200),
            content: String(post.content || '').slice(0, 50000),
            article_type: 'sop',
            status: 'published',
            integration_source: 'slab',
            external_id: String(post.id || '').slice(0, 100),
            tags: Array.isArray(post.tags) ? post.tags.slice(0, 20).map((t: any) => String(t).slice(0, 50)) : [],
            metadata: {
              slab_url: post.url,
              last_synced: new Date().toISOString(),
              author: post.author?.display_name,
              webhook_event: event
            }
          };

          await supabaseClient
            .from('knowledge_articles')
            .upsert(article, { onConflict: 'external_id', ignoreDuplicates: false });
        }

        if (event === 'post.deleted' && postId) {
          // Mark article as archived
          await supabaseClient
            .from('knowledge_articles')
            .update({ status: 'archived' })
            .eq('external_id', postId)
            .eq('integration_source', 'slab');
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Webhook processed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in slab-sync:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
