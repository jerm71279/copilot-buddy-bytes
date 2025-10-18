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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestData = await req.json();

    // Validate input body shape
    if (!requestData || typeof requestData !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { vendorId, customerId, vendorName } = requestData as { vendorId?: string; customerId?: string; vendorName?: string };

    if (!vendorId || !customerId || !vendorName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: vendorId, customerId, vendorName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Extracting API key instructions for vendor:', vendorName);

    // Fetch all documentation articles for this vendor
    const { data: articles, error: fetchError } = await supabase
      .from('knowledge_articles')
      .select('title, content')
      .eq('vendor_id', vendorId)
      .eq('customer_id', customerId)
      .eq('article_type', 'documentation')
      .limit(10);

    if (fetchError) {
      throw new Error(`Failed to fetch documentation: ${fetchError.message}`);
    }

    if (!articles || articles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No documentation found for this vendor' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Combine all documentation content
    const combinedContent = articles
      .map(article => `# ${article.title}\n\n${article.content}`)
      .join('\n\n---\n\n')
      .slice(0, 50000); // Limit to 50k chars to stay within token limits

    console.log('Combined content length:', combinedContent.length);

    // Use Lovable AI to extract API key instructions
    const systemPrompt = `You are an expert technical documentation analyst. Your task is to extract clear, step-by-step instructions for obtaining API keys from vendor documentation.

Extract and structure the following information:
1. Where to find/create API keys (exact location in their portal/dashboard)
2. Required permissions or scopes needed
3. Prerequisites (account requirements, verification steps, etc.)
4. Step-by-step instructions to generate the API key
5. Important security notes or best practices
6. Any additional credentials needed (client ID, secret, tenant ID, etc.)

Format your response as a structured JSON object with these fields:
{
  "summary": "Brief overview of the API key process",
  "location": "Where to access the API key settings",
  "prerequisites": ["List of prerequisites"],
  "steps": ["Step 1", "Step 2", "Step 3", ...],
  "requiredCredentials": ["API Key", "Client ID", etc.],
  "permissions": ["List of required permissions/scopes"],
  "securityNotes": ["Important security considerations"],
  "additionalInfo": "Any other relevant information"
}

If you cannot find clear API key instructions, return an error message in the summary field.`;

    const userPrompt = `Extract API key setup instructions for ${vendorName} from the following documentation:\n\n${combinedContent}`;

    // Call Lovable AI Gateway (OpenAI-compatible)
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required, please add funds to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: `AI gateway error: ${aiResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const extractedContent = aiData.choices[0]?.message?.content || '';

    console.log('AI extracted content:', extractedContent.slice(0, 500));

    // Try to parse as JSON, if it fails, return raw content
    let instructions;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = extractedContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      instructions = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.warn('Failed to parse AI response as JSON, returning raw content');
      instructions = {
        summary: extractedContent,
        location: '',
        prerequisites: [],
        steps: [],
        requiredCredentials: [],
        permissions: [],
        securityNotes: [],
        additionalInfo: ''
      };
    }

    // Store the extracted instructions in the vendor record
    const { error: updateError } = await supabase
      .from('documentation_vendors')
      .update({
        api_key_instructions: instructions,
        updated_at: new Date().toISOString()
      })
      .eq('id', vendorId)
      .eq('customer_id', customerId);

    if (updateError) {
      console.error('Failed to save instructions to vendor:', updateError);
      // Don't fail the request, just log the error
    }

    return new Response(
      JSON.stringify({
        success: true,
        vendorName,
        instructions
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-api-instructions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
