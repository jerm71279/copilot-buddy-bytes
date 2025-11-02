# Code Redundancy Analysis Report

**Date:** 2025-11-02  
**Status:** In Progress - Modularization Required

## Executive Summary

This document identifies code redundancies and provides refactoring recommendations to improve maintainability and reduce troubleshooting complexity.

## Identified Redundancies

### 1. Edge Function Invocation Pattern

**Current State:** Multiple components directly call `supabase.functions.invoke`

**Files Affected:**
- `src/components/MCPAutoDiscovery.tsx` (line 81)
- `src/components/MCPKnowledgeUpload.tsx` (line 45)
- `src/components/MCPRAGQuery.tsx` (line 52)
- `src/components/MCPServerConfig.tsx` (line 98)
- `src/components/WorkflowBuilder.tsx` (line 259)

**Problem:**
- Duplicate error handling logic
- Inconsistent toast notifications
- No centralized retry logic
- Difficult to debug issues

**Solution:**
✅ **ALREADY IMPLEMENTED:** `useEdgeFunction` hook exists in `src/hooks/useEdgeFunctions.ts`

**Refactoring Required:**
Replace direct `supabase.functions.invoke` calls with `useEdgeFunction` hook

**Example:**
```tsx
// ❌ Current (Redundant)
const { data, error } = await supabase.functions.invoke('mcp-discovery', {
  body: { customer_id: customerId }
});
if (error) throw error;

// ✅ Refactored (Using Hook)
const { invoke } = useEdgeFunction('mcp-discovery', {
  showErrorToast: true,
  errorMessage: 'Failed to discover MCP servers'
});
const data = await invoke({ customer_id: customerId });
```

### 2. AI Function Patterns

**Current State:** Multiple hooks for different AI operations

**Files:**
- `src/hooks/useAIFunctions.ts` - General AI functions
- `src/hooks/useRAGOperations.ts` - RAG operations  
- `src/hooks/useMoE.ts` - MoE routing

**Analysis:**
- ✅ Well-organized domain separation
- ✅ All use `useEdgeFunction` internally
- ✅ Consistent error handling
- ⚠️  Could consolidate into single `useAI` hook with methods

**Recommendation:** KEEP AS IS - Current organization is clean

### 3. Layout Dimension Inconsistencies

**Current Analysis (from validation):**

**Dashboards/Portals Analyzed:** 45+

**Max-Width Variations Found:**
- `max-w-7xl` - Most common (STANDARD)
- `max-w-full` - Used in some portals
- `max-w-6xl` - Legacy pages
- Custom widths - Various pages

**Problem:**
- Inconsistent user experience
- Difficult to maintain responsive design
- Layout bugs hard to trace

**Solution:**
All dashboards/portals MUST use standard pattern:

```tsx
<DashboardLayout className="space-y-6">
  <div className="container mx-auto max-w-7xl px-4 py-6">
    {/* Content */}
  </div>
</DashboardLayout>
```

### 4. Auth Service Patterns

**Current State:**
- `useAuth` hook exists in `src/hooks/useAuth.ts`
- Some files still call `supabase.auth` directly

**Analysis:**
- Multiple files making direct auth calls
- No centralized session management
- Inconsistent auth state handling

**Recommendation:**
- Enforce `useAuth` hook usage
- Deprecate direct `supabase.auth` calls
- Add ESLint rule to prevent direct calls

## Refactoring Priority Matrix

| Priority | Issue | Impact | Effort | Files Affected |
|----------|-------|--------|--------|----------------|
| **HIGH** | Edge function invocations | High | Medium | 5+ components |
| **HIGH** | Layout standardization | High | Low | 20+ pages |
| **MEDIUM** | Auth centralization | Medium | Low | 40+ files |
| **LOW** | AI hook consolidation | Low | Medium | 3 hooks |

## Implementation Plan

### Phase 1: Immediate (This Week)

#### Task 1.1: Standardize Edge Function Calls
**Files to Update:**
1. `src/components/MCPAutoDiscovery.tsx`
2. `src/components/MCPKnowledgeUpload.tsx`
3. `src/components/MCPRAGQuery.tsx`
4. `src/components/MCPServerConfig.tsx`
5. `src/components/WorkflowBuilder.tsx`

**Action:** Replace all `supabase.functions.invoke` with `useEdgeFunction`

#### Task 1.2: Layout Dimension Fixes
**Target:** All dashboards and portals

**Standard Pattern:**
```tsx
<DashboardLayout className="space-y-6">
  <div className="container mx-auto max-w-7xl px-4 py-6">
    {/* Content */}
  </div>
</DashboardLayout>
```

**Pages to Update:**
- Scan validation results for pages not using `max-w-7xl`
- Update each to use standard pattern
- Test responsive behavior

### Phase 2: Short Term (Next 2 Weeks)

#### Task 2.1: Auth Centralization
**Action:**
1. Audit all direct `supabase.auth` calls
2. Migrate to `useAuth` hook
3. Add ESLint rule
4. Document pattern

#### Task 2.2: Documentation
**Action:**
1. Create component library docs
2. Document all hooks
3. Add code examples
4. Create troubleshooting guide

### Phase 3: Long Term (Next Month)

#### Task 3.1: Automated Enforcement
**Action:**
1. Add pre-commit hooks
2. CI/CD validation checks
3. Auto-formatting rules
4. Linting configuration

#### Task 3.2: Performance Optimization
**Action:**
1. Code splitting analysis
2. Bundle size optimization
3. Lazy loading implementation
4. Performance monitoring

## Monitoring & Validation

### Success Metrics

1. **Code Quality**
   - Modularization Score: >= 90/100
   - Zero direct edge function calls in components
   - Zero direct auth calls outside hooks

2. **Layout Uniformity**
   - Uniformity Score: >= 95/100
   - 100% of dashboards use DashboardLayout
   - Single max-width standard (max-w-7xl)

3. **Maintainability**
   - Average file size < 300 lines
   - Component reuse > 70%
   - Hook usage > 80%

### Validation Commands

```bash
# Run validation
Navigate to: /admin/validation

# Check console output
Look for: 📊 VALIDATION REPORT

# Review scores
- Code Analysis: Target >= 90/100
- Layout Validation: Target >= 95/100
```

## Common Patterns & Anti-Patterns

### ✅ DO: Use Hooks for Edge Functions

```tsx
import { useEdgeFunction } from '@/hooks/useEdgeFunctions';

function MyComponent() {
  const { invoke, isLoading, error } = useEdgeFunction('my-function', {
    showErrorToast: true
  });
  
  const handleAction = async () => {
    const result = await invoke({ data });
  };
}
```

### ❌ DON'T: Direct Supabase Calls

```tsx
// DON'T DO THIS
const { data, error } = await supabase.functions.invoke('my-function', {
  body: { data }
});
if (error) {
  toast.error(error.message);
}
```

### ✅ DO: Standard Layout Pattern

```tsx
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export default function MyDashboard() {
  return (
    <DashboardLayout className="space-y-6">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        {/* Content */}
      </div>
    </DashboardLayout>
  );
}
```

### ❌ DON'T: Inconsistent Dimensions

```tsx
// DON'T DO THIS
<div className="max-w-6xl mx-auto px-6 py-8">
```

## Related Documentation

- **Validation System:** See `VALIDATION_AUTOMATION.md`
- **Layout Standards:** See `VALIDATION_AUTOMATION.md` (Dimension Standards)
- **Hooks Guide:** See individual hook files in `src/hooks/`
- **Service Layer:** See `src/services/`

## Change Log

### 2025-11-02
- Initial redundancy analysis
- Identified 5 direct edge function calls
- Documented layout inconsistencies
- Created refactoring plan
- Established success metrics

---

**Next Review:** After Phase 1 completion (1 week)
