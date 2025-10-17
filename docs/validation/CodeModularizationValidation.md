# Code Modularization Validation

This document describes the automated checks we run to keep the codebase modular, consistent, and easy to troubleshoot.

## How to Run

Run locally at any time:

```
node scripts/validate-code-modularization.js
```

The script scans `src/**/*.ts(x)` and prints a summary of findings. It exits with a non‑zero code if any `error` level issues are found.

## Rules Checked

1. Centralized Auth Usage (rule: AUTH_IN_UI)
   - UI files (`src/components`, `src/pages`) should not call `supabase.auth.getSession()` or `supabase.auth.onAuthStateChange()` directly.
   - Use the centralized `useAuth()` hook instead.

2. Hooks Ordering (rule: EARLY_RETURN_BEFORE_HOOKS)
   - Prevent early `return` before the first React hook call in function components.
   - Hooks must always run in the same order.

3. Design System Colors (rule: HARDCODED_COLORS)
   - Avoid `text-white`, `bg-black`, etc. Use semantic tokens from the design system.

4. Data Access in UI (rule: DB_IN_UI)
   - Prefer moving `supabase.from(...)` calls into hooks/services.

## Interpreting Results

- `error`: Must fix immediately to avoid runtime bugs.
- `warn`: Should fix to improve modularity/consistency.
- `info`: Consider refactoring when touching related code.

## Recommended Refactor Flow

- Replace direct auth checks in UI with `useAuth()`.
- Move data fetching to dedicated hooks under `src/hooks/`.
- Ensure no early returns occur before hooks.
- Replace hardcoded color classes with semantic tokens.

## Notes

- The validator is heuristic-based and aims for high signal with low false positives.
- If you find a false positive, annotate the code and we can evolve the rule.
