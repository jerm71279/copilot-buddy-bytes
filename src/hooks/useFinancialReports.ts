import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "./useAuth";

export interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  totalPOs: number;
  budgetUtilization: number;
  profitMargin: number;
}

/**
 * useFinancialReports Hook
 * Centralizes financial data fetching and calculations
 * ELIMINATES: Direct database queries in FinancialReporting.tsx
 */
export function useFinancialReports(customerId: string | null) {
  const { checkSessionAndLoad } = useRequireAuth();
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalRevenue: 0,
    totalExpenses: 0,
    totalPOs: 0,
    budgetUtilization: 0,
    profitMargin: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchFinancialData = async () => {
    if (!customerId) {
      setIsLoading(false);
      return;
    }

    try {
      const [invoicesData, expensesData, posData, budgetsData] = await Promise.all([
        supabase.from("invoices").select("total_amount, status").eq("customer_id", customerId),
        supabase.from("expenses").select("amount, approval_status").eq("customer_id", customerId),
        supabase.from("purchase_orders").select("total_amount, status").eq("customer_id", customerId),
        supabase.from("budgets").select("allocated_amount, spent_amount, status").eq("customer_id", customerId),
      ]);

      const totalRevenue = invoicesData.data
        ?.filter(inv => inv.status === "paid")
        .reduce((sum, inv) => sum + parseFloat(inv.total_amount.toString()), 0) || 0;

      const totalExpenses = expensesData.data
        ?.filter(exp => exp.approval_status === "approved")
        .reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0) || 0;

      const totalPOs = posData.data
        ?.filter(po => po.status === "approved")
        .reduce((sum, po) => sum + parseFloat(po.total_amount.toString()), 0) || 0;

      const totalBudget = budgetsData.data
        ?.reduce((sum, budget) => sum + parseFloat(budget.allocated_amount.toString()), 0) || 1;

      const budgetUtilization = (totalExpenses / totalBudget) * 100;
      const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;

      setMetrics({
        totalRevenue,
        totalExpenses,
        totalPOs,
        budgetUtilization,
        profitMargin
      });
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSessionAndLoad(fetchFinancialData);
  }, [customerId]);

  return {
    metrics,
    isLoading,
    refresh: fetchFinancialData
  };
}
