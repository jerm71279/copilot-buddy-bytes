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

// Expense types
type ExpenseInsert = Database['public']['Tables']['expenses']['Insert'];
type ExpenseUpdate = Database['public']['Tables']['expenses']['Update'];
type ExpenseRow = Database['public']['Tables']['expenses']['Row'];

/**
 * Expense Service
 */
export class ExpenseService {
  static async createExpense(input: ExpenseInsert) {
    const { data, error } = await supabase
      .from('expenses')
      .insert([input])
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to create expense: ${error.message}`);
    if (!data) throw new Error('Failed to create expense: No data returned');
    
    return data as ExpenseRow;
  }

  static async updateExpense(id: string, updates: ExpenseUpdate) {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to update expense: ${error.message}`);
    if (!data) throw new Error('Expense not found');
    
    return data as ExpenseRow;
  }

  static async deleteExpense(id: string) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete expense: ${error.message}`);
  }

  static async getExpensesByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('customer_id', customerId)
      .order('expense_date', { ascending: false });

    if (error) throw new Error(`Failed to fetch expenses: ${error.message}`);
    return data as ExpenseRow[];
  }

  static async getExpenseById(id: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch expense: ${error.message}`);
    return data as ExpenseRow | null;
  }
}

// Invoice types
type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
type InvoiceUpdate = Database['public']['Tables']['invoices']['Update'];
type InvoiceRow = Database['public']['Tables']['invoices']['Row'];

/**
 * Invoice Service
 */
export class InvoiceService {
  static async createInvoice(input: InvoiceInsert) {
    const { data, error } = await supabase
      .from('invoices')
      .insert([input])
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to create invoice: ${error.message}`);
    if (!data) throw new Error('Failed to create invoice: No data returned');
    
    return data as InvoiceRow;
  }

  static async updateInvoice(id: string, updates: InvoiceUpdate) {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to update invoice: ${error.message}`);
    if (!data) throw new Error('Invoice not found');
    
    return data as InvoiceRow;
  }

  static async deleteInvoice(id: string) {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete invoice: ${error.message}`);
  }

  static async getInvoicesByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('customer_id', customerId)
      .order('issue_date', { ascending: false });

    if (error) throw new Error(`Failed to fetch invoices: ${error.message}`);
    return data as InvoiceRow[];
  }

  static async getInvoiceById(id: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch invoice: ${error.message}`);
    return data as InvoiceRow | null;
  }
}

// Purchase Order types
type PurchaseOrderInsert = Database['public']['Tables']['purchase_orders']['Insert'];
type PurchaseOrderUpdate = Database['public']['Tables']['purchase_orders']['Update'];
type PurchaseOrderRow = Database['public']['Tables']['purchase_orders']['Row'];

/**
 * Purchase Order Service
 */
export class PurchaseOrderService {
  static async createPurchaseOrder(input: PurchaseOrderInsert) {
    const { data, error } = await supabase
      .from('purchase_orders')
      .insert([input])
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to create purchase order: ${error.message}`);
    if (!data) throw new Error('Failed to create purchase order: No data returned');
    
    return data as PurchaseOrderRow;
  }

  static async updatePurchaseOrder(id: string, updates: PurchaseOrderUpdate) {
    const { data, error } = await supabase
      .from('purchase_orders')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to update purchase order: ${error.message}`);
    if (!data) throw new Error('Purchase order not found');
    
    return data as PurchaseOrderRow;
  }

  static async deletePurchaseOrder(id: string) {
    const { error } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete purchase order: ${error.message}`);
  }

  static async getPurchaseOrdersByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch purchase orders: ${error.message}`);
    return data as PurchaseOrderRow[];
  }

  static async getPurchaseOrderById(id: string) {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch purchase order: ${error.message}`);
    return data as PurchaseOrderRow | null;
  }
}
