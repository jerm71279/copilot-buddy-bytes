import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyWebhookSignature } from '../_shared/webhookSignature.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client for webhook processing
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get raw request body for signature verification
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);
    console.log('NinjaOne webhook payload:', payload);

    // Optional: Verify webhook signature if secret is configured
    const webhookSecret = Deno.env.get('NINJAONE_WEBHOOK_SECRET');
    if (webhookSecret) {
      const signature = req.headers.get('x-ninjaone-signature');
      if (!signature) {
        console.warn('Webhook signature missing but secret is configured');
        return new Response(
          JSON.stringify({ error: 'Missing webhook signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const isValid = await verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('Webhook signature verified successfully');
    }

    // NinjaOne sends webhooks for ticket updates
    // Payload structure: { event: 'ticket.updated', ticket: {...} }
    
    if (payload.event === 'ticket.updated' || payload.event === 'ticket.created') {
      const ticket = payload.ticket;
      
      if (!ticket?.id) {
        throw new Error('Invalid webhook payload: missing ticket ID');
      }

      // Find change request linked to this ticket
      const { data: changeRequests, error: findError } = await supabase
        .from('change_requests')
        .select('*')
        .eq('ninjaone_ticket_id', ticket.id.toString());

      if (findError) throw findError;

      if (!changeRequests || changeRequests.length === 0) {
        console.log('No change request found for ticket:', ticket.id);
        return new Response(
          JSON.stringify({ success: true, message: 'No linked change request' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update all linked change requests (there should typically be only one)
      for (const cr of changeRequests) {
        // Map NinjaOne ticket status to change request status
        let newStatus = cr.change_status;
        
        switch (ticket.status?.toUpperCase()) {
          case 'OPEN':
          case 'NEW':
            if (cr.change_status === 'draft') {
              newStatus = 'pending_approval';
            }
            break;
          case 'IN_PROGRESS':
          case 'WORKING':
            newStatus = 'in_progress';
            break;
          case 'RESOLVED':
          case 'CLOSED':
            newStatus = 'completed';
            break;
          case 'CANCELLED':
            newStatus = 'cancelled';
            break;
        }

        const { error: updateError } = await supabase
          .from('change_requests')
          .update({
            ninjaone_ticket_status: ticket.status,
            ninjaone_ticket_synced_at: new Date().toISOString(),
            change_status: newStatus,
          })
          .eq('id', cr.id);

        if (updateError) {
          console.error('Error updating change request:', updateError);
        } else {
          console.log(`Updated change request ${cr.change_number} to status ${newStatus}`);
          
          // Log the sync
          await supabase
            .from('audit_logs')
            .insert({
              customer_id: cr.customer_id,
              user_id: cr.requested_by,
              system_name: 'change_management',
              action_type: 'ninjaone_ticket_synced',
              action_details: {
                change_request_id: cr.id,
                change_number: cr.change_number,
                ticket_id: ticket.id,
                old_status: cr.change_status,
                new_status: newStatus,
                ticket_status: ticket.status,
              },
              compliance_tags: ['change_management', 'ninjaone_integration', 'webhook'],
            });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          updated: changeRequests.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Event not processed',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('NinjaOne webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
