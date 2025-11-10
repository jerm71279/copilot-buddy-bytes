import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema for the incoming MCP request
const mcpRequestSchema = z.object({
  tool_name: z.string().trim().min(1, "Tool name is required").max(100, "Tool name too long"),
  server_id: z.string().uuid("Invalid server ID format"),
  customer_id: z.string().uuid("Invalid customer ID format"),
  user_id: z.string().uuid("Invalid user ID format").optional(),
  input_data: z.record(z.any()).optional(),
});

// Maximum payload size (1MB)
const MAX_PAYLOAD_SIZE = 1024 * 1024;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check payload size
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Payload too large. Maximum size is 1MB' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestBody = await req.json();
    
    // Validate input
    const validatedInput = mcpRequestSchema.parse(requestBody);
    const { tool_name, server_id, customer_id, user_id, input_data } = validatedInput;

    const startTime = Date.now();
    let output_data: any = null;
    let status = 'success';
    let error_message = null;

    try {
      // 1. Fetch tool definition from mcp_tools table
      const { data: toolDefinition, error: toolError } = await supabaseClient
        .from('mcp_tools')
        .select('*')
        .eq('name', tool_name)
        .single();

      if (toolError || !toolDefinition) {
        throw new Error(`Tool '${tool_name}' not found or database error: ${toolError?.message}`);
      }

      // 2. Validate input_data against the tool's parameter schema
      const toolParametersSchema = z.object(
        Object.fromEntries(
          Object.entries(toolDefinition.parameters).map(([key, value]: [string, any]) => {
            let schema = z.any(); // Default to any
            switch (value.type) {
              case 'string': schema = z.string(); break;
              case 'number': schema = z.number(); break;
              case 'boolean': schema = z.boolean(); break;
              case 'array': schema = z.array(z.any()); break; // Further refine if item type is known
              case 'object': schema = z.record(z.any()); break;
            }
            return [key, value.required ? schema : schema.optional()];
          })
        )
      );
      
      const validatedToolInput = toolParametersSchema.parse(input_data);

      // 3. Fetch user profile to check permissions
      if (!user_id) {
        throw new Error("User ID is required for permission check.");
      }
      const { data: userProfile, error: profileError } = await supabaseClient
        .from('user_profiles')
        .select('department')
        .eq('user_id', user_id)
        .single();

      if (profileError || !userProfile) {
        throw new Error(`Failed to fetch user profile: ${profileError?.message}`);
      }

      // 4. Permission Check
      const userDepartment = userProfile.department;
      const requiredPermissions = toolDefinition.required_permissions || [];
      
      if (requiredPermissions.length > 0 && !requiredPermissions.includes(userDepartment)) {
        throw new Error(`Permission denied. User with department '${userDepartment}' cannot execute this tool.`);
      }

      // 5. Dynamically invoke the specified Edge Function
      const { data: invokedFunctionData, error: invokedFunctionError } = await supabaseClient.functions.invoke(
        toolDefinition.edge_function,
        {
          body: {
            action: toolDefinition.edge_function_action,
            customerId: customer_id, // Pass customer_id to the invoked function
            userId: user_id,         // Pass user_id to the invoked function
            ...validatedToolInput,   // Pass validated input data
          },
        }
      );

      if (invokedFunctionError) {
        throw new Error(`Error invoking function '${toolDefinition.edge_function}': ${invokedFunctionError.message}`);
      }
      output_data = invokedFunctionData;

    } catch (error) {
      status = 'error';
      error_message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error executing ${tool_name}:`, error);
    }

    const execution_time_ms = Date.now() - startTime;

    // Log execution
    await supabaseClient.from('mcp_execution_logs').insert({
      server_id,
      customer_id,
      user_id,
      tool_name,
      input_data,
      output_data,
      status,
      execution_time_ms,
      error_message,
    });

    // Update tool statistics (optional, ignore errors)
    try {
      await supabaseClient.rpc('increment_tool_execution', {
        tool_name_param: tool_name,
        server_id_param: server_id,
        exec_time: execution_time_ms,
      });
    } catch (rpcError) {
      console.log('Could not update tool statistics:', rpcError);
    }

    return new Response(
      JSON.stringify({ 
        success: status === 'success',
        data: output_data,
        execution_time_ms,
        error: error_message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('MCP Server Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});