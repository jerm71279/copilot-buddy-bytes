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

    // Basic sanitizer for all inbound strings
    const sanitize = (val: unknown, max = 2000) =>
      String(val ?? '')
        .replace(/[\x00-\x1F\x7F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, max);

    // Deep sanitize any JSON object/array structure
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
    const customerId = (requestData as any).customerId;
    const vendorId = (requestData as any).vendorId || null;

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

    // Final sanitize and cap to 50k for DB safety
    let textContent = (rawContent || '')
      .replace(/[\x00-\x1F\x7F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 50000);

    console.log('After sanitize length:', textContent.length, 'has null?', /\u0000/.test(textContent));

    // Extra hardening against any stray nulls
    if (/\u0000/.test(textContent)) {
      console.warn('Null bytes detected in content - removing');
      textContent = textContent.replace(/\u0000/g, ' ');
    }

    console.log('Final content length:', textContent.length, 'has null?', /\u0000/.test(textContent));

    // Generate title from URL and sanitize
    let title = `${source} - ${url.split('/').pop() || 'Documentation'}`;
    title = title.replace(/[\x00-\x1F\x7F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);

    // Build payload and deep-sanitize to guarantee no null bytes anywhere
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

    // Strip null bytes AND their JSON escape sequence representation
    // Postgres JSONB cannot store \u0000 even as escape sequences because it
    // parses them during insert and converts to actual null bytes, which TEXT rejects
    const stripZero = (s: string) => {
      // Remove actual null bytes (codepoint 0)
      let cleaned = Array.from(s).filter(ch => ch.charCodeAt(0) !== 0).join('');
      // Remove JSON escape sequence for null byte: \u0000
      // This prevents Postgres JSONB from parsing it as a null byte
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
    const safePayload = stripZeroDeep(payload);

    console.log('Payload sanitized, inserting article...');

      // Stepwise insert to isolate problematic fields
      const asciiStrict = (s: string) => Array.from(s)
        .map((ch) => {
          const code = ch.charCodeAt(0);
          return code >= 32 && code <= 126 ? ch : ' ';
        })
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      const baseIds = { customer_id: customerId, vendor_id: vendorId, created_by: customerId };
      const baseFixed = {
        article_type: 'documentation' as const,
        source_type: 'vendor_documentation' as const,
        status: 'published' as const,
        version: 1 as const,
      };

      // 1) Insert with ultra-safe placeholder values only
      const placeholderPayload = stripZeroDeep({
        ...baseIds,
        ...baseFixed,
        title: 'Documentation',
        content: 'Placeholder',
      });

      let { data: article, error } = await supabase
        .from('knowledge_articles')
        .insert(placeholderPayload)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Placeholder insert failed:', error);
        throw error;
      }

      const articleId = (article as any).id;

      // 2) Try updating content with strict ASCII first
      const contentAscii = asciiStrict(textContent).slice(0, 50000);
      let { error: updContentAsciiErr } = await supabase
        .from('knowledge_articles')
        .update({ content: contentAscii })
        .eq('id', articleId)
        .select()
        .maybeSingle();
      if (updContentAsciiErr) {
        console.warn('ASCII content update failed (keeping placeholder):', updContentAsciiErr);
      } else {
        // 3) If ASCII update succeeded, try upgrading to sanitized original content
        const { error: updContentOrigErr } = await supabase
          .from('knowledge_articles')
          .update({ content: textContent })
          .eq('id', articleId)
          .select()
          .maybeSingle();
        if (updContentOrigErr) {
          console.warn('Original content update failed, reverting to ASCII:', updContentOrigErr);
          await supabase
            .from('knowledge_articles')
            .update({ content: contentAscii })
            .eq('id', articleId)
            .select()
            .maybeSingle();
        }
      }

      // 4) Update title (ASCII strict to be safe)
      const titleAscii = asciiStrict(title).slice(0, 200);
      const { error: updTitleErr } = await supabase
        .from('knowledge_articles')
        .update({ title: titleAscii })
        .eq('id', articleId)
        .select()
        .maybeSingle();
      if (updTitleErr) {
        console.warn('Title update failed (keeping generic):', updTitleErr);
      }

      // 5) Best-effort update to add non-essential fields (source_metadata, tags)
      const nonEssentialUpdates: Record<string, any> = {};
      if (safePayload.source_metadata) nonEssentialUpdates.source_metadata = safePayload.source_metadata;
      if (safePayload.tags) nonEssentialUpdates.tags = safePayload.tags;

      if (Object.keys(nonEssentialUpdates).length > 0) {
        const { error: updateError } = await supabase
          .from('knowledge_articles')
          .update(stripZeroDeep(nonEssentialUpdates))
          .eq('id', articleId)
          .select()
          .maybeSingle();
        if (updateError) {
          console.warn('Non-essential field update failed (continuing):', updateError);
        }
      }

      console.log('Documentation ingested successfully:', articleId);

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
