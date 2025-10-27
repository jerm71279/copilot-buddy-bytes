import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

/**
 * Finance Service
 * Centralizes all finance-related database operations (budgets, expenses, invoices, purchase orders)
 */

// Type aliases from database
type BudgetInsert = Database['public']['Tables']['budgets']['Insert'];
type BudgetUpdate = Database['public']['Tables']['budgets']['Update'];
type BudgetRow = Database['public']['Tables']['budgets']['Row'];

/**
 * Budget Service
 */
export class BudgetService {
  /**
   * Create a new budget
   */
  static async createBudget(input: BudgetInsert) {
    const { data, error } = await supabase
      .from('budgets')
      .insert([input])
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to create budget: ${error.message}`);
    if (!data) throw new Error('Failed to create budget: No data returned');
    
    return data as BudgetRow;
  }

  /**
   * Update an existing budget
   */
  static async updateBudget(id: string, updates: BudgetUpdate) {
    const { data, error } = await supabase
      .from('budgets')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to update budget: ${error.message}`);
    if (!data) throw new Error('Budget not found');
    
    return data as BudgetRow;
  }

  /**
   * Delete a budget
   */
  static async deleteBudget(id: string) {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete budget: ${error.message}`);
  }

  /**
   * Get budgets by customer
   */
  static async getBudgetsByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('customer_id', customerId)
      .order('period_start', { ascending: false });

    if (error) throw new Error(`Failed to fetch budgets: ${error.message}`);
    return data as BudgetRow[];
  }

  /**
   * Get budget by ID
   */
  static async getBudgetById(id: string) {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch budget: ${error.message}`);
    return data as BudgetRow | null;
  }
}

/**
 * TODO: Add ExpenseService, InvoiceService, PurchaseOrderService
 * Following the same pattern as BudgetService above
 */
