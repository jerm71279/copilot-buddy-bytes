/**
 * Slack Service
 * Handles Slack integration operations
 */

import { BaseService, ServiceResponse } from "./baseService";
import { supabase } from "@/integrations/supabase/client";

export interface SlackConfig {
  id: string;
  customer_id: string;
  workspace_name?: string;
  webhook_url?: string;
  bot_token?: string;
  channel_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SlackMessage {
  channel: string;
  text: string;
  blocks?: any[];
}

export class SlackService extends BaseService {
  /**
   * Send Slack message via edge function
   */
  static async sendMessage(customerId: string, message: SlackMessage): Promise<ServiceResponse<any>> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase.functions.invoke('slack-notify', {
        body: { customerId, ...message }
      });
      return { data, error };
    });
  }

  /**
   * Test Slack connection
   */
  static async testConnection(customerId: string): Promise<ServiceResponse<any>> {
    return this.sendMessage(customerId, {
      channel: 'general',
      text: 'Test connection from OberaConnect'
    });
  }

  /**
   * Sync Slack users via edge function
   */
  static async syncUsers(customerId: string): Promise<ServiceResponse<any>> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase.functions.invoke('slack-sync-users', {
        body: { customerId }
      });
      return { data, error };
    });
  }
}
