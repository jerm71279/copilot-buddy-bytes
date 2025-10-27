import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type CustomerAccountRow = Database["public"]["Tables"]["customer_accounts"]["Row"];
type CustomerAccountInsert = Database["public"]["Tables"]["customer_accounts"]["Insert"];
type CustomerAccountUpdate = Database["public"]["Tables"]["customer_accounts"]["Update"];

export class CustomerAccountService {
  /**
   * Create a new customer account
   */
  static async createAccount(input: CustomerAccountInsert): Promise<CustomerAccountRow> {
    const { data, error } = await supabase
      .from("customer_accounts")
      .insert(input)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to create account: ${error.message}`);
    if (!data) throw new Error("No data returned after creating account");

    return data;
  }

  /**
   * Update an existing customer account
   */
  static async updateAccount(id: string, updates: CustomerAccountUpdate): Promise<CustomerAccountRow> {
    const { data, error } = await supabase
      .from("customer_accounts")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`Failed to update account: ${error.message}`);
    if (!data) throw new Error("Account not found or update failed");

    return data;
  }

  /**
   * Delete a customer account
   */
  static async deleteAccount(id: string): Promise<void> {
    const { error } = await supabase
      .from("customer_accounts")
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Failed to delete account: ${error.message}`);
  }

  /**
   * Get all customer accounts for a specific customer
   */
  static async getAccountsByCustomer(customerId: string): Promise<CustomerAccountRow[]> {
    const { data, error } = await supabase
      .from("customer_accounts")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to fetch accounts: ${error.message}`);
    return data || [];
  }

  /**
   * Get a single customer account by ID
   */
  static async getAccountById(id: string): Promise<CustomerAccountRow | null> {
    const { data, error } = await supabase
      .from("customer_accounts")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch account: ${error.message}`);
    return data;
  }

  /**
   * Get accounts by status for a customer
   */
  static async getAccountsByStatus(customerId: string, status: string): Promise<CustomerAccountRow[]> {
    const { data, error } = await supabase
      .from("customer_accounts")
      .select("*")
      .eq("customer_id", customerId)
      .eq("account_status", status)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to fetch accounts by status: ${error.message}`);
    return data || [];
  }
}
