# AI Work Procedures Checklist Automation

This document describes the automated enforcement of the AI_WORK_PROCEDURES_CHECKLIST.md through three mechanisms.

## 1. Project Knowledge Integration

### Setup Instructions
1. Go to Project Settings → Manage Knowledge
2. Click "Add Knowledge"
3. Copy the contents of `AI_WORK_PROCEDURES_CHECKLIST.md`
4. Paste into the knowledge field
5. Save

**What This Does:**
- Makes the checklist always available in AI context
- AI references it for every code change
- Ensures consistent adherence to procedures

## 2. GitHub Actions CI/CD Validation

### Location
`.github/workflows/checklist-validation.yml`

### What It Validates
- ✅ TypeScript compilation (no errors)
- ✅ ESLint compliance
- ✅ Unit tests pass
- ✅ No hardcoded colors (design system compliance)
- ✅ Security patterns in edge functions
- ✅ Input validation presence

### When It Runs
- On every push to any branch
- On every pull request
- Automatically on GitHub

### Validation Scripts
1. **Design System Validator** (`scripts/validate-design-system.js`)
   - Scans all .tsx/.ts files
   - Detects hardcoded color classes
   - Enforces semantic token usage
   - Excludes test/story files

2. **Security Validator** (`scripts/validate-security.js`)
   - Checks edge functions for `.single()` usage
   - Validates input validation presence
   - Detects potential SQL injection
   - Checks environment variable validation

3. **Edge Function Validator** (`scripts/validate-edge-functions.js`)
   - Ensures `req.json()` has type checking
   - Validates array length limits
   - Checks for null/undefined handling

### View Results
- Check the Actions tab in GitHub repository
- Failed checks block merge (if configured)
- Detailed violation reports in logs

## 3. Pre-commit Hook (Local Development)

### Setup
After cloning the repository:
```bash
npm install
npx husky install
```

### What It Does
Runs before every git commit:
1. Lints and formats staged files
2. Runs TypeScript type checking
3. Validates design system compliance
4. Checks security patterns
5. Blocks commit if violations found

### Configured With
- **Husky**: Git hooks management
- **lint-staged**: Only checks staged files
- **Validation scripts**: Same as CI/CD

### Configuration
- `.husky/pre-commit` - Hook script
- `.lintstagedrc.json` - Staged file processing

## Checklist Enforcement Matrix

| Check | GitHub Action | Pre-commit Hook | Manual |
|-------|--------------|----------------|--------|
| TypeScript Errors | ✅ | ✅ | ✅ |
| ESLint | ✅ | ✅ | ✅ |
| Unit Tests | ✅ | ⚠️ Optional | ✅ |
| Hardcoded Colors | ✅ | ✅ | ✅ |
| Security Patterns | ✅ | ✅ | ✅ |
| Input Validation | ✅ | ⚠️ Warning | ✅ |
| Design System | ✅ | ✅ | ✅ |

## Manual Checklist Items

Some checklist items cannot be automated and require manual verification:

### Code Quality
- ✋ Functions are focused and maintainable
- ✋ Proper error handling for edge cases
- ✋ No scope creep beyond request
- ✋ Refactoring when needed

### Documentation
- ✋ RECENT_FIXES updated
- ✋ VALIDATION_PROCEDURES updated
- ✋ Feature documentation updated
- ✋ API_REFERENCE updated (if applicable)

### Communication
- ✋ Concise responses (1-2 sentences)
- ✋ Clear, actionable summaries
- ✋ Proper use of action links

## Bypassing Checks (Emergency Only)

### Skip Pre-commit Hook
```bash
git commit --no-verify -m "Emergency fix"
```

⚠️ **Warning**: Only use in genuine emergencies. The CI/CD will still validate.

### Override CI/CD
Not recommended. Fix the violations instead.

## Adding New Validation Rules

### 1. Update Validation Script
Add pattern to appropriate script in `scripts/`:
```javascript
{
  pattern: /your-pattern/,
  rule: 'Description of the rule',
  severity: 'error', // or 'warning', 'critical'
}
```

### 2. Update GitHub Action
Add step to `.github/workflows/checklist-validation.yml` if needed.

### 3. Test Locally
```bash
node scripts/validate-design-system.js
node scripts/validate-security.js
```

### 4. Update Documentation
Add new rule to this document and AI_WORK_PROCEDURES_CHECKLIST.md.

## Troubleshooting

### Pre-commit Hook Not Running
```bash
npx husky install
chmod +x .husky/pre-commit
```

### Validation Scripts Fail
```bash
# Make scripts executable
chmod +x scripts/*.js

# Verify Node.js version
node --version  # Should be 18+
```

### False Positives
Add exclusions to validation scripts:
- Test files: Already excluded
- Generated files: Add to `EXCLUDED_DIRS`
- Specific patterns: Update regex patterns

## Monitoring and Metrics

### GitHub Action Insights
- View success rate: Actions → Workflows → Checklist Validation
- Check average runtime
- Review failure patterns

### Local Metrics
Track in commit messages:
```
✅ Checklist: All automated checks passed
⚠️ Checklist: 2 warnings (design system)
```

## Future Enhancements

### Planned
1. Coverage threshold enforcement (80%+)
2. Bundle size checks
3. Performance budget validation
4. Accessibility automated testing
5. Visual regression testing integration

### Under Consideration
1. AI-powered code review
2. Automated documentation generation
3. Security vulnerability scanning
4. Dependency audit automation

## Related Documentation
- [AI Work Procedures Checklist](./AI_WORK_PROCEDURES_CHECKLIST.md)
- [Testing Strategy](./TESTING_STRATEGY.md)
- [Validation Procedures](./VALIDATION_PROCEDURES.md)
- [Security Master Plan](./SECURITY_MASTER_PLAN.md)

---

**Last Updated**: 2025-10-15  
**Version**: 1.0.0
