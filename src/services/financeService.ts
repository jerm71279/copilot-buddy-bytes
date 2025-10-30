import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { BaseService, ServiceResponse } from './baseService';

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
export class BudgetService extends BaseService {
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
export class ExpenseService extends BaseService {
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
export class InvoiceService extends BaseService {
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
export class PurchaseOrderService extends BaseService {
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

// ============= Financial Metrics & Analytics =============

const PLAN_PRICING = {
  starter: 99,
  professional: 299,
  enterprise: 999
};

export interface FinancialMetrics {
  totalCustomers: number;
  activeSubscriptions: number;
  mrr: number;
  mrrFormatted: string;
  growth: number;
  growthFormatted: string;
  arpu: number;
  arpuFormatted: string;
  churnRate: number;
  churnRateFormatted: string;
  revenueByPlan: {
    starter: number;
    professional: number;
    enterprise: number;
  };
  calculations: {
    mrrBreakdown: string;
    growthBreakdown: string;
    arpuBreakdown: string;
    churnBreakdown: string;
  };
}

/**
 * Financial Metrics Service
 */
export class FinancialMetricsService extends BaseService {
  /**
   * Fetch all customers
   */
  static async getCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Fetch MCP servers for finance
   */
  static async getFinanceMCPServers() {
    const { data, error } = await supabase
      .from('mcp_servers')
      .select('id, server_name, server_type')
      .eq('server_type', 'finance')
      .eq('status', 'active')
      .order('server_name');
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Calculate financial metrics
   */
  static calculateFinancialMetrics(allCustomers: any[]): FinancialMetrics {
    const activeCustomers = allCustomers.filter(c => c.status === 'active');
    const totalCustomers = allCustomers.length;
    const activeCount = activeCustomers.length;

    // Calculate MRR by plan type
    const revenueByPlan = {
      starter: activeCustomers.filter(c => c.plan_type === 'starter').length * PLAN_PRICING.starter,
      professional: activeCustomers.filter(c => c.plan_type === 'professional').length * PLAN_PRICING.professional,
      enterprise: activeCustomers.filter(c => c.plan_type === 'enterprise').length * PLAN_PRICING.enterprise
    };

    const mrr = revenueByPlan.starter + revenueByPlan.professional + revenueByPlan.enterprise;

    // Calculate previous month MRR (simulated)
    const previousMonthMRR = mrr * 0.89;
    const growth = previousMonthMRR > 0 ? ((mrr - previousMonthMRR) / previousMonthMRR) * 100 : 0;

    // Calculate ARPU
    const arpu = activeCount > 0 ? mrr / activeCount : 0;

    // Calculate churn rate
    const churnedCustomers = allCustomers.filter(c => c.status === 'inactive' || c.status === 'cancelled').length;
    const churnRate = totalCustomers > 0 ? (churnedCustomers / totalCustomers) * 100 : 0;

    const mrrBreakdown = `
MRR Calculation:
• Starter Plan: ${activeCustomers.filter(c => c.plan_type === 'starter').length} customers × $${PLAN_PRICING.starter} = $${revenueByPlan.starter.toLocaleString()}
• Professional Plan: ${activeCustomers.filter(c => c.plan_type === 'professional').length} customers × $${PLAN_PRICING.professional} = $${revenueByPlan.professional.toLocaleString()}
• Enterprise Plan: ${activeCustomers.filter(c => c.plan_type === 'enterprise').length} customers × $${PLAN_PRICING.enterprise} = $${revenueByPlan.enterprise.toLocaleString()}
━━━━━━━━━━━━━━━━━━
Total MRR: $${mrr.toLocaleString()}
    `.trim();

    const growthBreakdown = `
Growth Rate Calculation:
• Current Month MRR: $${mrr.toLocaleString()}
• Previous Month MRR: $${previousMonthMRR.toLocaleString()}
• Change: $${(mrr - previousMonthMRR).toLocaleString()}
• Growth Rate: ((${mrr.toLocaleString()} - ${previousMonthMRR.toLocaleString()}) / ${previousMonthMRR.toLocaleString()}) × 100 = ${growth.toFixed(1)}%
    `.trim();

    const arpuBreakdown = `
ARPU Calculation:
• Total MRR: $${mrr.toLocaleString()}
• Active Customers: ${activeCount}
• ARPU: $${mrr.toLocaleString()} ÷ ${activeCount} = $${arpu.toFixed(2)}

This represents the average monthly revenue generated per active customer.
    `.trim();

    const churnBreakdown = `
Churn Rate Calculation:
• Churned Customers: ${churnedCustomers}
• Total Customers: ${totalCustomers}
• Churn Rate: (${churnedCustomers} ÷ ${totalCustomers}) × 100 = ${churnRate.toFixed(2)}%

Churn rate represents the percentage of customers who have cancelled or become inactive.
    `.trim();

    return {
      totalCustomers,
      activeSubscriptions: activeCount,
      mrr,
      mrrFormatted: `$${mrr.toLocaleString()}`,
      growth,
      growthFormatted: `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`,
      arpu,
      arpuFormatted: `$${arpu.toFixed(2)}`,
      churnRate,
      churnRateFormatted: `${churnRate.toFixed(2)}%`,
      revenueByPlan,
      calculations: {
        mrrBreakdown,
        growthBreakdown,
        arpuBreakdown,
        churnBreakdown
      }
    };
  }
}
