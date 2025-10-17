# AI Insight Tables Validation Results

**Date:** October 17, 2025 1:30 PM  
**Status:** ⚠️ CRITICAL SCHEMA MISMATCH DETECTED  
**Validator:** `scripts/validate-ai-insight-tables.js`

---

## Executive Summary

❌ **CRITICAL ISSUES FOUND**: The `central-mml-processor` edge function and database schema are **out of sync**, causing runtime errors when Layer 2 AI tries to process insights.

### Issue Severity Breakdown

| Severity | Count | Details |
|----------|-------|---------|
| 🔴 Critical | 3 | Schema mismatches between code and database |
| ⚠️ Warning | 0 | - |
| ✅ Passed | 8 | RLS, indexes, foreign keys properly configured |

---

## Critical Issues

### 1. ❌ `global_insights` Schema Mismatch

**Problem:** Edge function expects columns that don't exist in the database.

**Edge Function Expects:**
```typescript
{
  customer_id: uuid,
  insight_type: string,
  affected_departments: string[],  // ✅ EXISTS
  confidence_score: number,        // ✅ EXISTS
  insight_data: jsonb,             // ❌ MISSING
  source_insight_count: number,    // ❌ MISSING
  recommended_actions: string[]    // ⚠️ WRONG TYPE (currently JSONB)
}
```

**Actual Database Schema:**
```sql
CREATE TABLE global_insights (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,              -- ❌ NOT USED by edge function
  description TEXT NOT NULL,         -- ❌ NOT USED by edge function
  affected_departments TEXT[],       -- ✅ OK
  source_insight_ids UUID[],         -- ❌ NOT USED (function uses source_insight_count)
  confidence_score NUMERIC,          -- ✅ OK
  impact_level TEXT,                 -- ❌ NOT SET by edge function
  priority INTEGER,                  -- ❌ NOT SET by edge function
  recommended_actions JSONB,         -- ⚠️ WRONG TYPE (should be TEXT[])
  ...
);
```

**Impact:** 
- `INSERT` operations from `central-mml-processor` will **fail** with "column does not exist" errors
- Layer 2 AI cannot create global insights
- Cross-department learning is **broken**

---

### 2. ❌ `insight_correlations` Schema Mismatch

**Problem:** Column names don't match between code and database.

**Edge Function Expects:**
```typescript
{
  global_insight_id: uuid,           // ❌ MISSING
  department_insight_1_id: uuid,     // ❌ WRONG NAME (actual: insight_a_id)
  department_insight_2_id: uuid,     // ❌ WRONG NAME (actual: insight_b_id)
  correlation_strength: number,      // ✅ EXISTS
  correlation_type: string,          // ✅ EXISTS
  relationship_description: string   // ❌ MISSING (actual: description)
}
```

**Actual Database Schema:**
```sql
CREATE TABLE insight_correlations (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL,
  insight_a_id UUID NOT NULL,        -- ❌ Should be department_insight_1_id
  insight_b_id UUID NOT NULL,        -- ❌ Should be department_insight_2_id
  correlation_type TEXT NOT NULL,    -- ✅ OK
  correlation_strength NUMERIC,      -- ✅ OK
  description TEXT,                  -- ⚠️ GENERIC (should be relationship_description)
  discovered_at TIMESTAMPTZ,
  metadata JSONB
);
```

**Impact:**
- `INSERT` operations will **fail** with "column does not exist" errors
- Cannot track relationships between department insights
- Pattern linking is **broken**

---

### 3. ❌ `department_insights` Missing `insight_data` Column

**Problem:** Edge function expects consolidated JSONB field, but schema has discrete columns.

**Edge Function Expects:**
```typescript
{
  insight_data: {                    // ❌ MISSING COLUMN
    common_themes: string[],
    category: string,
    keywords: string[]
  }
}
```

**Actual Database Schema:**
```sql
CREATE TABLE department_insights (
  ...
  title TEXT NOT NULL,               -- ✅ EXISTS
  description TEXT NOT NULL,         -- ✅ EXISTS
  metadata JSONB DEFAULT '{}',       -- ⚠️ GENERIC (not same as insight_data)
  ...
);
```

**Impact:**
- `central-mml-processor` cannot extract themes from insights
- Pattern detection logic fails
- Layer 2 AI gets incomplete data

---

## ✅ What's Working Correctly

### 1. ✅ Row Level Security (RLS)

All tables have RLS enabled with proper policies:

```sql
-- ✅ department_insights
- Users can view insights in their organization
- System can insert insights
- Admins can update insights

-- ✅ global_insights
- Users can view global insights in their organization
- Admins can manage global insights
- System can insert global insights

-- ✅ insight_correlations
- Users can view correlations in their organization
- System can manage correlations
```

### 2. ✅ Indexes

All performance-critical columns are indexed:

```sql
-- department_insights
CREATE INDEX idx_department_insights_customer_dept ON department_insights(customer_id, department);
CREATE INDEX idx_department_insights_status ON department_insights(status);
CREATE INDEX idx_department_insights_created ON department_insights(created_at DESC);

-- global_insights
CREATE INDEX idx_global_insights_customer ON global_insights(customer_id);
CREATE INDEX idx_global_insights_status ON global_insights(status);
CREATE INDEX idx_global_insights_type ON global_insights(insight_type);

-- insight_correlations
CREATE INDEX idx_insight_correlations_customer ON insight_correlations(customer_id);
```

### 3. ✅ Foreign Key Relationships

Foreign keys properly set up for data integrity:

```sql
-- insight_to_article links insights to knowledge articles
insight_id UUID REFERENCES department_insights(id) ON DELETE CASCADE
article_id UUID REFERENCES knowledge_articles(id) ON DELETE CASCADE

-- department_insights can reference global insights
global_insight_id UUID REFERENCES global_insights(id)
```

### 4. ✅ Three-Tier Architecture Structure

Tables properly organized into layers:

| Layer | Table | Purpose | Status |
|-------|-------|---------|--------|
| Layer 1 | `department_insights` | Dept learning | ✅ Exists |
| Layer 2 | `global_insights` | Cross-dept intel | ⚠️ Schema mismatch |
| Layer 2 | `insight_correlations` | Pattern linking | ⚠️ Schema mismatch |
| Layer 3 | `insight_feedback` | Feedback loop | ✅ Exists |

---

## 🔧 Required Fixes

### Option 1: Update Database Schema (RECOMMENDED)

Update the database to match what the edge function expects:

```sql
-- Fix global_insights
ALTER TABLE global_insights 
  ADD COLUMN IF NOT EXISTS insight_data JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source_insight_count INTEGER DEFAULT 0,
  ALTER COLUMN recommended_actions TYPE TEXT[];

-- Fix insight_correlations
ALTER TABLE insight_correlations 
  RENAME COLUMN insight_a_id TO department_insight_1_id;

ALTER TABLE insight_correlations 
  RENAME COLUMN insight_b_id TO department_insight_2_id;

ALTER TABLE insight_correlations 
  ADD COLUMN IF NOT EXISTS global_insight_id UUID REFERENCES global_insights(id),
  RENAME COLUMN description TO relationship_description;

-- Fix department_insights
ALTER TABLE department_insights 
  ADD COLUMN IF NOT EXISTS insight_data JSONB DEFAULT '{}';
```

### Option 2: Update Edge Function Code

Modify `central-mml-processor` to use existing schema (NOT RECOMMENDED - loses functionality).

---

## 📊 Data Flow Analysis

### Current Flow (BROKEN)

```
Layer 1: department_insights (discrete columns)
    ↓
Layer 2: central-mml-processor (expects insight_data JSONB)
    ↓
❌ FAILS - Column mismatch
    ↓
Layer 2: global_insights (INSERT fails)
```

### Expected Flow (AFTER FIX)

```
Layer 1: department_insights + insight_data
    ↓
Layer 2: central-mml-processor processes
    ↓
Layer 2: global_insights + insight_correlations
    ↓
Layer 3: insight_feedback → back to Layer 1
```

---

## 🎯 Validation Checklist

- [ ] Fix `global_insights` schema
- [ ] Fix `insight_correlations` schema
- [ ] Fix `department_insights` schema
- [ ] Test `central-mml-processor` inserts
- [ ] Verify Layer 1 → Layer 2 data flow
- [ ] Verify Layer 2 → Layer 3 feedback loop
- [ ] Update all consuming code
- [ ] Re-run validation script

---

## 📝 Next Steps

1. **Immediate:** Create migration to fix schema mismatches
2. **Test:** Run `central-mml-processor` manually to verify fixes
3. **Monitor:** Watch for insert errors in edge function logs
4. **Document:** Update API_REFERENCE.md with correct schema

---

## 🔍 Redundancy Analysis

### ✅ Acceptable Redundancies

These are **intentional** and serve different purposes:

1. **`customer_id` in all tables**  
   - ✅ Required for RLS data isolation
   - ✅ Each layer needs independent customer scoping

2. **`confidence_score` in both layers**  
   - ✅ Layer 1: Individual insight confidence
   - ✅ Layer 2: Aggregated cross-dept confidence

3. **`insight_type` in both layers**  
   - ✅ Layer 1: Department-specific types (pattern, bottleneck, etc.)
   - ✅ Layer 2: Organization-wide types (cross_department_pattern, etc.)

### ❌ Problematic Redundancies

None found - all redundancies are architectural necessities.

---

## 📈 Performance Considerations

### ✅ Optimized

- All customer_id columns indexed
- Composite indexes on high-traffic queries
- Proper foreign key cascades

### ⏱️ Potential Bottlenecks

- `central-mml-processor` processes all insights from last 7 days every 6 hours
- No pagination on insight queries (could be slow with 1000s of insights)

**Recommendation:** Add `LIMIT` clause to insight queries if dataset grows large.

---

## 🔒 Security Review

### ✅ Secure

- RLS enabled on all tables
- Customer isolation enforced
- No public access to sensitive insights
- Admin-only mutation policies

### ⚠️ Considerations

- Service role key used in `central-mml-processor` (acceptable for cron jobs)
- No audit trail for global insight mutations (consider adding)

---

## Summary

**Overall Status:** ❌ NOT PRODUCTION READY  
**Blocking Issues:** 3 critical schema mismatches  
**Estimated Fix Time:** 30 minutes (migration + testing)

Once schema is fixed, the three-tier AI architecture will be fully functional.
