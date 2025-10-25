# Enhanced Validation Guide

## New Comprehensive Validation Scripts

### 1. Input Security Validation (`validate-input-security.js`)

**Purpose:** Deep analysis of ALL edge function input validation to prevent injection attacks and data corruption.

**What it checks:**

✅ **Complete Input Coverage**
- Every field extracted from `req.json()` is validated
- Type checking with `typeof` or Zod schemas
- Array validation with `Array.isArray()`
- String sanitization with `.trim()` and length limits

✅ **Length Limits Enforcement**
- operationName: max 200 characters
- resourceName: max 100 characters
- description: max 1000 characters
- message: max 2000 characters

✅ **Array Batch Size Limits**
- Maximum 100 items per array input
- Uses `.slice(0, 100)` to enforce limits
- Prevents memory exhaustion attacks

✅ **SQL Injection Protection**
- Blocks patterns: `DROP TABLE`, `UNION SELECT`, `DELETE FROM`, `--`, `/* */`
- Uses validation functions from database
- Prevents raw SQL execution

✅ **XSS Protection**
- Blocks patterns: `<script`, `<iframe`, `javascript:`, `onerror=`, `onload=`
- Sanitizes HTML content
- Filters dangerous event handlers

✅ **Control Character Filtering**
- Removes null bytes (`\x00`)
- Strips control characters (`\x00-\x1F`, `\x7F`)
- Prevents data corruption

✅ **Validation Order**
- Ensures validation happens BEFORE database queries
- Proper 400 error responses with descriptive messages
- Each field gets individual validation

**How to run:**

```bash
# Standalone
node scripts/validate-input-security.js

# As part of full validation
npm run validate
```

**Output:**
```
🛡️  Starting Comprehensive Input Security Analysis...

Found 47 edge functions to analyze

============================================================
Analyzing: workflow-insights
============================================================
🔍 workflow-insights: Found 1 input extraction point(s)
✅ workflow-insights: String length limits enforced
✅ workflow-insights: Array batch size properly limited
✅ workflow-insights: Using validation functions (SQL protection)
✅ workflow-insights: XSS pattern validation present
✅ workflow-insights: Proper error responses implemented
✅ workflow-insights: Validation occurs before database queries
✅ workflow-insights: 100% of fields validated

============================================================
📊 INPUT SECURITY VALIDATION SUMMARY
============================================================

Total Functions Analyzed: 47
Total Issues Found: 0
Total Passed Checks: 312

🎯 INPUT SECURITY SCORE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Score: 97/100
Status: ✅ EXCELLENT - Strong input validation security
```

---

### 2. Aggregation Query Validation (`validate-aggregations.js`)

**Purpose:** Analyze and optimize database aggregation queries for performance and correctness.

**What it checks:**

✅ **Detected Aggregate Operations**
- `SUM()` - Sum calculations
- `COUNT()` - Record counting
- `AVG()` - Averages
- `MIN()` / `MAX()` - Min/max values
- `GROUP BY` - Grouping
- `HAVING` - Group filtering
- `DISTINCT` - Unique values

✅ **Performance Optimization**
- WHERE clauses to limit data scanned
- LIMIT on GROUP BY to bound result sets
- Pagination for large result sets (offset/cursor)
- Index usage on grouped columns
- Avoids unbounded queries

✅ **NULL Handling**
- Uses `COALESCE()` for default values
- Uses `NULLIF()` to handle edge cases
- Proper `IS NOT NULL` checks
- Prevents division by zero errors

✅ **Data Type Correctness**
- Explicit type casting (`::numeric`, `::integer`)
- Proper numeric aggregations
- Avoids string-to-number conversion issues

✅ **Client-Side Efficiency**
- Detects client-side aggregations that should move to database
- Checks for `useMemo` on expensive operations
- Validates filter-before-reduce patterns

✅ **Query Optimization**
- Detects `COUNT(DISTINCT)` on large datasets (slow)
- Identifies subqueries in aggregations
- Suggests materialized views for frequent aggregations

**How to run:**

```bash
# Standalone
node scripts/validate-aggregations.js

# As part of full validation
npm run validate
```

**Output:**
```
📊 Starting Aggregation Query Analysis...

🔍 Scanning Edge Functions for Aggregations...

============================================================
Function: workflow-insights
============================================================
  Found 3 COUNT operation(s)
  Found 1 AVG operation(s)
  Found 2 GROUP BY operation(s)
  
✅ workflow-insights: NULL handling present (COALESCE/NULLIF)
✅ workflow-insights: Pagination present for large datasets
ℹ️  workflow-insights: GROUP BY detected - verify index on grouped columns

============================================================
📊 AGGREGATION VALIDATION SUMMARY
============================================================

Total Edge Functions Scanned: 47
Functions with Aggregations: 12
Total Aggregation Operations: 38
Source Files Scanned: 287

Performance Issues: 0
Optimization Opportunities: 3
Correctness Warnings: 1
Passed Checks: 45

🎯 AGGREGATION EFFICIENCY SCORE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Score: 92/100
Status: ✅ EXCELLENT - Highly optimized aggregations
```

---

## Integration with Main Validation

Both scripts are now integrated into `scripts/validate-all.js`:

```javascript
// ===== 6. COMPREHENSIVE INPUT SECURITY VALIDATION =====
execSync('node scripts/validate-input-security.js');

// ===== 7. AGGREGATION QUERY VALIDATION =====
execSync('node scripts/validate-aggregations.js');
```

**Updated validation sequence:**
1. TypeScript compilation
2. Database query safety (`.single()` checks)
3. Design system compliance
4. Security patterns
5. Edge function validation
6. **🆕 Comprehensive input security** ← NEW
7. **🆕 Aggregation query validation** ← NEW
8. Layout uniformity
9. ESLint
10. Documentation updates

---

## Scoring System

### Input Security Score (out of 100)
- **Critical issues:** -10 points each
- **High severity:** -5 points each
- **Medium severity:** -2 points each
- **Low severity:** -1 point each

**Score thresholds:**
- 90-100: ✅ Excellent
- 70-89: ⚠️ Good
- 50-69: ⚠️ Needs Improvement
- 0-49: 🚨 Critical

### Aggregation Efficiency Score (out of 100)
- **Performance issues:** -5 points each
- **Optimization opportunities:** -2 points each
- **Correctness warnings:** -1 point each

**Score thresholds:**
- 90-100: ✅ Excellent
- 70-89: ⚠️ Good
- 50-69: ⚠️ Needs Improvement
- 0-49: 🚨 Critical

---

## Best Practices

### Input Validation Checklist
- [ ] Every field from `req.json()` is validated
- [ ] Length limits enforced (200/100/1000/2000 chars)
- [ ] Arrays limited to 100 items max
- [ ] Type checking with `typeof` or Zod
- [ ] SQL injection patterns blocked
- [ ] XSS patterns blocked
- [ ] Control characters filtered
- [ ] Validation before database queries
- [ ] Proper 400 error responses

### Aggregation Optimization Checklist
- [ ] WHERE clause limits data scanned
- [ ] LIMIT bounds result sets
- [ ] NULL handling with COALESCE/NULLIF
- [ ] Indexes on grouped columns
- [ ] Pagination for large results
- [ ] Explicit type casting
- [ ] No COUNT(DISTINCT) on huge datasets
- [ ] Client-side aggregations memoized
- [ ] Database handles heavy lifting

---

## Performance Targets

### Input Validation
- Validation logic: < 10ms
- Error response: < 50ms
- Field validation: < 1ms per field

### Aggregation Queries
- Simple aggregations: < 500ms
- Complex GROUP BY: < 1000ms
- Large datasets (paginated): < 2000ms

---

## Examples

### ✅ Good Input Validation
```typescript
const requestData = await req.json();

// Validate structure
if (!requestData || typeof requestData !== 'object') {
  return new Response(
    JSON.stringify({ error: 'Invalid request body' }),
    { status: 400, headers: corsHeaders }
  );
}

// Validate each field
const operationName = String(requestData.operationName || '').slice(0, 200);
const resourceName = String(requestData.resourceName || '').slice(0, 100);
const items = Array.isArray(requestData.items) 
  ? requestData.items.slice(0, 100) 
  : [];

if (!operationName) {
  return new Response(
    JSON.stringify({ error: 'operationName is required' }),
    { status: 400, headers: corsHeaders }
  );
}
```

### ✅ Good Aggregation Query
```typescript
const { data, error } = await supabase
  .from('workflows')
  .select('department, COUNT(*) as count, AVG(COALESCE(score, 0)) as avg_score')
  .eq('customer_id', customerId)
  .gte('created_at', startDate)
  .groupBy('department')
  .limit(50);
```

---

## Troubleshooting

### Input Security Failures
**Issue:** Critical security issues detected

**Solutions:**
1. Add validation for all extracted fields
2. Enforce length limits with `.slice()`
3. Use `validate_text_input()` database function
4. Add Array.isArray() checks
5. Validate BEFORE database queries

### Aggregation Performance Issues
**Issue:** Slow aggregation queries

**Solutions:**
1. Add WHERE clause to limit scanned data
2. Create indexes on grouped columns
3. Add LIMIT to bound result sets
4. Use pagination for large results
5. Move client-side aggregations to database

---

## CI/CD Integration

Add to `.github/workflows/checklist-validation.yml`:

```yaml
- name: Validate Input Security
  run: node scripts/validate-input-security.js

- name: Validate Aggregations
  run: node scripts/validate-aggregations.js
```

---

**Last Updated:** 2025-01-15  
**Version:** 2.0.0
