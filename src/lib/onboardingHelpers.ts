import { supabase } from "@/integrations/supabase/client";

interface OnboardingParams {
  userId: string;
  customerId: string;
  fullName: string;
  emailUsername: string;
  departmentType?: string;
  jobTitle?: string;
  startDate?: string;
}

/**
 * Create employee onboarding record
 */
export async function createEmployeeOnboarding(params: OnboardingParams) {
  const {
    userId,
    customerId,
    fullName,
    emailUsername,
    departmentType = "general",
    jobTitle = "Employee",
    startDate = new Date().toISOString().split("T")[0]
  } = params;

  const fullEmail = `${emailUsername}@oberaconnect.com`;

  const { data, error } = await supabase
    .from("employee_onboardings")
    .insert({
      customer_id: customerId,
      created_by: userId,
      employee_name: fullName,
      employee_email: fullEmail,
      department: departmentType,
      job_title: jobTitle,
      start_date: startDate,
      status: "not_started"
    })
    .select()
    .maybeSingle();

  return { data, error };
}

/**
 * Get or create default customer
 */
export async function getOrCreateDefaultCustomer() {
  const companyName = "OBERACONNECT, LLC";
  const defaultEmail = "admin@oberaconnect.com";
  const defaultContact = "Administrator";

  // Try to get existing customer
  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("company_name", companyName)
    .maybeSingle();

  if (existingCustomer) {
    return { customerId: existingCustomer.id, error: null };
  }

  // Create new customer with required fields
  const { data: newCustomer, error } = await supabase
    .from("customers")
    .insert({ 
      company_name: companyName,
      contact_name: defaultContact,
      email: defaultEmail
    })
    .select("id")
    .maybeSingle();

  if (error || !newCustomer) {
    return { customerId: null, error: error || new Error("Failed to create customer") };
  }

  return { customerId: newCustomer.id, error: null };
}

/**
 * Link user profile to customer
 */
export async function linkUserToCustomer(userId: string, customerId: string) {
  const { error } = await supabase
    .from("user_profiles")
    .update({ customer_id: customerId })
    .eq("user_id", userId);

  return { error };
}
