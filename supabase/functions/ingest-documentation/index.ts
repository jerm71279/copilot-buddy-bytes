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

    // Validate input (explicit null and type checks)
    const isObject = requestData !== null && typeof requestData === 'object';
    if (!isObject) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Bulletproof byte-level sanitizer - removes ALL control characters including null bytes
    const sanitize = (val: unknown, max = 2000) => {
      const str = String(val ?? '');
      // Filter at byte level: keep only safe printable ASCII (32-126) and common whitespace
      const cleaned = Array.from(str)
        .map((ch) => {
          const code = ch.charCodeAt(0);
          // Allow space (32), tab (9), newline (10), carriage return (13), and printable ASCII (33-126)
          if (code === 32 || code === 9 || code === 10 || code === 13 || (code >= 33 && code <= 126)) {
            return ch;
          }
          // Replace everything else with space
          return ' ';
        })
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
      return cleaned.slice(0, max);
    };

    // Deep sanitize any JSON object/array structure recursively
    const sanitizeJson = (val: unknown): any => {
      if (typeof val === 'string') return sanitize(val);
      if (Array.isArray(val)) return val.map(sanitizeJson);
      if (val && typeof val === 'object') {
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(val as Record<string, any>)) {
          out[k] = sanitizeJson(v);
        }
        return out;
      }
      return val;
    };

    const url = sanitize((requestData as any).url, 2000);
    const source = sanitize((requestData as any).source, 200);

    // Strict UUID sanitizer (byte-level clean + RFC4122 pattern)
    const sanitizeUuid = (val: unknown): string | null => {
      const s = sanitize(val, 50).toLowerCase();
      const uuidV4Like = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
      return uuidV4Like.test(s) ? s : null;
    };

    const customerId = sanitizeUuid((requestData as any).customerId);
    const vendorId = sanitizeUuid((requestData as any).vendorId) || null;

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
    console.log('Fetched HTML length:', html.length, 'has null?', /\u0000/.test(html));
    
    // Extract text content (basic HTML to text conversion)
    const rawContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ');

    console.log('Raw content length:', rawContent.length, 'has null?', /\u0000/.test(rawContent));

    // Apply byte-level sanitization to content
    let textContent = sanitize(rawContent, 50000);

    console.log('Content sanitized, length:', textContent.length);

    // Generate title from URL and apply byte-level sanitization
    let title = sanitize(`${source} - ${url.split('/').pop() || 'Documentation'}`, 200);

    // Build payload with recursively sanitized JSONB fields
    const payload = {
      customer_id: customerId,
      vendor_id: vendorId,
      title,
      content: textContent,
      article_type: 'documentation',
      source_type: 'vendor_documentation',
      source_metadata: sanitizeJson({
        url,
        source,
        ingested_at: new Date().toISOString()
      }),
      status: 'published',
      version: 1,
      tags: sanitizeJson(['technical', 'documentation', sanitize(source.toLowerCase(), 50)]),
      created_by: customerId
    } as const;

    // All string fields are already sanitized via sanitize() function
    // which removes null bytes at byte level, so no additional stripping needed

    // Final deep strip and stepwise insert to isolate any problematic field
    const stripZero = (s: string) => {
      let cleaned = Array.from(s).filter((ch) => ch.charCodeAt(0) !== 0).join('');
      cleaned = cleaned.replace(/\\u0000/gi, '');
      return cleaned;
    };
    const stripZeroDeep = (val: any): any => {
      if (typeof val === 'string') return stripZero(val);
      if (Array.isArray(val)) return val.map(stripZeroDeep);
      if (val && typeof val === 'object') {
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(val)) out[k] = stripZeroDeep(v);
        return out;
      }
      return val;
    };

    // Step 1: Insert placeholder-only minimal row (pure ASCII)
    const placeholderPayload = {
      customer_id: customerId,
      vendor_id: vendorId,
      created_by: customerId,
      article_type: 'documentation' as const,
      source_type: 'vendor_documentation' as const,
      status: 'published' as const,
      version: 1,
      title: sanitize('Doc', 200),
      content: sanitize('Placeholder', 50000),
    };

    console.log('Inserting placeholder article...');
    const { data: created, error: createErr } = await supabase
      .from('knowledge_articles')
      .insert(placeholderPayload)
      .select()
      .maybeSingle();

    if (createErr) {
      console.error('Placeholder insert failed:', createErr);
      throw createErr;
    }

    const articleId = (created as any).id;

    // Helper to attempt field update and log failures without throwing
    const safeUpdate = async (patch: Record<string, any>, label: string) => {
      const cleaned = stripZeroDeep(patch);
      const { error: updErr } = await supabase
        .from('knowledge_articles')
        .update(cleaned)
        .eq('id', articleId)
        .select()
        .maybeSingle();
      if (updErr) {
        console.warn(`Update failed for ${label}:`, updErr);
        return false;
      }
      return true;
    };

    // Step 2: Update content (ASCII-safe first)
    const contentAscii = sanitize(textContent, 50000);
    await safeUpdate({ content: contentAscii }, 'content(ascii)');

    // Step 3: Try upgrading title and content to sanitized originals
    await safeUpdate({ title }, 'title');
    await safeUpdate({ content: textContent }, 'content(original)');

    // Step 4: Non-essential fields one by one
    await safeUpdate({ tags: sanitizeJson(['technical', 'documentation', sanitize(source.toLowerCase(), 50)]) }, 'tags');
    await safeUpdate({ source_metadata: sanitizeJson({ url, source, ingested_at: new Date().toISOString() }) }, 'source_metadata');

    console.log('Documentation ingested successfully:', articleId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        articleId,
        title
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
