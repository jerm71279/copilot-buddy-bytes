import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData = await req.json();
    
    // Validate input
    if (!requestData || typeof requestData !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const action = String(requestData.action || '').slice(0, 100);
    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'create_service_request': {
        const customerId = requestData.customerId;
        const serviceId = requestData.serviceId;
        const requestedBy = requestData.requestedBy;
        const title = String(requestData.title || '').slice(0, 200);
        const description = String(requestData.description || '').slice(0, 2000);
        const priority = String(requestData.priority || '').slice(0, 50);
        const formData = requestData.formData;
        
        if (!customerId || !serviceId || !title) {
          return new Response(
            JSON.stringify({ error: 'Required fields missing' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { data: service } = await supabase
          .from('service_catalog')
          .select('*')
          .eq('id', serviceId)
          .maybeSingle();

        if (!service) throw new Error('Service not found');

        // Calculate due date based on SLA
        const dueDate = service.sla_hours 
          ? new Date(Date.now() + service.sla_hours * 60 * 60 * 1000).toISOString()
          : null;

        const status = service.requires_approval ? 'pending_approval' : 'approved';

        const { data: request, error } = await supabase
          .from('service_requests')
          .insert({
            customer_id: customerId,
            service_id: serviceId,
            requested_by: requestedBy,
            title,
            description,
            priority,
            status,
            form_data: formData || {},
            due_date: dueDate
          })
          .select()
          .maybeSingle();

        if (error) throw error;
        if (!request) {
          throw new Error('Failed to create service request');
        }

        return new Response(
          JSON.stringify({ success: true, request }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create_ticket': {
        const customerId = requestData.customerId;
        const submittedBy = requestData.submittedBy;
        const subject = String(requestData.subject || '').slice(0, 200);
        const description = String(requestData.description || '').slice(0, 2000);
        const priority = String(requestData.priority || '').slice(0, 50);
        const category = String(requestData.category || '').slice(0, 100);
        
        if (!customerId || !subject) {
          return new Response(
            JSON.stringify({ error: 'Required fields missing' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { data: ticket, error } = await supabase
          .from('client_tickets')
          .insert({
            customer_id: customerId,
            submitted_by: submittedBy,
            subject,
            description,
            priority,
            category,
            status: 'open'
          })
          .select()
          .maybeSingle();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, ticket }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'add_ticket_comment': {
        const ticketId = requestData.ticketId;
        const authorId = requestData.authorId;
        const authorType = String(requestData.authorType || '').slice(0, 50);
        const comment = String(requestData.comment || '').slice(0, 2000);
        const isInternal = requestData.isInternal;
        
        if (!ticketId || !comment) {
          return new Response(
            JSON.stringify({ error: 'Required fields missing' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { data, error } = await supabase
          .from('ticket_comments')
          .insert({
            ticket_id: ticketId,
            author_id: authorId,
            author_type: authorType,
            comment,
            is_internal: isInternal || false
          })
          .select()
          .maybeSingle();

        if (error) throw error;

        // Update ticket status if first response
        const { data: ticket } = await supabase
          .from('client_tickets')
          .select('first_response_at')
          .eq('id', ticketId)
          .maybeSingle();

        if (ticket && !ticket.first_response_at && authorType === 'staff') {
          await supabase
            .from('client_tickets')
            .update({ 
              first_response_at: new Date().toISOString(),
              status: 'in_progress'
            })
            .eq('id', ticketId);
        }

        return new Response(
          JSON.stringify({ success: true, comment: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_ticket_status': {
        const ticketId = requestData.ticketId;
        const status = String(requestData.status || '').slice(0, 50);
        const resolution = String(requestData.resolution || '').slice(0, 2000);
        
        if (!ticketId || !status) {
          return new Response(
            JSON.stringify({ error: 'Required fields missing' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const updates: any = { status };
        
        if (status === 'resolved' || status === 'closed') {
          updates.resolved_at = new Date().toISOString();
          if (resolution) updates.resolution = resolution;
        }

        const { error } = await supabase
          .from('client_tickets')
          .update(updates)
          .eq('id', ticketId);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, message: 'Ticket updated successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_portal_stats': {
        const customerId = requestData.customerId;
        
        if (!customerId) {
          return new Response(
            JSON.stringify({ error: 'Customer ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Get statistics for the customer portal
        const [
          { count: openTickets },
          { count: activeRequests },
          { data: recentTickets }
        ] = await Promise.all([
          supabase
            .from('client_tickets')
            .select('*', { count: 'exact', head: true })
            .eq('customer_id', customerId)
            .in('status', ['open', 'assigned', 'in_progress']),
          supabase
            .from('service_requests')
            .select('*', { count: 'exact', head: true })
            .eq('customer_id', customerId)
            .in('status', ['submitted', 'pending_approval', 'approved', 'in_progress']),
          supabase
            .from('client_tickets')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false })
            .limit(5)
        ]);

        return new Response(
          JSON.stringify({ 
            success: true, 
            stats: {
              openTickets: openTickets || 0,
              activeRequests: activeRequests || 0,
              recentTickets: recentTickets || []
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Client portal error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
