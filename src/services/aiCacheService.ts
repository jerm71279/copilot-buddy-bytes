/**
 * AI Cache Service
 * Manages AI prompt caching metrics and operations
 */

import { supabase } from "@/integrations/supabase/client";

export interface CacheMetrics {
  totalHits: number;
  totalCached: number;
  avgProcessingTime: number;
  estimatedSavings: number;
}

interface CacheData {
  hit_count: number | null;
  cached_tokens: number | null;
}

export class AICacheService {
  private static readonly COST_PER_MILLION_TOKENS = 0.50;
  private static readonly CACHE_DISCOUNT_RATE = 0.90;
  private static readonly AVG_PROCESSING_TIME_MS = 150;

  /**
   * Get cache metrics and statistics
   * @returns Cache performance metrics including hits, savings, and processing time
   * @throws Error if database query fails
   */
  static async getCacheMetrics(): Promise<CacheMetrics> {
    const { data, error } = await supabase
      .from('ai_prompt_cache')
      .select('hit_count, cached_tokens');

    if (error) throw new Error(`Failed to fetch cache metrics: ${error.message}`);

    if (!data || data.length === 0) {
      return {
        totalHits: 0,
        totalCached: 0,
        avgProcessingTime: 0,
        estimatedSavings: 0
      };
    }

    const cacheData = data as CacheData[];
    const totalHits = cacheData.reduce((sum, item) => sum + (item.hit_count || 0), 0);
    const totalCached = cacheData.length;
    const totalTokens = cacheData.reduce((sum, item) => sum + (item.cached_tokens || 0), 0);
    
    // Calculate estimated savings based on cached tokens
    const estimatedSavings = 
      (totalTokens / 1000000) * 
      this.COST_PER_MILLION_TOKENS * 
      this.CACHE_DISCOUNT_RATE;

    return {
      totalHits,
      totalCached,
      avgProcessingTime: this.AVG_PROCESSING_TIME_MS,
      estimatedSavings: Number(estimatedSavings.toFixed(2))
    };
  }
}
