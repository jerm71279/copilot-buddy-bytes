# Validation Quick Reference Guide

## Running Validations

### Full Validation Suite
```bash
node scripts/validate-all.js
```

This runs ALL validation checks including:
1. ✅ TypeScript Compilation
2. 🗄️ Database Query Safety (`.single()` → `.maybeSingle()`)
3. 🎨 Design System Compliance (no hardcoded colors)
4. 🔒 Security Patterns
5. ⚡ Edge Function Validation
6. 📝 Input Validation Coverage
7. 🎨 **Layout Uniformity (NEW)**
8. 🔧 ESLint
9. 📚 Documentation Updates

### Individual Validations

**Code Modularization:**
```bash
node scripts/validate-code-modularization.js
```
Checks for:
- Duplicate authentication patterns
- Redundant data fetching
- Unused hooks
- Complex components (>500 lines)
- Import reusability

**Layout Uniformity:**
```bash
node scripts/validate-layout-uniformity.js
```
Checks for:
- Consistent page structure
- Standard header patterns
- Responsive design patterns
- Spacing consistency

**Design System:**
```bash
node scripts/validate-design-system.js
```
Checks for:
- Hardcoded color classes
- Missing semantic tokens
- Non-HSL colors

---

## Expected Output

### 🎯 Successful Run
```
🔍 COMPREHENSIVE VALIDATION

✅ TypeScript: No errors
✅ Database Safety: All queries use .maybeSingle()
✅ Design System: No hardcoded colors
✅ Security: All patterns validated
✅ Edge Functions: Validated
✅ Input Validation: All covered
✅ Layout Uniformity: Consistent patterns
✅ ESLint: No issues
✅ Documentation: Up to date

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 VALIDATION SUMMARY

Errors:   0
Warnings: 0

✅ ALL CHECKS PASSED - Safe to commit!
```

### ⚠️ With Warnings
```
🔍 COMPREHENSIVE VALIDATION

✅ TypeScript: No errors
⚠️  Design System: 3 hardcoded colors found
⚠️  Layout Uniformity: 5 inconsistencies
✅ ESLint: No issues

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 VALIDATION SUMMARY

Errors:   0
Warnings: 2

⚠️  WARNINGS FOUND - Review recommended
```

### 🔴 With Errors
```
🔍 COMPREHENSIVE VALIDATION

❌ TypeScript: 3 compilation errors
❌ Database Safety: 2 uses of .single() found
✅ Design System: No hardcoded colors

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 VALIDATION SUMMARY

Errors:   2
Warnings: 0

❌ VALIDATION FAILED - Fix errors before committing
```

---

## Common Issues & Fixes

### 🎨 Hardcoded Colors
**Issue:**
```tsx
<div className="text-green-500">Success</div>
<Badge className="bg-blue-500">Active</Badge>
```

**Fix:**
```tsx
<div className="text-primary">Success</div>
<Badge variant="default">Active</Badge>
```

### 📐 Layout Inconsistency
**Issue:**
```tsx
<div className="min-h-screen">
  <div className="p-4">
```

**Fix:**
```tsx
<div className="min-h-screen bg-background">
  <div className="container mx-auto px-4 pb-8 pt-8"
       style={{ marginTop: 'var(--lanes-height, 0px)' }}>
```

### 🗄️ Database Query Safety
**Issue:**
```tsx
const { data } = await supabase
  .from('table')
  .select()
  .single();
```

**Fix:**
```tsx
const { data } = await supabase
  .from('table')
  .select()
  .maybeSingle();

if (!data) {
  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
}
```

### 🪝 Hook Duplication
**Issue:** Same query logic in 5+ files

**Fix:** Create dedicated hook:
```tsx
// src/hooks/useTickets.ts
export const useTickets = (customerId: string) => {
  return useQuery({
    queryKey: ['tickets', customerId],
    queryFn: async () => {
      const { data } = await supabase
        .from('tickets')
        .select('*')
        .eq('customer_id', customerId);
      return data;
    }
  });
};
```

---

## Validation Workflow

### Before Every Commit
```bash
# 1. Run full validation
node scripts/validate-all.js

# 2. Fix any errors (critical)
# 3. Address warnings (recommended)

# 4. Commit
git add .
git commit -m "feat: your changes"
```

### Weekly Review
```bash
# 1. Run modularization check
node scripts/validate-code-modularization.js

# 2. Review complex components
# 3. Plan refactoring if needed
```

### Monthly Audit
```bash
# 1. Run all validation scripts
node scripts/validate-all.js
node scripts/validate-code-modularization.js
node scripts/validate-layout-uniformity.js

# 2. Update documentation
# 3. Create refactoring tickets
```

---

## Validation Scores

### Modularization Score
- **90-100%**: Excellent - Well-modularized codebase
- **75-89%**: Good - Minor improvements needed
- **60-74%**: Fair - Refactoring recommended
- **<60%**: Poor - Significant refactoring required

**Current Score:** 82% (Good)

### Layout Uniformity
- **<5 issues**: Excellent
- **5-10 issues**: Good
- **10-20 issues**: Fair
- **>20 issues**: Needs work

**Current Status:** 8 issues (Good)

---

## Quick Fixes Checklist

### For New Pages
- [ ] Use standard layout wrapper
- [ ] Include page header with icon + title + description
- [ ] Use semantic color tokens only
- [ ] Implement responsive grid patterns
- [ ] Add to routing in App.tsx
- [ ] Test on mobile/tablet/desktop

### For New Components
- [ ] Keep under 300 lines
- [ ] Extract complex logic to hooks
- [ ] Use design system tokens
- [ ] Add proper TypeScript types
- [ ] Include JSDoc comments

### For New Edge Functions
- [ ] Use shared auth from `_shared/supabaseAuth.ts`
- [ ] Validate all inputs
- [ ] Use `.maybeSingle()` not `.single()`
- [ ] Handle errors gracefully
- [ ] Add to validation coverage

---

## Automation

### Git Hook (Recommended)
Add to `.husky/pre-commit`:
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Running validation..."
node scripts/validate-all.js

if [ $? -ne 0 ]; then
  echo "❌ Validation failed. Commit aborted."
  exit 1
fi

echo "✅ Validation passed!"
```

### CI/CD Integration
Add to `.github/workflows/validate.yml`:
```yaml
name: Validate
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: node scripts/validate-all.js
```

---

## Troubleshooting

### "Command not found"
**Solution:** Ensure you're in the project root directory

### "Module not found"
**Solution:** Run `npm install` first

### "Permission denied"
**Solution:** Make script executable:
```bash
chmod +x scripts/validate-*.js
```

### Too many warnings
**Solution:** Fix highest priority issues first:
1. Hardcoded colors (critical)
2. Layout inconsistencies (high)
3. Complex components (medium)

---

## Resources

- **Full Validation Report:** `VALIDATION_REPORT_2025_01_15.md`
- **Recent Fixes:** `RECENT_FIXES_2025_10_15.md`
- **Validation Procedures:** `VALIDATION_PROCEDURES.md`
- **Modularization Report:** `DATA_LAKE_MODULARIZATION_REPORT.md`

---

**Last Updated:** 2025-01-15  
**Next Review:** 2025-01-22
