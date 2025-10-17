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
    const { projectName, vendors, deploymentType, customRequirements } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch relevant documentation for selected vendors
    const { data: docs, error: docsError } = await supabase
      .from('knowledge_articles')
      .select('title, content, vendor_id, documentation_vendors(vendor_name)')
      .in('vendor_id', vendors)
      .eq('source_type', 'vendor_documentation');

    if (docsError) {
      console.error('Error fetching docs:', docsError);
      throw new Error('Failed to fetch vendor documentation');
    }

    // Build context from documentation
    const docContext = docs?.map(doc => {
      const vendors = doc.documentation_vendors as any;
      const vendorName = Array.isArray(vendors) 
        ? vendors[0]?.vendor_name 
        : vendors?.vendor_name;
      return `Vendor: ${vendorName}\nTitle: ${doc.title}\nContent: ${doc.content?.substring(0, 2000)}`;
    }).join('\n\n---\n\n') || '';

    const systemPrompt = `You are an expert SOC engineer assistant specializing in network equipment pre-deployment configuration. 
Generate a comprehensive, actionable configuration checklist for network equipment deployment.

Base your recommendations on the provided vendor documentation and industry best practices.

Output format:
# [Project Name] - Pre-Deployment Configuration Checklist

## 1. Firewall Configuration (if applicable)
- [ ] Specific configuration item
- [ ] Another configuration item
(Include vendor-specific steps from documentation)

## 2. Switch Configuration (if applicable)
- [ ] Configuration step
- [ ] Port configurations
(Include vendor-specific VLAN, trunking, etc.)

## 3. Access Point Configuration (if applicable)
- [ ] SSID configuration
- [ ] Security settings
(Include vendor-specific wireless best practices)

## 4. Security & Compliance
- [ ] Security checklist items
- [ ] Compliance requirements

## 5. Testing & Validation
- [ ] Pre-deployment tests
- [ ] Validation procedures

## 6. Documentation
- [ ] Configuration backup
- [ ] Change log entries

Be specific, technical, and reference vendor documentation when applicable.`;

    const userPrompt = `Project: ${projectName}
Deployment Type: ${deploymentType}
Vendors: ${vendors.join(', ')}
${customRequirements ? `Custom Requirements: ${customRequirements}` : ''}

Using the following vendor documentation, generate a detailed pre-deployment configuration checklist:

${docContext}`;

    console.log('Calling Lovable AI for checklist generation...');
    
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
        max_completion_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const checklist = aiData.choices[0].message.content;

    return new Response(
      JSON.stringify({ 
        success: true, 
        checklist,
        vendorDocs: docs?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});