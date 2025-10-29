/**
 * Slack Service
 * Handles Slack integration operations
 */

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

export class SlackService {
  /**
   * Send Slack message via edge function
   */
  static async sendMessage(customerId: string, message: SlackMessage) {
    const { data, error } = await supabase.functions.invoke('slack-notify', {
      body: { customerId, ...message }
    });

    if (error) throw error;
    return data;
  }

  /**
   * Test Slack connection
   */
  static async testConnection(customerId: string) {
    return this.sendMessage(customerId, {
      channel: 'general',
      text: 'Test connection from OberaConnect'
    });
  }

  /**
   * Sync Slack users via edge function
   */
  static async syncUsers(customerId: string) {
    const { data, error } = await supabase.functions.invoke('slack-sync-users', {
      body: { customerId }
    });

    if (error) throw error;
    return data;
  }
}
