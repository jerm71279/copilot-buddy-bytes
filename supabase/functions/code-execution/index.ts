import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, language } = await req.json();

    if (language !== "javascript") {
      return new Response(
        JSON.stringify({ error: "Only JavaScript is currently supported" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const startTime = Date.now();
    
    // Create a sandboxed execution environment
    const logs: string[] = [];
    const customConsole = {
      log: (...args: any[]) => logs.push(args.join(" ")),
      error: (...args: any[]) => logs.push(`ERROR: ${args.join(" ")}`),
      warn: (...args: any[]) => logs.push(`WARN: ${args.join(" ")}`),
    };

    let result;
    let success = true;
    let error;

    try {
      // Execute code with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Execution timeout (5s)")), 5000);
      });

      const executionPromise = new Promise((resolve) => {
        try {
          // Create a safer eval context
          const safeEval = new Function(
            "console",
            `"use strict"; ${code}`
          );
          const execResult = safeEval(customConsole);
          resolve(execResult);
        } catch (e) {
          throw e;
        }
      });

      result = await Promise.race([executionPromise, timeoutPromise]);
    } catch (e: any) {
      success = false;
      error = e.message;
    }

    const executionTime = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success,
        result: success ? result : undefined,
        error: error,
        logs,
        execution_time: executionTime,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Code execution error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
