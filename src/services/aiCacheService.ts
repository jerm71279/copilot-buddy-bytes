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

export class AICacheService {
  /**
   * Get cache metrics and statistics
   */
  static async getCacheMetrics(): Promise<CacheMetrics> {
    const { data, error } = await supabase
      .from('ai_prompt_cache')
      .select('hit_count, cached_tokens');

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        totalHits: 0,
        totalCached: 0,
        avgProcessingTime: 0,
        estimatedSavings: 0
      };
    }

    const totalHits = data.reduce((sum, item) => sum + (item.hit_count || 0), 0);
    const totalCached = data.length;
    const totalTokens = data.reduce((sum, item) => sum + (item.cached_tokens || 0), 0);
    
    // Estimate savings: cached tokens * average cost per 1K tokens * cache discount (90%)
    // Assuming $0.50 per 1M tokens, 90% discount on cached
    const estimatedSavings = (totalTokens / 1000000) * 0.50 * 0.90;

    return {
      totalHits,
      totalCached,
      avgProcessingTime: 150, // Estimated avg reduction in ms
      estimatedSavings
    };
  }
}
