import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import {
  sanitizeUnicode,
  detectPromptInjection,
  createSecureSystemPrompt,
  addInputDelimiters,
  filterOutput,
  trackThreat,
} from '../_shared/promptSecurity.ts';
import {
  logSecurityEvent,
  createPromptInjectionLog,
  createRateLimitLog,
} from '../_shared/securityAudit.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VisionRequest {
  imageUrl?: string;
  imageBase64?: string;
  prompt: string;
  analysisType: string;
  customerId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestData: VisionRequest = await req.json();

    if (!requestData.prompt || !requestData.analysisType || !requestData.customerId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: prompt, analysisType, customerId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Sanitize and validate prompt
    let prompt = sanitizeUnicode(requestData.prompt);
    const analysisType = sanitizeUnicode(requestData.analysisType);
    
    const injectionCheck = detectPromptInjection(prompt);
    if (!injectionCheck.isValid) {
      console.warn(`Prompt injection detected in vision analysis: ${injectionCheck.threat}`);
      
      await logSecurityEvent(
        supabase,
        createPromptInjectionLog(
          'vision-analyzer',
          user.id,
          requestData.customerId,
          injectionCheck.threat || 'unknown',
          injectionCheck.confidence,
          prompt,
          true
        )
      );
      
      const allowed = trackThreat(user.id, injectionCheck.threat || 'unknown');
      if (!allowed) {
        await logSecurityEvent(
          supabase,
          createRateLimitLog('vision-analyzer', user.id, requestData.customerId, 5)
        );
        
        return new Response(JSON.stringify({ 
          error: 'Too many suspicious requests',
          code: 'RATE_LIMITED'
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      return new Response(JSON.stringify({ 
        error: 'Request contains suspicious content',
        threat: injectionCheck.threat
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!requestData.imageUrl && !requestData.imageBase64) {
      return new Response(
        JSON.stringify({ error: "Either imageUrl or imageBase64 is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing vision analysis:", { 
      analysisType: requestData.analysisType,
      hasImage: !!requestData.imageUrl || !!requestData.imageBase64
    });

    // Build the content array for the AI request with delimiters
    const content: any[] = [
      {
        type: "text",
        text: addInputDelimiters(prompt)
      }
    ];

    // Add image to content
    if (requestData.imageUrl) {
      content.push({
        type: "image_url",
        image_url: {
          url: requestData.imageUrl
        }
      });
    } else if (requestData.imageBase64) {
      content.push({
        type: "image_url",
        image_url: {
          url: requestData.imageBase64.startsWith("data:") 
            ? requestData.imageBase64 
            : `data:image/jpeg;base64,${requestData.imageBase64}`
        }
      });
    }

    // Call Lovable AI with vision capabilities
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: content
          }
        ]
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI API error: ${aiResponse.status}`);
    }

     const aiData = await aiResponse.json();
    let analysisResult = aiData.choices[0].message.content;
    
    // SECURITY: Filter output to prevent data exfiltration
    analysisResult = filterOutput(analysisResult);
    
    const processingTime = Date.now() - startTime;

    // Extract confidence score if present in the response
    let confidenceScore = null;
    const confidenceMatch = analysisResult.match(/confidence[:\s]+(\d+(?:\.\d+)?)/i);
    if (confidenceMatch) {
      confidenceScore = parseFloat(confidenceMatch[1]);
      if (confidenceScore > 1) confidenceScore = confidenceScore / 100;
    }

    // Save vision analysis to database
    const { error: insertError } = await supabase
      .from("ai_vision_analysis")
      .insert({
        customer_id: requestData.customerId,
        user_id: user.id,
        image_url: requestData.imageUrl || "base64_image",
        analysis_type: requestData.analysisType,
        prompt: requestData.prompt,
        result: {
          analysis: analysisResult,
          model: "google/gemini-2.5-flash",
          timestamp: new Date().toISOString()
        },
        confidence_score: confidenceScore,
        processing_time_ms: processingTime,
        model_used: "google/gemini-2.5-flash"
      });

    if (insertError) {
      console.error("Error saving vision analysis:", insertError);
    }

    console.log("Vision analysis completed:", {
      processingTime,
      confidenceScore,
      resultLength: analysisResult.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisResult,
        confidenceScore,
        processingTime,
        model: "google/gemini-2.5-flash"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Vision analyzer error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error",
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
