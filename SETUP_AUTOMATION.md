# Setup Instructions: Automated Checklist Enforcement

## Quick Start

Three steps to enable all automated validation:

### 1. Add Checklist to Project Knowledge (Manual - 2 minutes)

1. Open Lovable project
2. Click your project name (top left) → **Settings**
3. Navigate to **Manage Knowledge**
4. Click **Add Knowledge**
5. Open `AI_WORK_PROCEDURES_CHECKLIST.md` from your project
6. Copy all contents
7. Paste into the knowledge field
8. Click **Save**

**Result**: AI will reference the checklist for every code change.

### 2. Initialize Git Hooks (Automatic via GitHub)

When you push to GitHub, the workflow will run automatically. No setup needed.

**Or setup locally:**
```bash
# Clone repository
git clone <your-repo-url>
cd <your-project>

# Install dependencies
npm install

# Setup Husky
npx husky install
bash scripts/setup-husky.sh
```

**Result**: Pre-commit validation runs before every commit.

### 3. Verify Setup

```bash
# Run all validations manually
npm run test              # Unit tests
npm run test:coverage     # With coverage report
npm run lint              # ESLint

# Run validation scripts
node scripts/validate-design-system.js
node scripts/validate-security.js
node scripts/validate-edge-functions.js
```

**Expected Output**: ✅ All checks should pass (or show existing violations to fix).

## What's Automated Now

### ✅ On Every Commit (Local)
- TypeScript compilation check
- ESLint compliance
- Design system validation (no hardcoded colors)
- Security pattern checks
- Auto-formatting staged files

### ✅ On Every Push/PR (GitHub)
- All local checks above, plus:
- Unit test suite execution
- Test coverage reporting
- Edge function validation
- Detailed violation reports

### ✅ Always (Project Knowledge)
- AI references checklist for decisions
- Consistent code patterns
- Proper documentation updates
- Security-first approach

## Usage

### Normal Development
```bash
# Make changes
git add .
git commit -m "Add feature"  # Pre-commit hooks run automatically

# If violations found:
# - Fix the issues
# - Commit will be blocked until fixed
```

### Emergency Bypass (Use Sparingly)
```bash
# Only for genuine emergencies
git commit --no-verify -m "Emergency hotfix"

# Note: GitHub Actions will still validate
```

### View Validation Results
- **Local**: Terminal output during commit
- **GitHub**: Actions tab → Checklist Validation workflow
- **Pull Requests**: Checks section shows pass/fail

## Validation Rules

### Design System
❌ **Blocked**: `text-green-600`, `bg-white`, `border-blue-500`  
✅ **Allowed**: `text-primary`, `bg-background`, `border-border`

### Security
❌ **Blocked**: `.single()` without null check  
✅ **Allowed**: `.maybeSingle()` with null handling

❌ **Blocked**: `req.json()` without validation  
✅ **Allowed**: Type checking + null validation

### Code Quality
❌ **Blocked**: TypeScript errors  
✅ **Allowed**: Clean compilation

❌ **Blocked**: ESLint violations  
✅ **Allowed**: Linter-compliant code

## Troubleshooting

### Pre-commit Hook Not Running
```bash
# Reinstall hooks
rm -rf .husky
npx husky install
chmod +x .husky/pre-commit
```

### Scripts Not Executable
```bash
chmod +x scripts/*.js
chmod +x scripts/*.sh
```

### False Positives
Edit the validation scripts to add exclusions:
- `scripts/validate-design-system.js` - Line 12: `EXCLUDED_FILES`
- `scripts/validate-security.js` - Line 11: `SECURITY_PATTERNS`

### GitHub Action Failing
Check the logs:
1. Go to repository → Actions tab
2. Click on failed workflow run
3. Expand failed steps
4. Fix violations shown in logs

## Customization

### Add New Validation Rules

1. **Edit validation script** (`scripts/validate-*.js`):
```javascript
{
  pattern: /new-pattern/,
  rule: 'Description of violation',
  severity: 'error', // or 'warning'
}
```

2. **Test locally**:
```bash
node scripts/validate-design-system.js
```

3. **Update documentation**:
- `CHECKLIST_AUTOMATION.md`
- `AI_WORK_PROCEDURES_CHECKLIST.md`

### Adjust Severity Levels

Edit `.github/workflows/checklist-validation.yml`:
```yaml
- name: Your Check
  run: your-command
  continue-on-error: true  # Warning only
  # continue-on-error: false  # Blocks merge
```

## Monitoring

### Check Validation Success Rate
```bash
# Local commits
git log --oneline | head -20

# GitHub Actions
# Visit: https://github.com/<org>/<repo>/actions
```

### Review Violations
```bash
# Run all checks
npm run test
npm run lint
node scripts/validate-design-system.js
node scripts/validate-security.js

# Generate coverage report
npm run test:coverage
open coverage/index.html
```

## Next Steps

After setup is complete:

1. ✅ Verify Project Knowledge has checklist
2. ✅ Test pre-commit hook with dummy commit
3. ✅ Check GitHub Actions ran successfully
4. ✅ Review any existing violations
5. ✅ Fix violations incrementally
6. ✅ Continue development with confidence

## Support

- **Documentation**: See `CHECKLIST_AUTOMATION.md`
- **Validation Issues**: Check validation script logs
- **GitHub Actions**: Review workflow YAML
- **Testing**: See `TESTING_STRATEGY.md`

---

**Last Updated**: 2025-10-15  
**Status**: ✅ Ready for Production
