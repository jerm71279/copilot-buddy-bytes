# Shared MML System Modules

This directory contains reusable utilities shared across all phases of the MESH LLM (MML) system.

## Purpose

Eliminates code duplication between:
- `department-assistant` (Phase 1)
- `central-mml-processor` (Phase 3)
- Future MML components

## Module Overview

### ✅ `textUtils.ts` - Text Processing
**Status:** Implemented  
**Used by:** Phase 1, Phase 3

**Functions:**
- `extractKeywords()` - Extract meaningful keywords from text
- `calculateTextSimilarity()` - Measure similarity between texts
- `findCommonKeywords()` - Find shared keywords across multiple texts
- `sanitizeText()` - Clean text for storage
- `extractPhrases()` - Extract common multi-word phrases

**Benefits:**
- Eliminates duplicate stop word lists
- Consistent keyword extraction across system
- ~50 lines of code deduplicated

---

### ✅ `confidenceScoring.ts` - Unified Confidence Metrics
**Status:** Implemented  
**Used by:** Phase 1, Phase 2, Phase 3

**Functions:**
- `calculateFrequencyConfidence()` - Score based on observation frequency
- `calculateCorrelationConfidence()` - Score for correlated insights
- `calculateValidationConfidence()` - Update scores from user feedback
- `calculateAggregatedConfidence()` - Multi-factor scoring
- `getConfidenceLevel()` - Categorize scores (Low/Medium/High)
- `formatConfidenceScore()` - Format for display

**Benefits:**
- Consistent confidence methodology across all insights
- Supports Bayesian updates from user feedback
- Standardized scoring (0.00 - 1.00 scale)

---

### 🚧 `correlationEngine.ts` - Correlation Detection
**Status:** Planned (Phase 1 Refactoring - Step 2)  
**Priority:** HIGH

**Planned Functions:**
- `calculateCorrelation()` - Compute correlation between insights
- `identifyCorrelationType()` - Classify (positive/negative/causal)
- `scoreCorrelationStrength()` - Quantify relationship strength
- `gatherEvidence()` - Collect supporting evidence
- `cacheCorrelation()` - Memoize expensive calculations

**Benefits:**
- Reusable correlation logic
- Performance optimization via caching
- Consistent scoring methodology

---

### 🚧 `patternDetection.ts` - Pattern Analysis
**Status:** Planned (Phase 1 Refactoring - Step 2)  
**Priority:** HIGH

**Planned Functions:**
- `detectRepeatedQueries()` - Find knowledge gaps
- `detectBottlenecks()` - Identify process blockers
- `detectOpportunities()` - Spot improvement areas
- `detectRisks()` - Find potential issues
- `analyzeFrequency()` - Calculate pattern frequency

**Benefits:**
- Shared pattern detection across phases
- Extensible to new pattern types
- ~150 lines of code deduplicated

---

### 🚧 `insightGenerator.ts` - Insight Creation
**Status:** Planned (Phase 1 Refactoring - Step 2)  
**Priority:** MEDIUM

**Planned Functions:**
- `generateDepartmentInsight()` - Create Phase 1/2 insights
- `generateGlobalInsight()` - Create Phase 3 insights
- `validateInsight()` - Quality checks
- `enrichInsightMetadata()` - Add context
- `prioritizeInsights()` - Rank by importance

**Benefits:**
- Consistent insight structure
- Quality validation
- Metadata standardization

---

### 🚧 `recommendationEngine.ts` - Actionable Recommendations
**Status:** Planned (Week 2 Refactoring - Step 3)  
**Priority:** MEDIUM

**Planned Functions:**
- `generateRecommendations()` - Template-based recommendations
- `estimateROI()` - Calculate potential value
- `assessComplexity()` - Estimate implementation effort
- `prioritizeActions()` - Order by impact/effort
- `loadRecommendationTemplates()` - From database

**Benefits:**
- Configurable recommendation templates
- Consistent ROI calculations
- Per-customer customization support

---

### 🚧 `supabaseClient.ts` - Shared Database Client
**Status:** Planned (Week 3 Refactoring)  
**Priority:** LOW

**Planned Functions:**
- `createServiceClient()` - Service role client
- `createAuthClient()` - User-scoped client
- `withRetry()` - Retry logic for transient failures
- `batchQuery()` - Batch multiple queries

**Benefits:**
- Consistent error handling
- Connection pooling
- Retry logic

---

## Usage Examples

### Text Processing

```typescript
import { extractKeywords, calculateTextSimilarity } from '../_shared/textUtils.ts';

// Extract keywords
const keywords = extractKeywords("System performance is degrading");
// Returns: ["system", "performance", "degrading"]

// Measure similarity
const similarity = calculateTextSimilarity(
  "Network latency issues", 
  "Network performance problems"
);
// Returns: ~0.5 (moderate similarity)
```

### Confidence Scoring

```typescript
import { 
  calculateFrequencyConfidence, 
  formatConfidenceScore 
} from '../_shared/confidenceScoring.ts';

// Calculate based on frequency
const confidence = calculateFrequencyConfidence(15, 50);
// Returns: ~0.80

// Format for display
const display = formatConfidenceScore(confidence);
// Returns: "80% (High)"
```

---

## Module Dependencies

```
textUtils.ts
    ↓
confidenceScoring.ts
    ↓
correlationEngine.ts (planned)
    ↓
patternDetection.ts (planned)
    ↓
insightGenerator.ts (planned)
    ↓
recommendationEngine.ts (planned)
```

---

## Testing

Each module should have corresponding tests in `supabase/functions/_shared/tests/`:

- `textUtils.spec.ts` - Keyword extraction, similarity
- `confidenceScoring.spec.ts` - Score calculations
- `correlationEngine.spec.ts` - Correlation detection
- `patternDetection.spec.ts` - Pattern matching
- `insightGenerator.spec.ts` - Insight creation
- `recommendationEngine.spec.ts` - Recommendations

---

## Migration Guide

When refactoring existing code to use these modules:

1. **Identify duplicate logic** in your function
2. **Import shared module** instead
3. **Replace inline code** with function calls
4. **Test thoroughly** before deployment
5. **Update documentation** with changes

### Example Migration

**Before (department-assistant):**
```typescript
// Inline keyword extraction
const stopWords = ['the', 'a', 'an', ...];
const keywords = text.toLowerCase()
  .split(' ')
  .filter(w => !stopWords.includes(w));
```

**After (using shared module):**
```typescript
import { extractKeywords } from '../_shared/textUtils.ts';

const keywords = extractKeywords(text);
```

---

## Adding New Modules

When creating new shared modules:

1. Add file to `supabase/functions/_shared/`
2. Export all public functions
3. Add JSDoc comments with examples
4. Update this README
5. Create corresponding test file
6. Update `MML_SYSTEM_MODULARIZATION_ANALYSIS.md`

---

## Maintenance

**Owner:** AI Development Team  
**Last Updated:** 2025-10-17  
**Next Review:** After Phase 1 Refactoring (Step 2)

**Validation:**
```bash
node scripts/validate-mml-modularization.js
```

Target: 85%+ modularization score
