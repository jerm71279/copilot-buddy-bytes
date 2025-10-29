/**
 * Client Portal Service
 * Handles client ticket and portal operations
 */

import { supabase } from "@/integrations/supabase/client";

export interface ClientTicket {
  id: string;
  customer_id: string;
  ticket_number: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  submitted_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export class ClientPortalService {
  /**
   * Get client tickets
   */
  static async getClientTickets(customerId: string) {
    const { data, error } = await supabase
      .from('client_tickets')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as ClientTicket[];
  }

  /**
   * Create client ticket
   */
  static async createClientTicket(ticket: any) {
    const { data, error } = await supabase
      .from('client_tickets')
      .insert([ticket])
      .select()
      .maybeSingle();

    if (error || !data) throw error || new Error('Failed to create ticket');
    return data as ClientTicket;
  }

  /**
   * Update client ticket
   */
  static async updateClientTicket(id: string, updates: Partial<ClientTicket>) {
    const { data, error } = await supabase
      .from('client_tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error || !data) throw error || new Error('Failed to update ticket');
    return data as ClientTicket;
  }

  /**
   * Get ticket by ID
   */
  static async getTicketById(id: string) {
    const { data, error } = await supabase
      .from('client_tickets')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as ClientTicket | null;
  }
}
