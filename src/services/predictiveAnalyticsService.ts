/**
 * Predictive Analytics Service
 * Centralized data operations for Predictive Analytics Dashboard
 */

import { supabase } from "@/integrations/supabase/client";

export class PredictiveAnalyticsService {
  /**
   * Get predictive analytics forecast
   */
  static async getForecast(period: string = '30days') {
    const { data, error } = await supabase.functions.invoke('predictive-analytics', {
      body: { action: 'forecast', period }
    });
    
    if (error) throw error;
    return data;
  }
}
