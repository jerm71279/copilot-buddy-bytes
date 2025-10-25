import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { action, pipeline } = await req.json();

    if (action === "trigger") {
      // Create a new pipeline run
      const { data: run, error: runError } = await supabase
        .from("etl_pipeline_runs")
        .insert({
          pipeline_name: pipeline,
          status: "running",
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (runError) throw runError;

      // Simulate ETL processing (in production, this would trigger actual jobs)
      setTimeout(async () => {
        await supabase
          .from("etl_pipeline_runs")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", run.id);
      }, 5000);

      return new Response(
        JSON.stringify({ success: true, run_id: run.id }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("ETL orchestration error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
