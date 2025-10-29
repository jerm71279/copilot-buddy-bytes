/**
 * Application Service
 * Centralized application management
 */

import { supabase } from "@/integrations/supabase/client";

export interface Application {
  id: string;
  name: string;
  description: string | null;
  icon_name: string;
  app_url: string | null;
  category: string;
  auth_type: string;
  is_active?: boolean;
  display_order?: number;
}

export class ApplicationService {
  /**
   * Get all active applications
   */
  static async getActiveApplications() {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get applications accessible by department
   */
  static async getApplicationsByDepartment(department: string) {
    // Get all active applications
    const allApps = await this.getActiveApplications();

    // Get application access for department
    const { data: accessData, error: accessError } = await supabase
      .from('application_access')
      .select('application_id')
      .eq('department', department);

    if (accessError) throw accessError;

    const accessibleAppIds = new Set(accessData?.map(a => a.application_id) || []);
    return allApps.filter(app => accessibleAppIds.has(app.id));
  }
}
