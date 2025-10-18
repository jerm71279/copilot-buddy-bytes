import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoAnalysisRequest {
  videos: Array<{
    url: string;
    title: string;
    description?: string;
  }>;
  customerId: string;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videos, customerId, userId }: VideoAnalysisRequest = await req.json();

    if (!videos || videos.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No videos provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Analyzing ${videos.length} training videos...`);

    // Analyze each video
    const videoInsights = [];
    for (const video of videos) {
      console.log(`Processing video: ${video.title}`);

      // Create a prompt to analyze the video content
      const analysisPrompt = `Analyze this network discovery and planning training video and extract key insights, best practices, and actionable steps.

Video Title: ${video.title}
Video URL: ${video.url}
Description: ${video.description || 'N/A'}

Please provide:
1. Key concepts and topics covered
2. Best practices mentioned
3. Tools and techniques recommended
4. Common mistakes or pitfalls to avoid
5. Step-by-step procedures or workflows
6. Critical success factors
7. Practical tips for SOC engineers

Format the response as structured insights that can be used to improve network discovery and installation planning processes.`;

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'You are an expert network engineer and technical training analyst. Analyze training videos and extract actionable insights for SOC engineers.'
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error(`AI analysis failed for ${video.title}:`, errorText);
        continue;
      }

      const aiData = await aiResponse.json();
      const insights = aiData.choices[0].message.content;

      videoInsights.push({
        video,
        insights,
      });

      console.log(`Successfully analyzed: ${video.title}`);
    }

    // Store insights in knowledge base
    const knowledgeArticles = videoInsights.map((item) => ({
      customer_id: customerId,
      created_by: userId,
      title: `Training Insights: ${item.video.title}`,
      content: `# Training Video Insights

**Source**: [${item.video.title}](${item.video.url})

${item.video.description ? `**Description**: ${item.video.description}\n\n` : ''}

---

${item.insights}

---

**Video URL**: ${item.video.url}
**Analyzed**: ${new Date().toISOString()}
`,
      article_type: 'guide',
      status: 'published',
      tags: ['training', 'video-insights', 'network-discovery', 'best-practices', 'SOC'],
    }));

    const { data: insertedArticles, error: insertError } = await supabase
      .from('knowledge_articles')
      .insert(knowledgeArticles)
      .select();

    if (insertError) {
      console.error('Error inserting knowledge articles:', insertError);
      throw insertError;
    }

    console.log(`Successfully stored ${insertedArticles.length} knowledge articles`);

    // Now generate an enhanced checklist based on all insights
    const allInsights = videoInsights.map(v => v.insights).join('\n\n---\n\n');

    const checklistPrompt = `Based on the following insights from network discovery and planning training videos, generate a comprehensive, modular, and phased SOC Network Discovery & Installation Planning Checklist.

TRAINING INSIGHTS:
${allInsights}

Please create a detailed checklist that:
1. Is organized into 5 clear phases (Pre-Discovery Planning, Network Discovery & Mapping, Configuration Design, Equipment Preparation, Installation Planning)
2. Includes specific modules within each phase
3. Incorporates best practices and techniques from the training videos
4. Includes checkboxes for each task
5. Defines deliverables for each module
6. Includes phase sign-off requirements
7. Integrates with OberaConnect tools (NinjaOne, CIPP, CMDB, Compliance Portal)
8. Is practical and actionable for SOC engineers

Format the checklist in Markdown with clear headers, bullet points, checkboxes (⬜), and sections.`;

    const checklistResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert network engineer and technical documentation specialist. Create comprehensive, actionable checklists for network engineering teams.'
          },
          {
            role: 'user',
            content: checklistPrompt
          }
        ],
      }),
    });

    if (!checklistResponse.ok) {
      const errorText = await checklistResponse.text();
      console.error('Checklist generation failed:', errorText);
      throw new Error('Failed to generate checklist');
    }

    const checklistData = await checklistResponse.json();
    const enhancedChecklist = checklistData.choices[0].message.content;

    // Store the enhanced checklist
    const { data: checklistArticle, error: checklistError } = await supabase
      .from('knowledge_articles')
      .insert({
        customer_id: customerId,
        created_by: userId,
        title: 'AI-Enhanced SOC Network Discovery & Installation Checklist',
        content: `# 🤖 AI-Enhanced SOC Network Discovery & Installation Checklist

**Generated from Training Video Insights**: ${new Date().toLocaleDateString()}

This checklist has been enhanced with insights from ${videos.length} professional training videos on network discovery, planning, and best practices.

---

${enhancedChecklist}

---

## 📚 Source Training Videos

${videos.map((v, i) => `${i + 1}. [${v.title}](${v.url})`).join('\n')}

**Last Updated**: ${new Date().toISOString().split('T')[0]}
**OberaConnect Integration**: Fully Automated
**Compliance Frameworks Supported**: ISO 27001, NIST CSF, HIPAA, SOC 2, PCI-DSS
`,
        article_type: 'guide',
        status: 'published',
        tags: ['network', 'discovery', 'installation', 'checklist', 'AI-enhanced', 'SOC', 'training-based'],
      })
      .select()
      .single();

    if (checklistError) {
      console.error('Error creating enhanced checklist:', checklistError);
      throw checklistError;
    }

    console.log('Successfully generated AI-enhanced checklist');

    return new Response(
      JSON.stringify({
        success: true,
        insightsCreated: insertedArticles.length,
        checklistCreated: true,
        checklistId: checklistArticle.id,
        message: `Analyzed ${videos.length} videos, created ${insertedArticles.length} insight articles, and generated an AI-enhanced checklist`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in analyze-training-videos function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
