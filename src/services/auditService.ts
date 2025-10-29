/**
 * Audit Service
 * Centralized audit logging
 */

import { supabase } from "@/integrations/supabase/client";
import { AuthService } from "./authService";

export interface AuditLogEntry {
  action_type: string;
  system_name: string;
  action_details: Record<string, any>;
  compliance_tags?: string[];
}

export class AuditService {
  /**
   * Log an action
   */
  static async logAction(entry: AuditLogEntry): Promise<void> {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        console.error('No authenticated user for audit log');
        return;
      }

      const profile = await AuthService.getUserProfile(user.id);
      if (!profile?.customer_id) {
        console.error('No customer profile found for audit log');
        return;
      }

      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          customer_id: profile.customer_id,
          action_type: entry.action_type,
          system_name: entry.system_name,
          action_details: JSON.parse(JSON.stringify(entry.action_details)),
          compliance_tags: entry.compliance_tags || ['general']
        });

      if (error) {
        console.error('Error logging audit entry:', error);
        throw error;
      }

      console.log(`✅ Audit logged: ${entry.action_type} on ${entry.system_name}`);
    } catch (error) {
      console.error('Failed to log audit entry:', error);
    }
  }

  /**
   * Log privileged access
   */
  static async logPrivilegedAccess(
    system: string,
    action: string,
    details: Record<string, any>
  ): Promise<void> {
    await AuditService.logAction({
      action_type: `privileged_${action}`,
      system_name: system,
      action_details: {
        ...details,
        privileged: true,
        timestamp: new Date().toISOString()
      },
      compliance_tags: ['privileged_access', 'rmm', system.toLowerCase()]
    });
  }
}
