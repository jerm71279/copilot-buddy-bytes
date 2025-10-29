/**
 * Predictive Analytics Service
 * Centralized data operations for Predictive Analytics Dashboard
 */

import { BaseService, ServiceResponse } from "./baseService";
import { supabase } from "@/integrations/supabase/client";

export class PredictiveAnalyticsService extends BaseService {
  /**
   * Get predictive analytics forecast
   */
  static async getForecast(period: string = '30days'): Promise<ServiceResponse<any>> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase.functions.invoke('predictive-analytics', {
        body: { action: 'forecast', period }
      });
      
      return { data, error };
    });
  }
}
