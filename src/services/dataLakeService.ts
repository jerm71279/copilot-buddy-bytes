/**
 * Data Lake Service
 * Centralized data operations for Data Lake Dashboard
 */

import { BaseService, ServiceResponse } from "./baseService";
import { supabase } from "@/integrations/supabase/client";

export interface SilverStats {
  total: number;
  validated: number;
  avgQuality: number;
}

export interface ProductStats {
  total: number;
  active: number;
  byDomain: Record<string, number>;
}

export interface PipelineStats {
  completed: number;
  failed: number;
  total: number;
}

export class DataLakeService extends BaseService {
  /**
   * Get Bronze layer statistics
   */
  static async getBronzeStats(): Promise<ServiceResponse<number>> {
    return this.executeQuery(async () => {
      const { count, error } = await (supabase as any)
        .from('data_lake_raw')
        .select('*', { count: 'exact', head: true });
      return { data: count || 0, error };
    });
  }

  /**
   * Get Silver layer statistics
   */
  static async getSilverStats(): Promise<ServiceResponse<SilverStats>> {
    return this.executeQuery(async () => {
      const { data, error } = await (supabase as any)
        .from('data_lake_silver')
        .select('quality_score, validation_status');
      
      if (error) return { data: null, error };
      
      const validated = data?.filter((d: any) => d.validation_status === 'validated').length || 0;
      const avgQuality = data?.length 
        ? Math.round(data.reduce((sum: number, d: any) => sum + (d.quality_score || 0), 0) / data.length)
        : 0;
      
      return { data: { total: data?.length || 0, validated, avgQuality }, error: null };
    });
  }

  /**
   * Get Gold layer statistics
   */
  static async getGoldStats(): Promise<ServiceResponse<number>> {
    return this.executeQuery(async () => {
      const { count, error } = await (supabase as any)
        .from('data_lake_gold')
        .select('*', { count: 'exact', head: true });
      return { data: count || 0, error };
    });
  }

  /**
   * Get data products statistics
   */
  static async getProductStats(): Promise<ServiceResponse<ProductStats>> {
    return this.executeQuery(async () => {
      const { data, error } = await (supabase as any)
        .from('data_products')
        .select('domain, is_active');
      
      if (error) return { data: null, error };
      
      const byDomain = data?.reduce((acc: Record<string, number>, p: any) => {
        acc[p.domain] = (acc[p.domain] || 0) + 1;
        return acc;
      }, {}) || {};
      
      return {
        data: {
          total: data?.length || 0,
          active: data?.filter((p: any) => p.is_active).length || 0,
          byDomain
        },
        error: null
      };
    });
  }

  /**
   * Get ETL pipeline statistics
   */
  static async getPipelineStats(): Promise<ServiceResponse<PipelineStats>> {
    return this.executeQuery(async () => {
      const { data, error } = await (supabase as any)
        .from('etl_pipeline_runs')
        .select('status')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) return { data: null, error };
      
      const completed = data?.filter((p: any) => p.status === 'completed').length || 0;
      const failed = data?.filter((p: any) => p.status === 'failed').length || 0;
      
      return { data: { completed, failed, total: data?.length || 0 }, error: null };
    });
  }
}
