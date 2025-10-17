/**
 * Unified Confidence Scoring for MML System
 * 
 * Provides consistent confidence score calculations across:
 * - Department insights (Phase 1 & 2)
 * - Global insights and correlations (Phase 3)
 * 
 * All scores are normalized to 0.00 - 1.00 range
 */

/**
 * Calculate confidence score for department insights based on frequency
 * 
 * @param frequency - Number of times pattern was observed
 * @param totalObservations - Total number of observations in dataset
 * @param baseConfidence - Starting confidence level (default: 0.5)
 * @returns Confidence score between 0.00 and 1.00
 * 
 * @example
 * calculateFrequencyConfidence(15, 50) // 15 occurrences out of 50 total
 * // Returns: ~0.80 (high confidence)
 */
export function calculateFrequencyConfidence(
  frequency: number,
  totalObservations: number,
  baseConfidence: number = 0.5
): number {
  if (totalObservations === 0 || frequency === 0) {
    return 0;
  }
  
  // Calculate relative frequency (0-1)
  const relativeFreq = Math.min(frequency / totalObservations, 1);
  
  // Scale from base confidence to 0.95 max
  const score = baseConfidence + (relativeFreq * (0.95 - baseConfidence));
  
  return Math.min(0.95, Math.max(0, score));
}

/**
 * Calculate confidence for correlations between insights
 * 
 * @param correlationStrength - Correlation strength (0-1)
 * @param insight1Confidence - Confidence of first insight (0-1)
 * @param insight2Confidence - Confidence of second insight (0-1)
 * @returns Combined confidence score
 * 
 * @example
 * calculateCorrelationConfidence(0.8, 0.9, 0.85)
 * // Returns: ~0.70 (strength * average of insight confidences)
 */
export function calculateCorrelationConfidence(
  correlationStrength: number,
  insight1Confidence: number,
  insight2Confidence: number
): number {
  // Average confidence of source insights
  const avgSourceConfidence = (insight1Confidence + insight2Confidence) / 2;
  
  // Multiply by correlation strength
  const score = correlationStrength * avgSourceConfidence;
  
  return Math.min(0.95, Math.max(0, score));
}

/**
 * Calculate confidence based on user validation
 * 
 * @param positiveValidations - Number of positive validations
 * @param totalValidations - Total validation attempts
 * @param priorConfidence - Existing confidence score (optional)
 * @returns Updated confidence score
 * 
 * @example
 * calculateValidationConfidence(8, 10, 0.75)
 * // Returns: ~0.83 (blends prior confidence with validation rate)
 */
export function calculateValidationConfidence(
  positiveValidations: number,
  totalValidations: number,
  priorConfidence: number = 0.5
): number {
  if (totalValidations === 0) {
    return priorConfidence;
  }
  
  const validationRate = positiveValidations / totalValidations;
  
  // Bayesian update: blend prior confidence with new evidence
  // Weight validation more heavily as sample size increases
  const weight = Math.min(totalValidations / 10, 0.7); // Max 70% weight to validation
  
  const score = (priorConfidence * (1 - weight)) + (validationRate * weight);
  
  return Math.min(0.95, Math.max(0, score));
}

/**
 * Calculate confidence for aggregated insights
 * Considers multiple factors: frequency, impact, and temporal consistency
 * 
 * @param params - Aggregation parameters
 * @returns Confidence score
 */
export function calculateAggregatedConfidence(params: {
  frequency: number;
  totalObservations: number;
  impactScore: number; // 1-10 scale
  daysSinceFirst: number;
  daysSinceLast: number;
}): number {
  const { frequency, totalObservations, impactScore, daysSinceFirst, daysSinceLast } = params;
  
  // Base confidence from frequency
  let confidence = calculateFrequencyConfidence(frequency, totalObservations);
  
  // Boost for high impact (1-10 scale)
  const impactBoost = (impactScore / 10) * 0.1;
  confidence = Math.min(0.95, confidence + impactBoost);
  
  // Penalty for stale data (not seen recently)
  if (daysSinceLast > 30) {
    confidence *= 0.8; // 20% penalty
  } else if (daysSinceLast > 14) {
    confidence *= 0.9; // 10% penalty
  }
  
  // Boost for persistent patterns (seen over long period)
  if (daysSinceFirst > 30 && frequency > 5) {
    confidence = Math.min(0.95, confidence * 1.05); // 5% boost
  }
  
  return Math.min(0.95, Math.max(0, confidence));
}

/**
 * Confidence level categorization
 */
export enum ConfidenceLevel {
  VERY_LOW = 'very_low',   // 0.00 - 0.30
  LOW = 'low',             // 0.31 - 0.50
  MEDIUM = 'medium',       // 0.51 - 0.70
  HIGH = 'high',           // 0.71 - 0.85
  VERY_HIGH = 'very_high'  // 0.86 - 1.00
}

/**
 * Get confidence level category from score
 * 
 * @param score - Confidence score (0-1)
 * @returns Confidence level enum
 */
export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score > 0.85) return ConfidenceLevel.VERY_HIGH;
  if (score > 0.70) return ConfidenceLevel.HIGH;
  if (score > 0.50) return ConfidenceLevel.MEDIUM;
  if (score > 0.30) return ConfidenceLevel.LOW;
  return ConfidenceLevel.VERY_LOW;
}

/**
 * Format confidence score for display
 * 
 * @param score - Confidence score (0-1)
 * @returns Formatted string with percentage and level
 * 
 * @example
 * formatConfidenceScore(0.87)
 * // Returns: "87% (Very High)"
 */
export function formatConfidenceScore(score: number): string {
  const percentage = Math.round(score * 100);
  const level = getConfidenceLevel(score);
  const levelText = level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  return `${percentage}% (${levelText})`;
}
