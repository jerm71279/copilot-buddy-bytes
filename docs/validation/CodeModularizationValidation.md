# Code Modularization Validation

This document describes the automated checks we run to keep the codebase modular, consistent, and easy to troubleshoot.

## How to Run

Run locally at any time:

```bash
node scripts/validate-code-modularization.js
```

The script scans `src/**/*.ts(x)` and prints a summary of findings. It exits with a non‑zero code if any `error` level issues are found.

## Rules Checked

1. **Centralized Auth Usage** (rule: AUTH_IN_UI)
   - UI files (`src/components`, `src/pages`) should not call `supabase.auth.getSession()` or `supabase.auth.onAuthStateChange()` directly.
   - **Use the centralized `useAuth()` hook instead.**
   - ✅ **Phase 1 Complete**: Navigation.tsx, ProtectedRoute.tsx, and GlobalSearch.tsx refactored to use useAuth()

2. **Hooks Ordering** (rule: EARLY_RETURN_BEFORE_HOOKS)
   - Prevent early `return` before the first React hook call in function components.
   - Hooks must always run in the same order.
   - ✅ **Fixed**: DashboardPortalLanes.tsx now properly handles loading state

3. **Design System Colors** (rule: HARDCODED_COLORS)
   - Avoid `text-white`, `bg-black`, etc. Use semantic tokens from the design system.
   - ✅ **Status**: No violations currently detected

4. **Data Access in UI** (rule: DB_IN_UI)
   - Prefer moving `supabase.from(...)` calls into hooks/services.
   - **Ongoing**: 33+ files with direct DB access - gradual refactor recommended

## Interpreting Results

- `error`: Must fix immediately to avoid runtime bugs.
- `warn`: Should fix to improve modularity/consistency.
- `info`: Consider refactoring when touching related code.

## Phase 1 Refactor Results (2025-10-17)

### Changes Made
1. **useAuth Hook Enhanced**
   - Added `isAdmin` state and admin role checking
   - Centralized admin role detection with RPC fallback
   
2. **Navigation.tsx** (~80 lines removed)
   - Removed local `isLoggedIn`, `isAdmin`, `userEmail` state
   - Removed `checkAuth()` function and auth listener
   - Now uses `useAuth()` hook for all auth state
   
3. **ProtectedRoute.tsx** (~50 lines removed)
   - Removed local auth checking logic
   - Simplified to use `useAuth()` isAuthenticated, isAdmin, isLoading
   
4. **GlobalSearch.tsx** (~10 lines removed)
   - Removed manual session token extraction
   - Supabase functions.invoke auto-attaches auth token

### Benefits
- **~140 lines of duplicate code eliminated**
- Single source of truth for auth state
- Easier to test and maintain
- Reduced risk of auth state desync

## Next Phases

### Phase 2: Component Split (Recommended)
- Split DashboardPortalLanes.tsx (631 lines) into:
  - `components/portals/PortalsBar.tsx`
  - `components/portals/PortalDropdown.tsx`
  - `config/portals.ts` (move portals/categories arrays)

### Phase 3: Data Hooks (Ongoing)
- Create dedicated hooks for frequently accessed tables
- Target: Tables accessed from 3+ different files
- Examples: audit_logs, compliance bundles, workflow data

## Recommended Refactor Flow

1. ✅ Replace direct auth checks in UI with `useAuth()`
2. 🔄 Move data fetching to dedicated hooks under `src/hooks/`
3. 🔄 Ensure no early returns occur before hooks
4. ✅ Replace hardcoded color classes with semantic tokens

## Notes

- The validator is heuristic-based and aims for high signal with low false positives.
- If you find a false positive, annotate the code and we can evolve the rule.
- Re-run validation after major refactors to track progress.
