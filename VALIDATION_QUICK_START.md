# Automatic Validation Quick Start

This project enforces all checks from `AUTOMATIC_VALIDATION_PROCEDURES.md` and `AI_WORK_PROCEDURES_CHECKLIST.md` automatically.

## When to Run Validation

### After Every Code Edit (Manual - REQUIRED in Lovable)
When editing code in Lovable, run validation manually after changes:
```bash
npm run validate
```
This ensures your changes pass all checks before committing.

## Automatic Enforcement

### 1. Pre-Commit Hook (Local)
Every commit automatically runs comprehensive validation:
- TypeScript compilation
- Database query safety (.single() checks)
- Design system compliance (no hardcoded colors)
- Security patterns
- Edge function validation
- Input validation coverage
- ESLint checks

**If validation fails, the commit is blocked.**

### 2. GitHub Actions (CI/CD)
Every push and PR runs the same validation suite on GitHub.

### 3. Manual Validation (REQUIRED After Code Edits)
**IMPORTANT**: Run after every code edit in Lovable:

```bash
# Quick validation (RECOMMENDED)
npm run validate

# Or directly
node scripts/validate-all.js

# Or using shell script
bash scripts/run-validation.sh
```

**Best Practice**: Run `npm run validate` immediately after making code changes in Lovable to catch issues early, before committing.

**Automatic CI/CD**: All validations also run automatically via GitHub Actions on every push.

## What Gets Checked

From **AUTOMATIC_VALIDATION_PROCEDURES.md**:
- ✅ Database queries: No `.single()` without null checks
- ✅ Input validation: All edge functions validate inputs
- ✅ Security: Secrets, RLS policies, auth checks
- ✅ Design system: No hardcoded colors (text-white, bg-black, etc.)
- ✅ TypeScript: Zero compilation errors

From **AI_WORK_PROCEDURES_CHECKLIST.md**:
- ✅ Code quality: ESLint compliance
- ✅ Pattern propagation: Consistent fixes across codebase
- ✅ Build verification: Clean compilation
- ✅ Documentation: Updates tracked in RECENT_FIXES

## Bypassing (Emergency Only)

```bash
# Skip validation (NOT RECOMMENDED)
git commit --no-verify -m "emergency fix"
```

## Adding New Checks

Edit `scripts/validate-all.js` to add new validation rules. The script is comprehensive and scans:
- All TypeScript/TSX files in `src/`
- All edge functions in `supabase/functions/*/index.ts`
- Design system tokens
- Security patterns

## Status Dashboard

Run validation to see real-time status:
```bash
npm run validate
```

**Pre-commit Hook Results**: When you commit, the validation runs automatically and displays results in your terminal before the commit completes.

## Integration with AI

The AI assistant has these validation procedures in its knowledge base and will:
1. Automatically apply fixes when issues are detected
2. Run validation checks after code changes
3. Update `RECENT_FIXES_2025_10_15.md` with all changes
4. Propagate patterns across similar code

## Troubleshooting

**Pre-commit hook not running?**
```bash
npx husky install
chmod +x .husky/pre-commit
```

**Validation script fails?**
```bash
chmod +x scripts/run-validation.sh
npm install
```

**Want to see what changed?**
```bash
git diff HEAD
```

## Success Metrics

Zero tolerance for:
- ❌ `.single()` without null handling
- ❌ Hardcoded colors (must use design tokens)
- ❌ Missing input validation in edge functions
- ❌ TypeScript compilation errors
- ❌ Secrets in code

All checks must pass before:
- ✅ Committing code
- ✅ Pushing to GitHub
- ✅ Merging PRs
- ✅ Deploying to production
