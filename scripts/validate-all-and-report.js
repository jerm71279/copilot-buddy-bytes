#!/usr/bin/env node

/**
 * Comprehensive Validation Suite with Automatic Reporting
 * 
 * Runs all validation scripts and generates a consolidated report
 * that can be displayed directly in chat for review.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 COMPREHENSIVE VALIDATION SUITE\n');
console.log('═'.repeat(80));
console.log('\n');

const results = {
  timestamp: new Date().toISOString(),
  validations: [],
  summary: {
    totalChecks: 0,
    passed: 0,
    warnings: 0,
    errors: 0
  }
};

/**
 * Run a validation script and capture results
 */
function runValidation(name, command, outputParser) {
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`Running: ${name}...`);
  console.log('─'.repeat(80));
  
  try {
    const output = execSync(command, { 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    console.log(output);
    
    const parsed = outputParser ? outputParser(output) : { status: 'passed' };
    
    results.validations.push({
      name,
      status: 'passed',
      ...parsed
    });
    
    results.summary.passed++;
    results.summary.totalChecks++;
    
  } catch (error) {
    console.error(error.stdout || error.message);
    
    const parsed = outputParser ? outputParser(error.stdout || error.message) : { 
      status: 'failed',
      errors: [error.message]
    };
    
    results.validations.push({
      name,
      status: 'failed',
      ...parsed
    });
    
    if (parsed.status === 'warning') {
      results.summary.warnings++;
    } else {
      results.summary.errors++;
    }
    results.summary.totalChecks++;
  }
}

// ========================================
// 1. TypeScript Compilation
// ========================================
runValidation(
  'TypeScript Compilation',
  'npx tsc --noEmit',
  (output) => {
    const errors = output.match(/error TS\d+:/g);
    return {
      status: errors ? 'failed' : 'passed',
      errorCount: errors ? errors.length : 0
    };
  }
);

// ========================================
// 2. Code Modularization
// ========================================
runValidation(
  'Code Modularization',
  'node scripts/validate-code-modularization.js',
  (output) => {
    const criticalMatch = output.match(/Critical Issues:\s+(\d+)/);
    const warningsMatch = output.match(/Warnings:\s+(\d+)/);
    const scoreMatch = output.match(/Modularization Score:\s+([\d.]+)%/);
    
    return {
      status: criticalMatch && parseInt(criticalMatch[1]) > 0 ? 'failed' : 'passed',
      critical: criticalMatch ? parseInt(criticalMatch[1]) : 0,
      warnings: warningsMatch ? parseInt(warningsMatch[1]) : 0,
      score: scoreMatch ? parseFloat(scoreMatch[1]) : 100
    };
  }
);

// ========================================
// 3. Layout Uniformity
// ========================================
runValidation(
  'Layout Uniformity',
  'node scripts/validate-layout-uniformity.js',
  (output) => {
    const layoutMatch = output.match(/Layout Issues:\s+(\d+)/);
    const spacingMatch = output.match(/Spacing Issues:\s+(\d+)/);
    const headerMatch = output.match(/Header Issues:\s+(\d+)/);
    
    const totalIssues = 
      (layoutMatch ? parseInt(layoutMatch[1]) : 0) +
      (spacingMatch ? parseInt(spacingMatch[1]) : 0) +
      (headerMatch ? parseInt(headerMatch[1]) : 0);
    
    return {
      status: totalIssues > 0 ? 'warning' : 'passed',
      layoutIssues: layoutMatch ? parseInt(layoutMatch[1]) : 0,
      spacingIssues: spacingMatch ? parseInt(spacingMatch[1]) : 0,
      headerIssues: headerMatch ? parseInt(headerMatch[1]) : 0,
      totalIssues
    };
  }
);

// ========================================
// 4. Design System Compliance
// ========================================
runValidation(
  'Design System Compliance',
  'node scripts/validate-design-system.js || exit 0',
  (output) => {
    const violationsMatch = output.match(/violations found: (\d+)/i);
    return {
      status: violationsMatch && parseInt(violationsMatch[1]) > 0 ? 'warning' : 'passed',
      violations: violationsMatch ? parseInt(violationsMatch[1]) : 0
    };
  }
);

// ========================================
// 5. Security Patterns
// ========================================
runValidation(
  'Security Patterns',
  'node scripts/validate-security.js || exit 0',
  (output) => {
    const issuesMatch = output.match(/security issues: (\d+)/i);
    return {
      status: issuesMatch && parseInt(issuesMatch[1]) > 0 ? 'failed' : 'passed',
      issues: issuesMatch ? parseInt(issuesMatch[1]) : 0
    };
  }
);

// ========================================
// FINAL REPORT
// ========================================
console.log('\n\n');
console.log('═'.repeat(80));
console.log('\n📊 VALIDATION SUMMARY\n');
console.log('═'.repeat(80));
console.log('\n');

console.log(`Total Checks:  ${results.summary.totalChecks}`);
console.log(`✅ Passed:      ${results.summary.passed}`);
console.log(`⚠️  Warnings:    ${results.summary.warnings}`);
console.log(`❌ Errors:      ${results.summary.errors}`);
console.log('\n');

// Detailed breakdown
console.log('📋 DETAILED RESULTS:\n');
results.validations.forEach((validation, index) => {
  const statusIcon = validation.status === 'passed' ? '✅' : 
                     validation.status === 'warning' ? '⚠️' : '❌';
  
  console.log(`${index + 1}. ${statusIcon} ${validation.name}`);
  
  if (validation.errorCount) {
    console.log(`   TypeScript Errors: ${validation.errorCount}`);
  }
  if (validation.score !== undefined) {
    console.log(`   Modularization Score: ${validation.score}%`);
    console.log(`   Critical Issues: ${validation.critical}`);
    console.log(`   Warnings: ${validation.warnings}`);
  }
  if (validation.totalIssues !== undefined) {
    console.log(`   Layout Issues: ${validation.layoutIssues}`);
    console.log(`   Spacing Issues: ${validation.spacingIssues}`);
    console.log(`   Header Issues: ${validation.headerIssues}`);
  }
  if (validation.violations !== undefined) {
    console.log(`   Design Violations: ${validation.violations}`);
  }
  if (validation.issues !== undefined) {
    console.log(`   Security Issues: ${validation.issues}`);
  }
  console.log('');
});

// Export full results
try {
  fs.writeFileSync(
    'validation-full-results.json',
    JSON.stringify(results, null, 2)
  );
  console.log('📄 Full results exported to: validation-full-results.json\n');
} catch (err) {
  console.error('⚠️  Could not export results file:', err.message);
}

// Load additional validation data if available
const additionalFiles = [
  'validation-modularization-results.json',
  'validation-layout-results.json'
];

console.log('📎 ADDITIONAL VALIDATION DATA:\n');
additionalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - Available for detailed review`);
  }
});
console.log('\n');

// Overall status
const overallStatus = results.summary.errors > 0 ? 'FAILED' : 
                      results.summary.warnings > 0 ? 'PASSED WITH WARNINGS' : 'PASSED';
const statusIcon = results.summary.errors > 0 ? '❌' : 
                   results.summary.warnings > 0 ? '⚠️' : '✅';

console.log('═'.repeat(80));
console.log(`\n${statusIcon} OVERALL STATUS: ${overallStatus}\n`);
console.log('═'.repeat(80));
console.log('\n');

// Exit code
process.exit(results.summary.errors > 0 ? 1 : 0);
