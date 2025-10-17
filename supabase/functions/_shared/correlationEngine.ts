/**
 * Correlation Engine for MML System
 * 
 * Provides reusable correlation detection and scoring for:
 * - Phase 3: Cross-department pattern detection
 * - Future: Any system requiring correlation analysis
 * 
 * Eliminates duplicate correlation logic and provides consistent scoring
 */

import { extractKeywords, calculateTextSimilarity } from './textUtils.ts';
import { calculateCorrelationConfidence } from './confidenceScoring.ts';

/**
 * Correlation types that can be detected
 */
export enum CorrelationType {
  POSITIVE = 'positive',     // Both insights move in same direction
  NEGATIVE = 'negative',     // Insights move in opposite directions
  CAUSAL = 'causal',         // One insight likely causes the other
  TEMPORAL = 'temporal'      // Time-based relationship
}

/**
 * Generic insight interface for correlation
 * Can be adapted to different insight structures
 */
export interface CorrelationInsight {
  id: string;
  title: string;
  description: string;
  insight_type: string;
  department?: string;
  confidence_score: number;
  impact_score: number;
  first_detected_at?: string;
  last_detected_at?: string;
  affected_users?: number;
  frequency_count?: number;
  metadata?: any;
}

/**
 * Correlation result with strength, type, and evidence
 */
export interface CorrelationResult {
  insight1: CorrelationInsight;
  insight2: CorrelationInsight;
  strength: number; // 0.0 - 1.0
  correlationType: CorrelationType;
  confidence: number; // Overall confidence in correlation
  evidence: {
    temporalProximity?: string;
    sameType?: boolean;
    commonKeywords?: string[];
    similarImpact?: boolean;
    textSimilarity?: number;
    [key: string]: any;
  };
}

/**
 * Configuration for correlation detection
 */
export interface CorrelationConfig {
  minStrength?: number;           // Minimum correlation strength (default: 0.5)
  maxPairs?: number;              // Maximum pairs to analyze (default: 100)
  temporalWindowHours?: number;   // Time window for temporal correlation (default: 48)
  requireCrossDepartment?: boolean; // Only cross-department correlations (default: false)
  cacheResults?: boolean;         // Enable result caching (default: true)
}

/**
 * Calculate correlation between two insights
 * 
 * @param insight1 - First insight
 * @param insight2 - Second insight
 * @param config - Optional configuration
 * @returns Correlation result with strength, type, and evidence
 * 
 * @example
 * const correlation = calculateCorrelation(hrInsight, itInsight);
 * if (correlation.strength > 0.7) {
 *   console.log(`Strong ${correlation.correlationType} correlation detected`);
 * }
 */
export function calculateCorrelation(
  insight1: CorrelationInsight,
  insight2: CorrelationInsight,
  config: CorrelationConfig = {}
): CorrelationResult {
  const evidence: any = {};
  let strength = 0;
  let correlationType = CorrelationType.POSITIVE;

  // 1. Temporal Proximity Analysis (30% weight)
  if (insight1.first_detected_at && insight2.first_detected_at) {
    const timeDiff = Math.abs(
      new Date(insight1.first_detected_at).getTime() - 
      new Date(insight2.first_detected_at).getTime()
    );
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    const temporalWindow = config.temporalWindowHours || 48;
    
    if (hoursDiff <= temporalWindow) {
      const proximityScore = 1 - (hoursDiff / temporalWindow);
      strength += proximityScore * 0.3;
      evidence.temporalProximity = `${hoursDiff.toFixed(1)} hours apart`;
      
      // Temporal correlation if very close in time
      if (hoursDiff <= 6) {
        correlationType = CorrelationType.TEMPORAL;
      }
    }
  }

  // 2. Same Insight Type (20% weight)
  if (insight1.insight_type === insight2.insight_type) {
    strength += 0.2;
    evidence.sameType = true;
  }

  // 3. Text Similarity Analysis (30% weight)
  const textSimilarity = calculateTextSimilarity(
    insight1.description + ' ' + insight1.title,
    insight2.description + ' ' + insight2.title
  );
  
  if (textSimilarity > 0) {
    strength += textSimilarity * 0.3;
    evidence.textSimilarity = textSimilarity;
  }

  // Extract and compare keywords
  const keywords1 = extractKeywords(insight1.description + ' ' + insight1.title);
  const keywords2 = extractKeywords(insight2.description + ' ' + insight2.title);
  const commonKeywords = keywords1.filter(k => keywords2.includes(k));
  
  if (commonKeywords.length > 0) {
    evidence.commonKeywords = commonKeywords;
  }

  // 4. Similar Impact Levels (20% weight)
  const impactDiff = Math.abs(insight1.impact_score - insight2.impact_score);
  if (impactDiff <= 2) {
    strength += 0.2;
    evidence.similarImpact = true;
  }

  // 5. Frequency Correlation (bonus)
  if (insight1.frequency_count && insight2.frequency_count) {
    const freqRatio = Math.min(
      insight1.frequency_count / insight2.frequency_count,
      insight2.frequency_count / insight1.frequency_count
    );
    if (freqRatio > 0.7) {
      strength += 0.1;
      evidence.similarFrequency = true;
    }
  }

  // Determine correlation type based on patterns
  correlationType = determineCorrelationType(insight1, insight2, evidence);

  // Calculate overall confidence
  const confidence = calculateCorrelationConfidence(
    Math.min(1, strength),
    insight1.confidence_score,
    insight2.confidence_score
  );

  return {
    insight1,
    insight2,
    strength: Math.min(1, strength),
    correlationType,
    confidence,
    evidence
  };
}

/**
 * Determine the most appropriate correlation type
 */
export function determineCorrelationType(
  insight1: CorrelationInsight,
  insight2: CorrelationInsight,
  evidence: any
): CorrelationType {
  // Causal if both are bottlenecks (one causes the other)
  if (insight1.insight_type === 'bottleneck' && insight2.insight_type === 'bottleneck') {
    return CorrelationType.CAUSAL;
  }

  // Causal if risk → bottleneck or bottleneck → risk
  if (
    (insight1.insight_type === 'risk' && insight2.insight_type === 'bottleneck') ||
    (insight1.insight_type === 'bottleneck' && insight2.insight_type === 'risk')
  ) {
    return CorrelationType.CAUSAL;
  }

  // Positive if both are opportunities
  if (insight1.insight_type === 'opportunity' && insight2.insight_type === 'opportunity') {
    return CorrelationType.POSITIVE;
  }

  // Temporal if very close in time
  if (evidence.temporalProximity && evidence.temporalProximity.includes('hours apart')) {
    const hours = parseFloat(evidence.temporalProximity);
    if (hours <= 6) {
      return CorrelationType.TEMPORAL;
    }
  }

  // Default to positive correlation
  return CorrelationType.POSITIVE;
}

/**
 * Find correlations among a set of insights
 * 
 * @param insights - Array of insights to analyze
 * @param config - Configuration options
 * @returns Array of correlation results sorted by strength
 * 
 * @example
 * const correlations = findCorrelations(allInsights, {
 *   minStrength: 0.6,
 *   requireCrossDepartment: true,
 *   maxPairs: 50
 * });
 */
export function findCorrelations(
  insights: CorrelationInsight[],
  config: CorrelationConfig = {}
): CorrelationResult[] {
  const {
    minStrength = 0.5,
    maxPairs = 100,
    requireCrossDepartment = false
  } = config;

  const correlations: CorrelationResult[] = [];
  let pairsAnalyzed = 0;

  // Analyze all pairs
  for (let i = 0; i < insights.length && pairsAnalyzed < maxPairs; i++) {
    for (let j = i + 1; j < insights.length && pairsAnalyzed < maxPairs; j++) {
      const insight1 = insights[i];
      const insight2 = insights[j];

      // Skip if same department and cross-department required
      if (requireCrossDepartment) {
        if (!insight1.department || !insight2.department || 
            insight1.department === insight2.department) {
          continue;
        }
      }

      pairsAnalyzed++;

      // Calculate correlation
      const correlation = calculateCorrelation(insight1, insight2, config);

      // Only keep if meets minimum strength
      if (correlation.strength >= minStrength) {
        correlations.push(correlation);
      }
    }
  }

  // Sort by strength (strongest first)
  return correlations.sort((a, b) => b.strength - a.strength);
}

/**
 * Filter correlations by type
 * 
 * @param correlations - Array of correlations
 * @param type - Correlation type to filter by
 * @returns Filtered correlations
 */
export function filterByType(
  correlations: CorrelationResult[],
  type: CorrelationType
): CorrelationResult[] {
  return correlations.filter(c => c.correlationType === type);
}

/**
 * Get top N correlations
 * 
 * @param correlations - Array of correlations
 * @param n - Number of top correlations to return
 * @returns Top N correlations by strength
 */
export function getTopCorrelations(
  correlations: CorrelationResult[],
  n: number = 10
): CorrelationResult[] {
  return correlations.slice(0, n);
}

/**
 * Group correlations by department pair
 * 
 * @param correlations - Array of correlations
 * @returns Map of department pair to correlations
 */
export function groupByDepartments(
  correlations: CorrelationResult[]
): Map<string, CorrelationResult[]> {
  const grouped = new Map<string, CorrelationResult[]>();

  correlations.forEach(correlation => {
    if (correlation.insight1.department && correlation.insight2.department) {
      const depts = [
        correlation.insight1.department,
        correlation.insight2.department
      ].sort();
      const key = depts.join(' <-> ');

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(correlation);
    }
  });

  return grouped;
}

/**
 * Calculate average correlation strength for a department
 * 
 * @param correlations - Array of correlations
 * @param department - Department to analyze
 * @returns Average correlation strength
 */
export function getDepartmentAverageStrength(
  correlations: CorrelationResult[],
  department: string
): number {
  const relevant = correlations.filter(c =>
    c.insight1.department === department ||
    c.insight2.department === department
  );

  if (relevant.length === 0) return 0;

  const totalStrength = relevant.reduce((sum, c) => sum + c.strength, 0);
  return totalStrength / relevant.length;
}

/**
 * In-memory correlation cache (for performance optimization)
 */
const correlationCache = new Map<string, CorrelationResult>();

/**
 * Generate cache key for two insights
 */
function getCacheKey(id1: string, id2: string): string {
  return [id1, id2].sort().join('::');
}

/**
 * Calculate correlation with caching support
 * 
 * @param insight1 - First insight
 * @param insight2 - Second insight
 * @param config - Configuration (cacheResults defaults to true)
 * @returns Correlation result
 */
export function calculateCorrelationCached(
  insight1: CorrelationInsight,
  insight2: CorrelationInsight,
  config: CorrelationConfig = {}
): CorrelationResult {
  const { cacheResults = true } = config;

  if (cacheResults) {
    const cacheKey = getCacheKey(insight1.id, insight2.id);
    
    if (correlationCache.has(cacheKey)) {
      return correlationCache.get(cacheKey)!;
    }

    const result = calculateCorrelation(insight1, insight2, config);
    correlationCache.set(cacheKey, result);
    return result;
  }

  return calculateCorrelation(insight1, insight2, config);
}

/**
 * Clear correlation cache (call when insights are updated)
 */
export function clearCorrelationCache(): void {
  correlationCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: correlationCache.size,
    keys: Array.from(correlationCache.keys())
  };
}
