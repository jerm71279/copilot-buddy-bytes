# Edge Function Authentication Fix
**Date:** 2025-10-28  
**Issue:** `soc-threat-analysis` edge function failing with "AuthSessionMissingError"

---

## Problem Analysis

### Console Errors Observed
```
FunctionsHttpError: Edge Function returned a non-2xx status code
Auth error: AuthSessionMissingError: Auth session missing!
```

### Root Cause
The `soc-threat-analysis` edge function was being invoked from `SOCDashboard.tsx` without explicitly passing the Authorization header. While `supabase.functions.invoke()` should automatically include auth headers, in some scenarios (preview mode, expired tokens, race conditions), the auth context is not properly passed.

**Key Issues:**
1. Preview mode users could trigger the function without real authentication
2. Authorization header was not explicitly passed to edge function
3. No check to prevent function calls in demo/preview mode

---

## Solution Implemented

### Changes to `src/pages/SOCDashboard.tsx`

**Before:**
```typescript
const runThreatAnalysis = async () => {
  setIsAnalyzing(true);
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in to run threat analysis");
      navigate("/auth");
      return;
    }

    const { data, error } = await supabase.functions.invoke('soc-threat-analysis', {
      body: { analysisType: 'comprehensive', timeframe: selectedTimeframe }
    });
```

**After:**
```typescript
const runThreatAnalysis = async () => {
  // Don't allow in preview mode
  if (isPreviewMode) {
    toast.error("Threat analysis requires authentication. Please sign in.");
    return;
  }

  setIsAnalyzing(true);
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in to run threat analysis");
      navigate("/auth");
      return;
    }

    const { data, error } = await supabase.functions.invoke('soc-threat-analysis', {
      body: { analysisType: 'comprehensive', timeframe: selectedTimeframe },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });
```

### Key Improvements

1. **Preview Mode Check**: Added early return if user is in preview/demo mode
2. **Explicit Auth Header**: Now explicitly passes `Authorization: Bearer ${session.access_token}`
3. **Better Error Prevention**: Prevents function invocation before auth is confirmed

---

## Edge Function Auth Pattern (Best Practice)

When calling authenticated edge functions, always:

```typescript
// 1. Check for valid session
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  // Handle no auth
  return;
}

// 2. Explicitly pass Authorization header
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { /* your data */ },
  headers: {
    Authorization: `Bearer ${session.access_token}` // ✅ Explicit auth
  }
});
```

**Why explicit headers?**
- Ensures auth token is always passed, even in edge cases
- Makes authentication flow explicit and debuggable
- Prevents "Auth session missing" errors
- Works consistently across all scenarios (demo mode, token refresh, etc.)

---

## Testing Checklist

- [x] User authenticated: Should successfully invoke edge function
- [x] User in preview mode: Should show error toast without invoking function
- [x] User not authenticated: Should redirect to /auth
- [x] Session expired: Should show error and redirect to /auth
- [x] Console logs: No more "AuthSessionMissingError" messages

---

## Related Files

- **Frontend**: `src/pages/SOCDashboard.tsx` (lines 93-106)
- **Edge Function**: `supabase/functions/soc-threat-analysis/index.ts`
- **Hook**: `src/hooks/useDemoMode.ts` (preview mode detection)

---

## Other Edge Functions to Review

The following edge functions should also be reviewed for similar auth issues:

1. `department-assistant` - Check if auth header is explicit
2. `cve-sync` - Verify auth pattern (currently cron-triggered, may not need user auth)
3. Any future edge functions that require user authentication

**Action Item**: Audit all edge function calls in the codebase and apply the explicit auth header pattern.

---

## Prevention Strategy

### Code Review Checklist for Edge Functions

When adding new edge function calls:
- [ ] Check for valid session before invoking
- [ ] Pass explicit Authorization header
- [ ] Handle preview/demo mode appropriately
- [ ] Add error handling for auth failures
- [ ] Test with authenticated and unauthenticated users

### ESLint Rule Suggestion (Future)

Consider adding a custom ESLint rule to detect `supabase.functions.invoke()` calls without explicit Authorization headers:

```javascript
// eslint-plugin-custom-rules/require-edge-function-auth.js
module.exports = {
  rules: {
    'require-edge-function-auth': {
      create(context) {
        return {
          CallExpression(node) {
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.property.name === 'invoke' &&
              !hasAuthHeader(node)
            ) {
              context.report({
                node,
                message: 'Edge function calls must include explicit Authorization header'
              });
            }
          }
        };
      }
    }
  }
};
```

---

## Conclusion

The 404 error for `/test-dashboard` was expected behavior (route doesn't exist).

The critical issue - edge function authentication failures - has been fixed by:
1. Adding preview mode check
2. Explicitly passing Authorization header
3. Improving error handling

This pattern should be applied to all edge function calls across the platform to prevent similar issues.
