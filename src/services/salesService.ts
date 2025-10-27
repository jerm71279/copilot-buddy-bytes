import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

/**
 * Sales Service
 * Centralizes all sales-related database operations (leads, opportunities, quotes)
 */

// Lead types
type LeadInsert = Database['public']['Tables']['sales_leads']['Insert'];
type LeadUpdate = Database['public']['Tables']['sales_leads']['Update'];
type LeadRow = Database['public']['Tables']['sales_leads']['Row'];

/**
 * Lead Service
 */
export class LeadService {
  static async createLead(input: LeadInsert) {
    const { data, error } = await supabase
      .from('sales_leads')
      .insert([input])
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to create lead: ${error.message}`);
    if (!data) throw new Error('Failed to create lead: No data returned');
    
    return data as LeadRow;
  }

  static async updateLead(id: string, updates: LeadUpdate) {
    const { data, error } = await supabase
      .from('sales_leads')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to update lead: ${error.message}`);
    if (!data) throw new Error('Lead not found');
    
    return data as LeadRow;
  }

  static async deleteLead(id: string) {
    const { error } = await supabase
      .from('sales_leads')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete lead: ${error.message}`);
  }

  static async getLeadsByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('sales_leads')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch leads: ${error.message}`);
    return data as LeadRow[];
  }

  static async getLeadById(id: string) {
    const { data, error } = await supabase
      .from('sales_leads')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch lead: ${error.message}`);
    return data as LeadRow | null;
  }
}

// Opportunity types
type OpportunityInsert = Database['public']['Tables']['sales_opportunities']['Insert'];
type OpportunityUpdate = Database['public']['Tables']['sales_opportunities']['Update'];
type OpportunityRow = Database['public']['Tables']['sales_opportunities']['Row'];

/**
 * Opportunity Service
 */
export class OpportunityService {
  static async createOpportunity(input: OpportunityInsert) {
    const { data, error } = await supabase
      .from('sales_opportunities')
      .insert([input])
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to create opportunity: ${error.message}`);
    if (!data) throw new Error('Failed to create opportunity: No data returned');
    
    return data as OpportunityRow;
  }

  static async updateOpportunity(id: string, updates: OpportunityUpdate) {
    const { data, error } = await supabase
      .from('sales_opportunities')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to update opportunity: ${error.message}`);
    if (!data) throw new Error('Opportunity not found');
    
    return data as OpportunityRow;
  }

  static async deleteOpportunity(id: string) {
    const { error } = await supabase
      .from('sales_opportunities')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete opportunity: ${error.message}`);
  }

  static async getOpportunitiesByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('sales_opportunities')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch opportunities: ${error.message}`);
    return data as OpportunityRow[];
  }

  static async getOpportunityById(id: string) {
    const { data, error } = await supabase
      .from('sales_opportunities')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch opportunity: ${error.message}`);
    return data as OpportunityRow | null;
  }
}

// Quote types
type QuoteInsert = Database['public']['Tables']['sales_quotes']['Insert'];
type QuoteUpdate = Database['public']['Tables']['sales_quotes']['Update'];
type QuoteRow = Database['public']['Tables']['sales_quotes']['Row'];

/**
 * Quote Service
 */
export class QuoteService {
  static async createQuote(input: QuoteInsert) {
    const { data, error } = await supabase
      .from('sales_quotes')
      .insert([input])
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to create quote: ${error.message}`);
    if (!data) throw new Error('Failed to create quote: No data returned');
    
    return data as QuoteRow;
  }

  static async updateQuote(id: string, updates: QuoteUpdate) {
    const { data, error } = await supabase
      .from('sales_quotes')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to update quote: ${error.message}`);
    if (!data) throw new Error('Quote not found');
    
    return data as QuoteRow;
  }

  static async deleteQuote(id: string) {
    const { error } = await supabase
      .from('sales_quotes')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete quote: ${error.message}`);
  }

  static async getQuotesByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('sales_quotes')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch quotes: ${error.message}`);
    return data as QuoteRow[];
  }

  static async getQuoteById(id: string) {
    const { data, error } = await supabase
      .from('sales_quotes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch quote: ${error.message}`);
    return data as QuoteRow | null;
  }
}
