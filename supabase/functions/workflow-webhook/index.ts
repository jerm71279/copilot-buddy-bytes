import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const webhookId = url.searchParams.get('id');

    if (!webhookId) {
      return new Response(
        JSON.stringify({ error: 'Webhook ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Webhook triggered: ${webhookId}`);

    // Get webhook payload
    const payload = await req.json();
    console.log('Webhook payload:', payload);

    // Find the trigger
    const { data: trigger, error: triggerError } = await supabase
      .from('workflow_triggers')
      .select('*, workflows(*)')
      .eq('id', webhookId)
      .eq('trigger_type', 'webhook')
      .eq('is_enabled', true)
      .single();

    if (triggerError || !trigger) {
      console.error('Trigger not found or disabled:', triggerError);
      return new Response(
        JSON.stringify({ error: 'Webhook not found or disabled' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify webhook signature if configured
    const signature = req.headers.get('x-webhook-signature');
    if (trigger.webhook_secret && signature) {
      const isValid = await verifyWebhookSignature(
        JSON.stringify(payload),
        signature,
        trigger.webhook_secret
      );

      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Update last triggered timestamp
    await supabase
      .from('workflow_triggers')
      .update({ last_triggered_at: new Date().toISOString() })
      .eq('id', webhookId);

    // Execute the workflow
    const executionResult = await supabase.functions.invoke('workflow-executor', {
      body: {
        workflow_id: trigger.workflow_id,
        trigger_data: payload,
        triggered_by: 'webhook'
      }
    });

    if (executionResult.error) {
      console.error('Workflow execution error:', executionResult.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to execute workflow',
          details: executionResult.error
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Workflow execution started successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Workflow execution started',
        execution_id: executionResult.data?.execution_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBuffer = hexToBuffer(signature);
    const dataBuffer = encoder.encode(payload);

    return await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBuffer,
      dataBuffer
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
}
