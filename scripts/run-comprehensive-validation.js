#!/usr/bin/env node

/**
 * Comprehensive Validation Runner
 * 
 * Runs all validation scripts and documents results:
 * 1. validate-all.js - Complete system validation
 * 2. validate-code-modularization.js - Code redundancy checks
 * 3. validate-layout-uniformity.js - Layout consistency checks
 * 
 * Outputs:
 * - Console results with color-coded status
 * - JSON reports for each validation
 * - Consolidated markdown documentation
 * - Timestamp for audit trail
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const results = {
  timestamp: new Date().toISOString(),
  validations: {},
  summary: {
    totalPassed: 0,
    totalWarnings: 0,
    totalErrors: 0,
    totalCritical: 0
  }
};

console.log('🚀 COMPREHENSIVE VALIDATION SUITE\n');
console.log('═'.repeat(80));
console.log(`Started at: ${new Date().toLocaleString()}`);
console.log('═'.repeat(80));
console.log('\n');

// ========================================
// VALIDATION 1: COMPLETE SYSTEM VALIDATION
// ========================================
console.log('📋 VALIDATION 1: COMPLETE SYSTEM CHECK\n');
console.log('Running: node scripts/validate-all.js\n');

try {
  const output = execSync('node scripts/validate-all.js', {
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log(output);
  
  results.validations.systemValidation = {
    status: 'PASSED',
    output: output,
    errors: 0,
    warnings: 0
  };
  results.summary.totalPassed++;
  
} catch (error) {
  console.error(error.stdout || error.message);
  
  const errorOutput = error.stdout || error.message;
  const errorCount = (errorOutput.match(/Total Errors:\s*(\d+)/) || [])[1] || '0';
  const warningCount = (errorOutput.match(/Total Warnings:\s*(\d+)/) || [])[1] || '0';
  
  results.validations.systemValidation = {
    status: 'FAILED',
    output: errorOutput,
    errors: parseInt(errorCount),
    warnings: parseInt(warningCount)
  };
  
  results.summary.totalErrors += parseInt(errorCount);
  results.summary.totalWarnings += parseInt(warningCount);
}

console.log('\n');
console.log('─'.repeat(80));
console.log('\n');

// ========================================
// VALIDATION 2: CODE MODULARIZATION
// ========================================
console.log('📦 VALIDATION 2: CODE MODULARIZATION ANALYSIS\n');
console.log('Running: node scripts/validate-code-modularization.js\n');

try {
  const output = execSync('node scripts/validate-code-modularization.js', {
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log(output);
  
  // Parse modularization score
  const scoreMatch = output.match(/Modularization Score:\s*(\d+\.?\d*)%/);
  const criticalMatch = output.match(/Critical Issues:\s*(\d+)/);
  const warningsMatch = output.match(/Warnings:\s*(\d+)/);
  const suggestionsMatch = output.match(/Suggestions:\s*(\d+)/);
  
  results.validations.modularization = {
    status: criticalMatch && parseInt(criticalMatch[1]) > 0 ? 'CRITICAL' : 'PASSED',
    output: output,
    score: scoreMatch ? parseFloat(scoreMatch[1]) : 0,
    critical: criticalMatch ? parseInt(criticalMatch[1]) : 0,
    warnings: warningsMatch ? parseInt(warningsMatch[1]) : 0,
    suggestions: suggestionsMatch ? parseInt(suggestionsMatch[1]) : 0
  };
  
  results.summary.totalCritical += results.validations.modularization.critical;
  results.summary.totalWarnings += results.validations.modularization.warnings;
  
  if (results.validations.modularization.critical === 0) {
    results.summary.totalPassed++;
  }
  
} catch (error) {
  console.error(error.stdout || error.message);
  
  results.validations.modularization = {
    status: 'ERROR',
    output: error.stdout || error.message,
    error: error.message
  };
  results.summary.totalErrors++;
}

console.log('\n');
console.log('─'.repeat(80));
console.log('\n');

// ========================================
// VALIDATION 3: LAYOUT UNIFORMITY
// ========================================
console.log('🎨 VALIDATION 3: LAYOUT UNIFORMITY ANALYSIS\n');
console.log('Running: node scripts/validate-layout-uniformity.js\n');

try {
  const output = execSync('node scripts/validate-layout-uniformity.js', {
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log(output);
  
  // Parse layout issues
  const layoutMatch = output.match(/Layout Issues:\s*(\d+)/);
  const spacingMatch = output.match(/Spacing Issues:\s*(\d+)/);
  const headerMatch = output.match(/Header Issues:\s*(\d+)/);
  
  results.validations.layoutUniformity = {
    status: 'PASSED',
    output: output,
    layoutIssues: layoutMatch ? parseInt(layoutMatch[1]) : 0,
    spacingIssues: spacingMatch ? parseInt(spacingMatch[1]) : 0,
    headerIssues: headerMatch ? parseInt(headerMatch[1]) : 0
  };
  
  const totalLayoutIssues = 
    results.validations.layoutUniformity.layoutIssues +
    results.validations.layoutUniformity.spacingIssues +
    results.validations.layoutUniformity.headerIssues;
  
  results.summary.totalWarnings += totalLayoutIssues;
  results.summary.totalPassed++;
  
} catch (error) {
  console.error(error.stdout || error.message);
  
  results.validations.layoutUniformity = {
    status: 'ERROR',
    output: error.stdout || error.message,
    error: error.message
  };
  results.summary.totalErrors++;
}

console.log('\n');
console.log('═'.repeat(80));

// ========================================
// FINAL SUMMARY
// ========================================
console.log('\n📊 COMPREHENSIVE VALIDATION SUMMARY\n');
console.log('═'.repeat(80));
console.log('\n');

console.log(`✅ Validations Passed:    ${results.summary.totalPassed}/3`);
console.log(`❗ Critical Issues:       ${results.summary.totalCritical}`);
console.log(`❌ Errors:                ${results.summary.totalErrors}`);
console.log(`⚠️  Warnings:              ${results.summary.totalWarnings}`);
console.log('\n');

// Individual validation status
console.log('📋 VALIDATION STATUS:\n');
console.log(`   1. System Validation:     ${getStatusEmoji(results.validations.systemValidation?.status)}`);
console.log(`   2. Code Modularization:   ${getStatusEmoji(results.validations.modularization?.status)} (Score: ${results.validations.modularization?.score || 0}%)`);
console.log(`   3. Layout Uniformity:     ${getStatusEmoji(results.validations.layoutUniformity?.status)}`);
console.log('\n');

// Overall status
const overallStatus = 
  results.summary.totalCritical > 0 ? 'CRITICAL' :
  results.summary.totalErrors > 0 ? 'FAILED' :
  results.summary.totalWarnings > 5 ? 'WARNING' :
  'PASSED';

console.log('🎯 OVERALL STATUS: ' + getStatusDisplay(overallStatus));
console.log('\n');

// Export comprehensive results
const reportPath = path.join(__dirname, '../VALIDATION_COMPREHENSIVE_REPORT.json');
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`📄 Comprehensive report saved to: ${reportPath}\n`);

// Create markdown documentation
createMarkdownReport(results);

console.log('═'.repeat(80));
console.log(`Completed at: ${new Date().toLocaleString()}`);
console.log('═'.repeat(80));
console.log('\n');

// Exit with appropriate code
if (results.summary.totalCritical > 0) {
  console.log('❌ CRITICAL ISSUES DETECTED - IMMEDIATE ACTION REQUIRED\n');
  process.exit(1);
} else if (results.summary.totalErrors > 0) {
  console.log('⚠️  ERRORS DETECTED - REVIEW REQUIRED\n');
  process.exit(1);
} else {
  console.log('✅ ALL VALIDATIONS PASSED\n');
  process.exit(0);
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function getStatusEmoji(status) {
  switch(status) {
    case 'PASSED': return '✅ PASSED';
    case 'FAILED': return '❌ FAILED';
    case 'CRITICAL': return '🔴 CRITICAL';
    case 'WARNING': return '⚠️  WARNING';
    case 'ERROR': return '❌ ERROR';
    default: return '❓ UNKNOWN';
  }
}

function getStatusDisplay(status) {
  switch(status) {
    case 'PASSED': return '✅ ALL SYSTEMS GO';
    case 'FAILED': return '❌ VALIDATION FAILED';
    case 'CRITICAL': return '🔴 CRITICAL ISSUES DETECTED';
    case 'WARNING': return '⚠️  WARNINGS PRESENT';
    default: return '❓ UNKNOWN STATUS';
  }
}

function createMarkdownReport(results) {
  const mdPath = path.join(__dirname, '../VALIDATION_COMPREHENSIVE_REPORT.md');
  
  const md = `# Comprehensive Validation Report

**Generated:** ${new Date().toLocaleString()}  
**Timestamp:** ${results.timestamp}

## Summary

| Metric | Count |
|--------|-------|
| ✅ Validations Passed | ${results.summary.totalPassed}/3 |
| 🔴 Critical Issues | ${results.summary.totalCritical} |
| ❌ Errors | ${results.summary.totalErrors} |
| ⚠️ Warnings | ${results.summary.totalWarnings} |

## Validation Results

### 1. System Validation
- **Status:** ${results.validations.systemValidation?.status || 'UNKNOWN'}
- **Errors:** ${results.validations.systemValidation?.errors || 0}
- **Warnings:** ${results.validations.systemValidation?.warnings || 0}

### 2. Code Modularization
- **Status:** ${results.validations.modularization?.status || 'UNKNOWN'}
- **Score:** ${results.validations.modularization?.score || 0}%
- **Critical Issues:** ${results.validations.modularization?.critical || 0}
- **Warnings:** ${results.validations.modularization?.warnings || 0}
- **Suggestions:** ${results.validations.modularization?.suggestions || 0}

### 3. Layout Uniformity
- **Status:** ${results.validations.layoutUniformity?.status || 'UNKNOWN'}
- **Layout Issues:** ${results.validations.layoutUniformity?.layoutIssues || 0}
- **Spacing Issues:** ${results.validations.layoutUniformity?.spacingIssues || 0}
- **Header Issues:** ${results.validations.layoutUniformity?.headerIssues || 0}

## Recommendations

${results.summary.totalCritical > 0 ? '🔴 **CRITICAL:** Address all critical issues immediately before proceeding.' : ''}
${results.summary.totalErrors > 0 ? '❌ **ERRORS:** Review and fix all errors to ensure code quality.' : ''}
${results.summary.totalWarnings > 5 ? '⚠️ **WARNINGS:** Consider addressing warnings to improve code maintainability.' : ''}

## Next Steps

1. Review detailed validation outputs in JSON reports
2. Address critical issues first
3. Fix errors systematically
4. Consider refactoring for warnings
5. Re-run validation suite after fixes

---

**Report Files:**
- JSON: \`VALIDATION_COMPREHENSIVE_REPORT.json\`
- Modularization: \`validation-modularization-results.json\`
- Layout: \`validation-layout-results.json\`
`;

  fs.writeFileSync(mdPath, md);
  console.log(`📄 Markdown report saved to: ${mdPath}\n`);
}
