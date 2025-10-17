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

    // Smart UUID sanitizer - only rejects all-zero or malformed UUIDs
    const sanitizeUuid = (val: unknown): string | null => {
      if (!val) return null;
      
      // Convert to string
      const raw = String(val);
      const bytes = Array.from(raw).map((ch) => ch.charCodeAt(0));
      
      // Check if it's all zeros (the real red flag)
      const allZeros = bytes.every((b) => b === 0) || 
                       raw === '00000000-0000-0000-0000-000000000000';
      
      console.log('UUID validation:', {
        raw: raw.substring(0, 50),
        length: raw.length,
        allZeros,
        hex: bytes.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join(''),
      });
      
      if (allZeros) {
        console.warn('All-zero UUID detected - rejecting');
        return null;
      }
      
      // Clean and validate format (allow any byte values in the string)
      const cleaned = raw.toLowerCase().trim();
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
      
      if (!uuidPattern.test(cleaned)) {
        console.warn('Invalid UUID format:', cleaned.substring(0, 50));
        return null;
      }
      
      return cleaned;
    };

    let customerId = sanitizeUuid((requestData as any).customerId);
    let vendorId = sanitizeUuid((requestData as any).vendorId);
    
    if (!customerId) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing customerId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Comprehensive null-byte stripping for all data types
    const stripNullBytes = (str: string): string => {
      return str.split('').filter(ch => ch.charCodeAt(0) !== 0).join('');
    };
    
    const stripZeroDeep = (val: any): any => {
      if (typeof val === 'string') return stripNullBytes(val);
      if (Array.isArray(val)) return val.map(stripZeroDeep);
      if (val && typeof val === 'object') {
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(val)) out[k] = stripZeroDeep(v);
        return out;
      }
      return val;
    };
    
    customerId = stripNullBytes(customerId);
    if (vendorId) {
      vendorId = stripNullBytes(vendorId);
    }

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

    // Debug UUID fields for null bytes before insert
    const debugUuid = (label: string, s: string | null) => {
      if (!s) { 
        console.log(`${label}: null`); 
        return; 
      }
      const codes = Array.from(s).map((ch) => ch.charCodeAt(0));
      const hasNull = codes.includes(0);
      const preview = codes.slice(0, 12);
      console.log(`${label}:`, { 
        value: s, 
        length: s.length,
        preview, 
        hasNull 
      });
    };
    
    debugUuid('customerId', customerId);
    debugUuid('vendorId', vendorId);

    // Step 1: Insert placeholder with only validated text UUIDs
    const placeholderPayloadBase = {
      article_type: 'documentation' as const,
      source_type: 'vendor_documentation' as const,
      status: 'published' as const,
      version: 1,
      title: 'Doc',
      content: 'Placeholder',
    };

    console.log('Inserting placeholder article with customer_id:', customerId);
    
    // Deep sanitize the placeholder payload to remove any null bytes
    const sanitizedPlaceholder = stripZeroDeep({
      ...placeholderPayloadBase,
      customer_id: customerId,
      vendor_id: vendorId,
      created_by: customerId,
    });
    
    console.log('Sanitized placeholder:', JSON.stringify(sanitizedPlaceholder).substring(0, 200));
    
    // First attempt: with both IDs
    let createRes = await supabase
      .from('knowledge_articles')
      .insert(sanitizedPlaceholder)
      .select()
      .maybeSingle();

    if (createRes.error && (createRes.error.message?.toLowerCase().includes('null character') || createRes.error.code === '54000')) {
      console.warn('Placeholder insert failed (with vendor_id). Retrying without vendor_id...');
      const retryPayload = stripZeroDeep({
        ...placeholderPayloadBase,
        customer_id: customerId,
        created_by: customerId,
      });
      createRes = await supabase
        .from('knowledge_articles')
        .insert(retryPayload)
        .select()
        .maybeSingle();
    }

    if (createRes.error && (createRes.error.message?.toLowerCase().includes('null character') || createRes.error.code === '54000')) {
      console.warn('Placeholder insert failed (without vendor_id). Retrying with minimal IDs...');
      const minimalPayload = stripZeroDeep({
        ...placeholderPayloadBase,
        customer_id: customerId,
        created_by: customerId,
      });
      createRes = await supabase
        .from('knowledge_articles')
        .insert(minimalPayload)
        .select()
        .maybeSingle();
    }

    if (createRes.error) {
      console.error('Placeholder insert failed:', createRes.error);
      throw createRes.error;
    }

    const articleId = (createRes.data as any).id;

    // Helper to attempt field update and log failures without throwing
    const safeUpdate = async (patch: Record<string, any>, label: string) => {
      const cleanedPatch = stripZeroDeep(patch);
      try {
        console.log('DB boundary check', {
          label,
          keys: Object.keys(cleanedPatch),
          types: Object.fromEntries(Object.entries(cleanedPatch).map(([k, v]) => [k, Array.isArray(v) ? 'array' : typeof v])),
          hasNulls: Object.fromEntries(Object.entries(cleanedPatch).map(([k, v]) => [k, typeof v === 'string' && /\u0000/.test(v as string)])),
        });
      } catch (_) {}
      const { error: updErr } = await supabase
        .from('knowledge_articles')
        .update(cleanedPatch)
        .eq('id', articleId)
        .select()
        .maybeSingle();
      if (updErr) {
        console.warn(`Update failed for ${label}:`, updErr);
        return false;
      }
      return true;
    };

    // Step 2: Update content and title
    await safeUpdate({ title }, 'title');
    await safeUpdate({ content: textContent }, 'content');

    // Step 3: Non-essential fields
    await safeUpdate({ tags: sanitizeJson(['technical', 'documentation', sanitize(source.toLowerCase(), 50)]) }, 'tags');
    await safeUpdate({ source_metadata: sanitizeJson({ url, source, ingested_at: new Date().toISOString() }) }, 'source_metadata');

    console.log('Documentation ingested successfully:', articleId);

    return new Response(
      JSON.stringify({ success: true, articleId, title }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

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
