/**
 * Pattern Detection for MML System
 * 
 * Provides reusable pattern detection and analysis for:
 * - Phase 1: Department-level insights
 * - Phase 3: Cross-department patterns
 * 
 * Detects: repeated queries, bottlenecks, opportunities, risks
 */

import { extractKeywords, findCommonKeywords, extractPhrases } from './textUtils.ts';
import { calculateFrequencyConfidence, calculateAggregatedConfidence } from './confidenceScoring.ts';

/**
 * Pattern types that can be detected
 */
export enum PatternType {
  REPEATED_QUERY = 'pattern',           // Knowledge gaps (repeated questions)
  BOTTLENECK = 'bottleneck',            // Process blockers
  OPPORTUNITY = 'opportunity',          // Improvement areas
  RISK = 'risk',                        // Potential issues
  TREND = 'trend',                      // Emerging patterns
  ANOMALY = 'anomaly'                   // Unusual behavior
}

/**
 * Conversation or interaction data for pattern detection
 */
export interface ConversationData {
  id: string;
  user_query: string;
  ai_response?: string;
  timestamp: string;
  user_id?: string;
  department?: string;
  metadata?: any;
}

/**
 * Detected pattern result
 */
export interface DetectedPattern {
  patternType: PatternType;
  title: string;
  description: string;
  frequency: number;
  confidence: number;
  impact: number; // 1-10 scale
  affectedUsers: number;
  supportingConversations: string[]; // IDs
  commonKeywords: string[];
  commonPhrases: string[];
  firstDetected: string;
  lastDetected: string;
  detectionMethod: string;
  metadata?: any;
}

/**
 * Configuration for pattern detection
 */
export interface PatternDetectionConfig {
  minFrequency?: number;              // Minimum occurrences (default: 3)
  minConfidence?: number;             // Minimum confidence score (default: 0.6)
  timeWindowDays?: number;            // Analysis window (default: 30)
  keywordThreshold?: number;          // Min keyword matches (default: 2)
  includePatternTypes?: PatternType[]; // Types to detect (default: all)
}

/**
 * Detect repeated query patterns (knowledge gaps)
 * 
 * @param conversations - Array of conversation data
 * @param config - Detection configuration
 * @returns Array of detected patterns
 * 
 * @example
 * const patterns = detectRepeatedQueries(conversations, {
 *   minFrequency: 5,
 *   timeWindowDays: 7
 * });
 */
export function detectRepeatedQueries(
  conversations: ConversationData[],
  config: PatternDetectionConfig = {}
): DetectedPattern[] {
  const {
    minFrequency = 3,
    minConfidence = 0.6,
    timeWindowDays = 30,
    keywordThreshold = 2
  } = config;

  // Filter conversations within time window
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeWindowDays);
  
  const recentConversations = conversations.filter(c =>
    new Date(c.timestamp) >= cutoffDate
  );

  if (recentConversations.length < minFrequency) {
    return [];
  }

  // Extract all keywords from queries
  const queryTexts = recentConversations.map(c => c.user_query);
  const commonKeywords = findCommonKeywords(queryTexts, minFrequency);

  // Group conversations by common keywords
  const patternGroups = new Map<string, ConversationData[]>();

  commonKeywords.forEach(({ keyword, count }) => {
    const matchingConvs = recentConversations.filter(c =>
      c.user_query.toLowerCase().includes(keyword.toLowerCase())
    );

    if (matchingConvs.length >= minFrequency) {
      patternGroups.set(keyword, matchingConvs);
    }
  });

  // Create pattern results
  const patterns: DetectedPattern[] = [];

  patternGroups.forEach((convs, keyword) => {
    const frequency = convs.length;
    const affectedUsers = new Set(convs.map(c => c.user_id).filter(Boolean)).size;
    
    // Calculate confidence
    const confidence = calculateFrequencyConfidence(
      frequency,
      recentConversations.length
    );

    if (confidence >= minConfidence) {
      const timestamps = convs.map(c => new Date(c.timestamp).getTime());
      const firstDetected = new Date(Math.min(...timestamps)).toISOString();
      const lastDetected = new Date(Math.max(...timestamps)).toISOString();

      // Extract common phrases
      const allQueries = convs.map(c => c.user_query).join(' ');
      const phrases = extractPhrases(allQueries, 5);

      patterns.push({
        patternType: PatternType.REPEATED_QUERY,
        title: `Repeated Questions About: ${keyword}`,
        description: `Users have asked about "${keyword}" ${frequency} times, suggesting a knowledge gap or common concern.`,
        frequency,
        confidence,
        impact: Math.min(10, Math.floor(frequency / 2) + 3), // Higher frequency = higher impact
        affectedUsers,
        supportingConversations: convs.map(c => c.id),
        commonKeywords: commonKeywords.slice(0, 10).map(k => k.keyword),
        commonPhrases: phrases,
        firstDetected,
        lastDetected,
        detectionMethod: 'keyword_frequency_analysis',
        metadata: {
          primaryKeyword: keyword,
          totalQueries: recentConversations.length
        }
      });
    }
  });

  return patterns.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Detect bottleneck patterns (process blockers)
 * 
 * @param conversations - Array of conversation data
 * @param config - Detection configuration
 * @returns Array of detected bottleneck patterns
 */
export function detectBottlenecks(
  conversations: ConversationData[],
  config: PatternDetectionConfig = {}
): DetectedPattern[] {
  const {
    minFrequency = 3,
    minConfidence = 0.6,
    timeWindowDays = 30
  } = config;

  // Bottleneck indicator keywords
  const bottleneckKeywords = [
    'delay', 'waiting', 'stuck', 'blocked', 'slow', 'issue', 'problem',
    'error', 'failed', 'timeout', 'taking too long', 'not working',
    'cant access', 'permission denied', 'approval pending'
  ];

  // Filter recent conversations
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeWindowDays);
  
  const recentConversations = conversations.filter(c =>
    new Date(c.timestamp) >= cutoffDate
  );

  // Find conversations mentioning bottlenecks
  const bottleneckConvs = recentConversations.filter(c => {
    const queryLower = c.user_query.toLowerCase();
    return bottleneckKeywords.some(keyword => queryLower.includes(keyword));
  });

  if (bottleneckConvs.length < minFrequency) {
    return [];
  }

  // Group by common themes
  const queryTexts = bottleneckConvs.map(c => c.user_query);
  const commonKeywords = findCommonKeywords(queryTexts, Math.ceil(minFrequency / 2));

  const patterns: DetectedPattern[] = [];

  // Create pattern for each significant keyword cluster
  commonKeywords.slice(0, 5).forEach(({ keyword, count }) => {
    const matchingConvs = bottleneckConvs.filter(c =>
      c.user_query.toLowerCase().includes(keyword.toLowerCase())
    );

    const frequency = matchingConvs.length;
    const affectedUsers = new Set(matchingConvs.map(c => c.user_id).filter(Boolean)).size;
    
    const confidence = calculateAggregatedConfidence({
      frequency,
      totalObservations: recentConversations.length,
      impactScore: Math.min(10, affectedUsers),
      daysSinceFirst: timeWindowDays,
      daysSinceLast: 0
    });

    if (confidence >= minConfidence) {
      const timestamps = matchingConvs.map(c => new Date(c.timestamp).getTime());
      const firstDetected = new Date(Math.min(...timestamps)).toISOString();
      const lastDetected = new Date(Math.max(...timestamps)).toISOString();

      patterns.push({
        patternType: PatternType.BOTTLENECK,
        title: `Process Bottleneck: ${keyword}`,
        description: `Detected ${frequency} reports of delays/issues related to "${keyword}", affecting ${affectedUsers} users.`,
        frequency,
        confidence,
        impact: Math.min(10, Math.floor(affectedUsers / 2) + 5), // User impact drives score
        affectedUsers,
        supportingConversations: matchingConvs.map(c => c.id),
        commonKeywords: [keyword, ...commonKeywords.slice(0, 5).map(k => k.keyword)],
        commonPhrases: extractPhrases(queryTexts.join(' '), 5),
        firstDetected,
        lastDetected,
        detectionMethod: 'bottleneck_keyword_analysis',
        metadata: {
          bottleneckType: keyword,
          urgencyScore: affectedUsers / frequency // Higher = more widespread
        }
      });
    }
  });

  return patterns.sort((a, b) => b.impact - a.impact);
}

/**
 * Detect opportunity patterns (improvement areas)
 * 
 * @param conversations - Array of conversation data
 * @param config - Detection configuration
 * @returns Array of detected opportunity patterns
 */
export function detectOpportunities(
  conversations: ConversationData[],
  config: PatternDetectionConfig = {}
): DetectedPattern[] {
  const {
    minFrequency = 3,
    minConfidence = 0.6,
    timeWindowDays = 30
  } = config;

  // Opportunity indicator keywords
  const opportunityKeywords = [
    'improve', 'better', 'faster', 'easier', 'automate', 'streamline',
    'optimize', 'enhance', 'upgrade', 'feature request', 'would be nice',
    'suggestion', 'recommend', 'could we', 'wish', 'alternative'
  ];

  // Filter recent conversations
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeWindowDays);
  
  const recentConversations = conversations.filter(c =>
    new Date(c.timestamp) >= cutoffDate
  );

  // Find conversations mentioning opportunities
  const opportunityConvs = recentConversations.filter(c => {
    const queryLower = c.user_query.toLowerCase();
    return opportunityKeywords.some(keyword => queryLower.includes(keyword));
  });

  if (opportunityConvs.length < minFrequency) {
    return [];
  }

  // Group by themes
  const queryTexts = opportunityConvs.map(c => c.user_query);
  const commonKeywords = findCommonKeywords(queryTexts, Math.ceil(minFrequency / 2));

  const patterns: DetectedPattern[] = [];

  commonKeywords.slice(0, 5).forEach(({ keyword, count }) => {
    const matchingConvs = opportunityConvs.filter(c =>
      c.user_query.toLowerCase().includes(keyword.toLowerCase())
    );

    const frequency = matchingConvs.length;
    const affectedUsers = new Set(matchingConvs.map(c => c.user_id).filter(Boolean)).size;
    
    const confidence = calculateFrequencyConfidence(frequency, recentConversations.length);

    if (confidence >= minConfidence) {
      const timestamps = matchingConvs.map(c => new Date(c.timestamp).getTime());
      const firstDetected = new Date(Math.min(...timestamps)).toISOString();
      const lastDetected = new Date(Math.max(...timestamps)).toISOString();

      patterns.push({
        patternType: PatternType.OPPORTUNITY,
        title: `Improvement Opportunity: ${keyword}`,
        description: `${frequency} users have suggested improvements related to "${keyword}". This represents a potential enhancement area.`,
        frequency,
        confidence,
        impact: Math.min(10, Math.floor(affectedUsers / 3) + 4), // Moderate impact for opportunities
        affectedUsers,
        supportingConversations: matchingConvs.map(c => c.id),
        commonKeywords: [keyword, ...commonKeywords.slice(0, 5).map(k => k.keyword)],
        commonPhrases: extractPhrases(queryTexts.join(' '), 5),
        firstDetected,
        lastDetected,
        detectionMethod: 'opportunity_keyword_analysis',
        metadata: {
          opportunityType: keyword,
          demandScore: frequency * affectedUsers
        }
      });
    }
  });

  return patterns.sort((a, b) => (b.frequency * b.affectedUsers) - (a.frequency * a.affectedUsers));
}

/**
 * Detect all pattern types at once
 * 
 * @param conversations - Array of conversation data
 * @param config - Detection configuration
 * @returns Array of all detected patterns
 * 
 * @example
 * const allPatterns = detectAllPatterns(conversations, {
 *   minFrequency: 5,
 *   timeWindowDays: 14
 * });
 */
export function detectAllPatterns(
  conversations: ConversationData[],
  config: PatternDetectionConfig = {}
): DetectedPattern[] {
  const {
    includePatternTypes = [
      PatternType.REPEATED_QUERY,
      PatternType.BOTTLENECK,
      PatternType.OPPORTUNITY
    ]
  } = config;

  const allPatterns: DetectedPattern[] = [];

  if (includePatternTypes.includes(PatternType.REPEATED_QUERY)) {
    allPatterns.push(...detectRepeatedQueries(conversations, config));
  }

  if (includePatternTypes.includes(PatternType.BOTTLENECK)) {
    allPatterns.push(...detectBottlenecks(conversations, config));
  }

  if (includePatternTypes.includes(PatternType.OPPORTUNITY)) {
    allPatterns.push(...detectOpportunities(conversations, config));
  }

  // Sort by confidence * impact
  return allPatterns.sort((a, b) => 
    (b.confidence * b.impact) - (a.confidence * a.impact)
  );
}

/**
 * Filter patterns by minimum thresholds
 * 
 * @param patterns - Array of patterns
 * @param minConfidence - Minimum confidence (0-1)
 * @param minImpact - Minimum impact (1-10)
 * @returns Filtered patterns
 */
export function filterPatterns(
  patterns: DetectedPattern[],
  minConfidence: number = 0.6,
  minImpact: number = 5
): DetectedPattern[] {
  return patterns.filter(p =>
    p.confidence >= minConfidence && p.impact >= minImpact
  );
}

/**
 * Get top N patterns by priority (confidence * impact)
 * 
 * @param patterns - Array of patterns
 * @param n - Number to return
 * @returns Top N patterns
 */
export function getTopPatterns(
  patterns: DetectedPattern[],
  n: number = 10
): DetectedPattern[] {
  return patterns
    .sort((a, b) => (b.confidence * b.impact) - (a.confidence * a.impact))
    .slice(0, n);
}

/**
 * Group patterns by type
 * 
 * @param patterns - Array of patterns
 * @returns Map of pattern type to patterns
 */
export function groupPatternsByType(
  patterns: DetectedPattern[]
): Map<PatternType, DetectedPattern[]> {
  const grouped = new Map<PatternType, DetectedPattern[]>();

  patterns.forEach(pattern => {
    if (!grouped.has(pattern.patternType)) {
      grouped.set(pattern.patternType, []);
    }
    grouped.get(pattern.patternType)!.push(pattern);
  });

  return grouped;
}

/**
 * Calculate pattern detection statistics
 * 
 * @param patterns - Array of patterns
 * @returns Statistics object
 */
export function getPatternStatistics(patterns: DetectedPattern[]): {
  totalPatterns: number;
  avgConfidence: number;
  avgImpact: number;
  totalAffectedUsers: number;
  byType: Record<string, number>;
} {
  const byType: Record<string, number> = {};
  let totalConfidence = 0;
  let totalImpact = 0;
  const allUsers = new Set<string>();

  patterns.forEach(pattern => {
    byType[pattern.patternType] = (byType[pattern.patternType] || 0) + 1;
    totalConfidence += pattern.confidence;
    totalImpact += pattern.impact;
    pattern.supportingConversations.forEach(id => allUsers.add(id));
  });

  return {
    totalPatterns: patterns.length,
    avgConfidence: patterns.length > 0 ? totalConfidence / patterns.length : 0,
    avgImpact: patterns.length > 0 ? totalImpact / patterns.length : 0,
    totalAffectedUsers: allUsers.size,
    byType
  };
}
