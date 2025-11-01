# Validation Procedures Documentation

## Overview
This document outlines the validation scripts used to ensure code quality, modularization, and layout uniformity across the platform.

## Scripts

### 1. Code Analysis Script (`scripts/code-analysis.js`)

**Purpose:** Identifies redundancies, validates modularization, and checks code quality.

**What it checks:**
- ✅ Duplicate code blocks (5+ lines)
- ✅ Large files (>300 lines)
- ✅ Complex functions (>50 lines)
- ✅ Modularization patterns
- ✅ Redundant imports
- ✅ Separation of concerns

**How to run:**
```bash
node scripts/code-analysis.js
```

**Output:**
- Console report with all findings
- `CODE_ANALYSIS_REPORT.json` with detailed results

**Scoring:**
- 100/100: Perfect modularization
- 75-99: Good structure with minor issues
- 50-74: Needs improvement
- <50: Critical modularization issues

---

### 2. Layout Validation Script (`scripts/layout-validation.js`)

**Purpose:** Ensures uniform dimensions and layout patterns across all dashboards and portals.

**What it checks:**
- ✅ Page dimensions and max-width consistency
- ✅ Padding and spacing uniformity
- ✅ Layout component usage
- ✅ Responsive breakpoints (sm, md, lg, xl, 2xl)
- ✅ Grid system consistency
- ✅ Hardcoded dimensions (anti-pattern)

**How to run:**
```bash
node scripts/layout-validation.js
```

**Output:**
- Console report with layout analysis for each page
- `LAYOUT_VALIDATION_REPORT.json` with detailed results

**Scoring:**
- 100/100: Perfect uniformity
- 70-99: Good consistency with minor variations
- 50-69: Needs standardization
- <50: Critical uniformity issues

---

### 3. Master Validation Script (`scripts/run-all-validations.js`)

**Purpose:** Runs all validation checks and generates a combined health report.

**How to run:**
```bash
node scripts/run-all-validations.js
```

**Output:**
- Combined console output from all scripts
- `VALIDATION_SUMMARY.json` with overall health score
- Priority actions ranked by severity

**Overall Health Score:**
- 90-100: Excellent
- 70-89: Good
- 50-69: Needs attention
- <50: Requires immediate refactoring

---

## Automated Validation

### Running Scripts

You can run these scripts individually or all together:

```bash
# Run all validations
node scripts/run-all-validations.js

# Run code analysis only
node scripts/code-analysis.js

# Run layout validation only
node scripts/layout-validation.js
```

---

## Understanding the Reports

### Code Analysis Report Structure

```json
{
  "timestamp": "ISO timestamp",
  "redundancies": [
    {
      "type": "frequent_import",
      "import": "ComponentName",
      "source": "./path/to/component",
      "occurrences": 10,
      "recommendation": "Action to take"
    }
  ],
  "duplicateCode": [
    {
      "locations": [
        { "file": "path/to/file.tsx", "line": 42 }
      ],
      "preview": "Code snippet preview..."
    }
  ],
  "largeFiles": [
    {
      "file": "src/pages/LargePage.tsx",
      "lines": 450,
      "recommendation": "Break into smaller modules"
    }
  ],
  "modularization": {
    "score": 75,
    "issues": ["Missing /services directory"],
    "recommendations": ["Create shared utilities"]
  }
}
```

### Layout Validation Report Structure

```json
{
  "timestamp": "ISO timestamp",
  "dashboards": [
    {
      "file": "src/pages/Dashboard.tsx",
      "name": "Dashboard.tsx",
      "usesLayout": true,
      "maxWidth": "7xl",
      "padding": ["p-6", "px-4"],
      "responsiveBreakpoints": ["sm", "md", "lg", "xl"],
      "issues": []
    }
  ],
  "uniformityScore": 85,
  "dimensionIssues": [
    {
      "type": "max-width",
      "message": "Inconsistent values found",
      "recommendation": "Standardize max-width"
    }
  ]
}
```

---

## Common Issues and Solutions

### Code Quality Issues

| Issue | Solution |
|-------|----------|
| Duplicate code blocks | Extract into shared utilities or components |
| Large files (>300 lines) | Break into smaller, focused modules |
| Complex functions (>50 lines) | Refactor into smaller functions |
| Missing directories | Create proper folder structure |
| Redundant imports | Use barrel exports or shared modules |

### Layout Issues

| Issue | Solution |
|-------|----------|
| Inconsistent max-width | Use standardized values from design system |
| Multiple padding values | Use design tokens (p-4, p-6, p-8 only) |
| Missing layout components | Wrap pages in DashboardLayout or similar |
| Hardcoded dimensions | Replace with Tailwind utility classes |
| Missing breakpoints | Add responsive classes (sm:, md:, lg:, xl:) |

---

## Best Practices

### Code Modularization

1. **Separate Concerns:**
   - `/components` - Reusable UI components
   - `/hooks` - Custom React hooks
   - `/services` - Business logic and API calls
   - `/utils` - Helper functions
   - `/_shared` - Shared modules used across features

2. **File Size Limits:**
   - Components: <200 lines
   - Services: <300 lines
   - Functions: <50 lines

3. **DRY Principle:**
   - No duplicate code blocks >5 lines
   - Extract repeated logic into shared utilities

### Layout Uniformity

1. **Standard Dimensions:**
   - Max width: `max-w-7xl` for dashboards
   - Container padding: `p-6` on desktop, `p-4` on mobile
   - Card spacing: `gap-6` or `space-y-6`

2. **Responsive Design:**
   - Always include: `sm:`, `md:`, `lg:`, `xl:` breakpoints
   - Mobile-first approach
   - Test on all screen sizes

3. **Layout Components:**
   - Use `DashboardLayout` for internal pages
   - Use consistent header/sidebar/footer structure
   - Implement proper scrolling behavior

---

## Maintenance Schedule

- **During Development:** Run when making significant changes
- **Before Commits:** Run validation before pushing code
- **Weekly:** Review reports and address priority issues
- **Monthly:** Full audit with team review

---

## Reports Generated

Each validation run generates three reports:

1. **CODE_ANALYSIS_REPORT.json** - Detailed code quality metrics
2. **LAYOUT_VALIDATION_REPORT.json** - Layout uniformity analysis
3. **VALIDATION_SUMMARY.json** - Combined health score and priority actions

---

Last Updated: 2025-01-15
