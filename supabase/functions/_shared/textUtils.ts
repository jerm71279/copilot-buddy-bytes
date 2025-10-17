/**
 * Shared Text Processing Utilities for MML System
 * 
 * Used by:
 * - department-assistant (Phase 1)
 * - central-mml-processor (Phase 3)
 * 
 * Eliminates duplicate keyword extraction and text processing logic
 */

/**
 * Common stop words for English text analysis
 * Filters out common words that don't provide meaningful insights
 */
export const STOP_WORDS = [
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
  'of', 'with', 'is', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 
  'had', 'do', 'does', 'did', 'this', 'that', 'these', 'those', 'from',
  'by', 'as', 'it', 'not', 'can', 'will', 'just', 'should', 'would', 'could'
];

/**
 * Extract meaningful keywords from text
 * 
 * @param text - Input text to analyze
 * @param maxKeywords - Maximum number of keywords to return (default: 15)
 * @param minLength - Minimum word length to consider (default: 3)
 * @returns Array of extracted keywords
 * 
 * @example
 * extractKeywords("The system performance is degrading rapidly")
 * // Returns: ["system", "performance", "degrading", "rapidly"]
 */
export function extractKeywords(
  text: string, 
  maxKeywords: number = 15,
  minLength: number = 3
): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/) // Split on whitespace
    .filter(word => 
      word.length >= minLength && 
      !STOP_WORDS.includes(word) &&
      !/^\d+$/.test(word) // Exclude pure numbers
    )
    .slice(0, maxKeywords);
}

/**
 * Calculate text similarity using Jaccard index
 * 
 * @param text1 - First text
 * @param text2 - Second text
 * @returns Similarity score between 0 and 1
 * 
 * @example
 * calculateTextSimilarity("system performance", "performance issues")
 * // Returns: 0.33 (1 common word out of 3 total unique words)
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  const keywords1 = new Set(extractKeywords(text1));
  const keywords2 = new Set(extractKeywords(text2));
  
  if (keywords1.size === 0 && keywords2.size === 0) {
    return 0;
  }
  
  // Calculate Jaccard similarity
  const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
  const union = new Set([...keywords1, ...keywords2]);
  
  return intersection.size / union.size;
}

/**
 * Find common keywords between multiple texts
 * 
 * @param texts - Array of texts to analyze
 * @param minOccurrences - Minimum times a keyword must appear (default: 2)
 * @returns Array of common keywords sorted by frequency
 */
export function findCommonKeywords(
  texts: string[], 
  minOccurrences: number = 2
): { keyword: string; count: number }[] {
  const keywordCounts = new Map<string, number>();
  
  texts.forEach(text => {
    const keywords = extractKeywords(text);
    keywords.forEach(keyword => {
      keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
    });
  });
  
  return Array.from(keywordCounts.entries())
    .filter(([_, count]) => count >= minOccurrences)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Sanitize text for storage and display
 * Removes control characters and trims whitespace
 * 
 * @param text - Text to sanitize
 * @param maxLength - Maximum length (default: 5000)
 * @returns Sanitized text
 */
export function sanitizeText(text: string, maxLength: number = 5000): string {
  if (!text) return '';
  
  return text
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim()
    .slice(0, maxLength);
}

/**
 * Extract phrases (2-3 word sequences) from text
 * Useful for identifying common multi-word patterns
 * 
 * @param text - Input text
 * @param maxPhrases - Maximum phrases to return (default: 10)
 * @returns Array of extracted phrases
 */
export function extractPhrases(text: string, maxPhrases: number = 10): string[] {
  const words = extractKeywords(text, 100, 2); // Get more words for phrase extraction
  const phrases: string[] = [];
  
  // Extract 2-word phrases
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(`${words[i]} ${words[i + 1]}`);
  }
  
  // Extract 3-word phrases
  for (let i = 0; i < words.length - 2; i++) {
    phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }
  
  // Count frequency and return most common
  const phraseCounts = new Map<string, number>();
  phrases.forEach(phrase => {
    phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 1);
  });
  
  return Array.from(phraseCounts.entries())
    .filter(([_, count]) => count > 1) // Only repeated phrases
    .sort((a, b) => b[1] - a[1])
    .map(([phrase]) => phrase)
    .slice(0, maxPhrases);
}
