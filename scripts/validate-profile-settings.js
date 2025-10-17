#!/usr/bin/env node

/**
 * Validation Script for Profile Settings Module
 * Checks code quality, security, and best practices
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPass(message) {
  checks.passed++;
  log(`✓ ${message}`, 'green');
}

function checkFail(message) {
  checks.failed++;
  log(`✗ ${message}`, 'red');
}

function checkWarn(message) {
  checks.warnings++;
  log(`⚠ ${message}`, 'yellow');
}

function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
  } catch (error) {
    checkFail(`Failed to read ${filePath}: ${error.message}`);
    return null;
  }
}

log('\n═══════════════════════════════════════════', 'cyan');
log('  PROFILE SETTINGS MODULE VALIDATION', 'cyan');
log('═══════════════════════════════════════════\n', 'cyan');

// 1. File Structure Check
log('\n1. FILE STRUCTURE', 'blue');
const files = [
  'src/hooks/useProfileSettings.ts',
  'src/components/profile/ProfileInfoDisplay.tsx',
  'src/components/profile/CustomerAssociationForm.tsx',
  'src/pages/ProfileSettings.tsx',
];

files.forEach(file => {
  if (fs.existsSync(path.join(process.cwd(), file))) {
    checkPass(`${file} exists`);
  } else {
    checkFail(`${file} missing`);
  }
});

// 2. TypeScript Validation
log('\n2. TYPESCRIPT COMPLIANCE', 'blue');
const hookContent = readFile('src/hooks/useProfileSettings.ts');
if (hookContent) {
  if (hookContent.includes('interface')) {
    checkPass('Hook has TypeScript interfaces');
  } else {
    checkWarn('Hook should define interfaces for better type safety');
  }
  
  if (hookContent.includes(': any')) {
    checkWarn('Hook contains "any" types - consider more specific types');
  } else {
    checkPass('Hook avoids "any" types');
  }
}

const formContent = readFile('src/components/profile/CustomerAssociationForm.tsx');
if (formContent) {
  if (formContent.includes('interface') && formContent.includes('Props')) {
    checkPass('Form component has proper prop interfaces');
  } else {
    checkFail('Form component missing prop interfaces');
  }
}

// 3. Security Checks
log('\n3. SECURITY VALIDATION', 'blue');
if (hookContent) {
  if (hookContent.includes('.maybeSingle()') || hookContent.includes('.select()')) {
    checkPass('Uses safe database query methods');
  }
  
  if (hookContent.includes('console.error')) {
    checkPass('Has error logging for debugging');
  }
  
  if (!hookContent.includes('auth.uid()')) {
    checkPass('No direct auth.uid() usage (uses profile from context)');
  } else {
    checkWarn('Consider using profile from auth context instead of auth.uid()');
  }
}

// 4. Design System Compliance
log('\n4. DESIGN SYSTEM COMPLIANCE', 'blue');
const pageContent = readFile('src/pages/ProfileSettings.tsx');
if (pageContent) {
  const forbiddenClasses = [
    'text-white', 'text-black', 'bg-white', 'bg-black',
    'text-green-', 'text-red-', 'text-blue-', 'bg-green-', 'bg-red-', 'bg-blue-'
  ];
  
  let hasHardcodedColors = false;
  forbiddenClasses.forEach(cls => {
    if (pageContent.includes(cls)) {
      hasHardcodedColors = true;
      checkFail(`Page uses hardcoded color: ${cls}`);
    }
  });
  
  if (!hasHardcodedColors) {
    checkPass('No hardcoded colors detected');
  }
  
  if (pageContent.includes('@/components/ui/')) {
    checkPass('Uses design system components');
  } else {
    checkFail('Should use design system components');
  }
}

// 5. Component Structure
log('\n5. COMPONENT MODULARIZATION', 'blue');
if (pageContent) {
  const pageLines = pageContent.split('\n').length;
  if (pageLines <= 50) {
    checkPass(`Main page is ${pageLines} lines (well under 50 line target)`);
  } else if (pageLines <= 100) {
    checkWarn(`Main page is ${pageLines} lines (acceptable but could be smaller)`);
  } else {
    checkFail(`Main page is ${pageLines} lines (should be under 100)`);
  }
}

if (hookContent) {
  const hookLines = hookContent.split('\n').length;
  if (hookLines <= 100) {
    checkPass(`Custom hook is ${hookLines} lines (good)`);
  } else {
    checkWarn(`Custom hook is ${hookLines} lines (consider splitting)`);
  }
}

// 6. Error Handling
log('\n6. ERROR HANDLING', 'blue');
if (hookContent) {
  if (hookContent.includes('try') && hookContent.includes('catch')) {
    checkPass('Hook has try-catch error handling');
  } else {
    checkFail('Hook missing try-catch blocks');
  }
  
  if (hookContent.includes('toast.error')) {
    checkPass('User-friendly error messages via toast');
  } else {
    checkFail('Should provide user feedback for errors');
  }
  
  if (hookContent.includes('finally')) {
    checkPass('Uses finally block for cleanup');
  } else {
    checkWarn('Consider using finally blocks for state cleanup');
  }
}

// 7. React Best Practices
log('\n7. REACT BEST PRACTICES', 'blue');
if (hookContent) {
  if (hookContent.includes('useQuery')) {
    checkPass('Uses React Query for data fetching');
  }
  
  if (hookContent.includes('useState')) {
    checkPass('Proper state management with useState');
  }
}

if (formContent) {
  if (formContent.includes('disabled={')) {
    checkPass('Form has disabled state handling');
  } else {
    checkWarn('Form should handle disabled states');
  }
}

// 8. Code Quality
log('\n8. CODE QUALITY', 'blue');
[hookContent, formContent, pageContent].forEach((content, idx) => {
  if (content) {
    const fileNames = ['hook', 'form', 'page'];
    if (!content.includes('// TODO') && !content.includes('// FIXME')) {
      checkPass(`${fileNames[idx]} has no TODO/FIXME comments`);
    } else {
      checkWarn(`${fileNames[idx]} contains TODO/FIXME comments`);
    }
  }
});

// 9. Accessibility
log('\n9. ACCESSIBILITY', 'blue');
if (formContent) {
  if (formContent.includes('<label')) {
    checkPass('Form has label elements');
  } else {
    checkFail('Form missing label elements');
  }
}

// 10. Documentation
log('\n10. DOCUMENTATION', 'blue');
if (fs.existsSync(path.join(process.cwd(), 'PROFILE_SETTINGS_REFACTOR.md'))) {
  checkPass('Refactor documentation exists');
} else {
  checkFail('Missing refactor documentation');
}

// Summary
log('\n═══════════════════════════════════════════', 'cyan');
log('  VALIDATION SUMMARY', 'cyan');
log('═══════════════════════════════════════════\n', 'cyan');

log(`Passed:   ${checks.passed}`, 'green');
log(`Failed:   ${checks.failed}`, 'red');
log(`Warnings: ${checks.warnings}`, 'yellow');

const total = checks.passed + checks.failed + checks.warnings;
const score = ((checks.passed / total) * 100).toFixed(1);

log(`\nScore: ${score}%`, score >= 90 ? 'green' : score >= 70 ? 'yellow' : 'red');

if (checks.failed === 0 && checks.warnings === 0) {
  log('\n🎉 PRODUCTION READY - All checks passed!', 'green');
} else if (checks.failed === 0) {
  log('\n✅ READY WITH WARNINGS - No critical issues', 'yellow');
} else {
  log('\n❌ NEEDS ATTENTION - Critical issues found', 'red');
}

log('\n');

process.exit(checks.failed > 0 ? 1 : 0);
