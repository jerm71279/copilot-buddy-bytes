import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation functions (duplicated from client-side for edge function use)
function sanitizeString(input: string, maxLength: number = 1000): { isValid: boolean; sanitized: string; errors: string[] } {
  const errors: string[] = [];
  let sanitized = input;

  if (input.length > maxLength) {
    errors.push(`Input exceeds maximum length of ${maxLength} characters`);
    sanitized = input.substring(0, maxLength);
  }

  // Remove null bytes
  if (sanitized.includes('\0') || sanitized.includes('\x00')) {
    errors.push('Null bytes detected and removed');
    sanitized = sanitized.replace(/\0/g, '').replace(/\x00/g, '');
  }

  // Detect SQL injection patterns
  const sqlPatterns = [
    /(\bDROP\b|\bDELETE\b|\bINSERT\b|\bUPDATE\b).*\b(TABLE|FROM|INTO)\b/i,
    /UNION.*SELECT/i,
    /';.*--/,
    /'.*OR.*'.*'.*=/i,
    /\bEXEC\b|\bEXECUTE\b/i
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(sanitized)) {
      return {
        isValid: false,
        sanitized: '',
        errors: ['Potential SQL injection detected']
      };
    }
  }

  // Detect and escape XSS patterns
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]*onerror[^>]*>/gi,
    /<svg[^>]*onload[^>]*>/gi
  ];

  for (const pattern of xssPatterns) {
    if (pattern.test(sanitized)) {
      errors.push('XSS pattern detected and escaped');
      sanitized = sanitized
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
      break;
    }
  }

  // Detect path traversal
  if (sanitized.includes('../') || sanitized.includes('..\\')) {
    errors.push('Path traversal detected');
    sanitized = sanitized.replace(/\.\.[\/\\]/g, '');
  }

  // Detect format string attacks
  if (/%[nsx]/i.test(sanitized)) {
    errors.push('Format string pattern detected');
    sanitized = sanitized.replace(/%[nsx]/gi, '');
  }

  return {
    isValid: errors.length === 0 || errors.every(e => e.includes('removed') || e.includes('escaped')),
    sanitized: sanitized.trim(),
    errors
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { title, content, tags } = await req.json();

    console.log('Validating inputs...');

    // Validate title
    const titleValidation = sanitizeString(title, 200);
    if (!titleValidation.isValid) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid title', 
          details: titleValidation.errors 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate content
    const contentValidation = sanitizeString(content, 10000);
    if (!contentValidation.isValid) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid content', 
          details: contentValidation.errors 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate tags array
    if (Array.isArray(tags)) {
      if (tags.length > 20) {
        return new Response(
          JSON.stringify({ error: 'Too many tags (max 20)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      for (const tag of tags) {
        const tagValidation = sanitizeString(tag, 50);
        if (!tagValidation.isValid) {
          return new Response(
            JSON.stringify({ 
              error: 'Invalid tag', 
              details: tagValidation.errors 
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }
    }

    console.log('All inputs validated successfully');
    
    // Log validation warnings if any
    if (titleValidation.errors.length > 0) {
      console.log('Title validation warnings:', titleValidation.errors);
    }
    if (contentValidation.errors.length > 0) {
      console.log('Content validation warnings:', contentValidation.errors);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Input validation passed',
        sanitized: {
          title: titleValidation.sanitized,
          content: contentValidation.sanitized,
          tags: tags
        },
        warnings: {
          title: titleValidation.errors,
          content: contentValidation.errors
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in validation function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
