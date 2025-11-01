#!/usr/bin/env node

/**
 * Master Validation Script
 * Runs all validation checks and generates comprehensive report
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 RUNNING ALL VALIDATION SCRIPTS');
console.log('='.repeat(80));
console.log(`Started at: ${new Date().toISOString()}`);
console.log('\n');

// Run Code Analysis
console.log('1️⃣  Running Code Analysis...\n');
try {
  execSync('node scripts/code-analysis.js', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Code Analysis failed:', error.message);
}
console.log('\n');

// Run Layout Validation
console.log('2️⃣  Running Layout Validation...\n');
try {
  execSync('node scripts/layout-validation.js', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Layout Validation failed:', error.message);
}
console.log('\n');

// Generate combined summary
console.log('3️⃣  Generating Combined Report...\n');

const codeReport = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../CODE_ANALYSIS_REPORT.json'), 'utf-8')
);
const layoutReport = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../LAYOUT_VALIDATION_REPORT.json'), 'utf-8')
);

const combinedReport = {
  timestamp: new Date().toISOString(),
  codeAnalysis: {
    modularizationScore: codeReport.modularization.score,
    totalIssues: codeReport.summary.totalIssues,
    criticalIssues: codeReport.summary.criticalIssues
  },
  layoutValidation: {
    uniformityScore: layoutReport.uniformityScore,
    totalPages: layoutReport.dashboards.length + layoutReport.portals.length,
    issueCount: layoutReport.layoutIssues.length + layoutReport.dimensionIssues.length
  },
  overallHealth: 0,
  priorityActions: []
};

// Calculate overall health score
const codeHealth = (codeReport.modularization.score / 100) * 50;
const layoutHealth = (layoutReport.uniformityScore / 100) * 50;
combinedReport.overallHealth = Math.round(codeHealth + layoutHealth);

// Generate priority actions
if (codeReport.modularization.score < 75) {
  combinedReport.priorityActions.push('HIGH: Improve code modularization structure');
}
if (layoutReport.uniformityScore < 70) {
  combinedReport.priorityActions.push('HIGH: Standardize layout dimensions and patterns');
}
if (codeReport.duplicateCode.length > 5) {
  combinedReport.priorityActions.push('MEDIUM: Refactor duplicate code blocks');
}
if (codeReport.largeFiles.length > 10) {
  combinedReport.priorityActions.push('MEDIUM: Break down large files into modules');
}

console.log('📊 COMBINED VALIDATION SUMMARY');
console.log('='.repeat(80));
console.log(`Overall Health Score: ${combinedReport.overallHealth}/100`);
console.log('\n');
console.log('Code Analysis:');
console.log(`  - Modularization: ${combinedReport.codeAnalysis.modularizationScore}/100`);
console.log(`  - Total Issues: ${combinedReport.codeAnalysis.totalIssues}`);
console.log(`  - Critical Issues: ${combinedReport.codeAnalysis.criticalIssues}`);
console.log('\n');
console.log('Layout Validation:');
console.log(`  - Uniformity: ${combinedReport.layoutValidation.uniformityScore}/100`);
console.log(`  - Pages Analyzed: ${combinedReport.layoutValidation.totalPages}`);
console.log(`  - Issues Found: ${combinedReport.layoutValidation.issueCount}`);
console.log('\n');
console.log('🎯 PRIORITY ACTIONS:');
combinedReport.priorityActions.forEach((action, i) => {
  console.log(`  ${i + 1}. ${action}`);
});
console.log('\n');

// Save combined report
const reportPath = path.join(__dirname, '../VALIDATION_SUMMARY.json');
fs.writeFileSync(reportPath, JSON.stringify(combinedReport, null, 2));
console.log(`📄 Combined report saved to: VALIDATION_SUMMARY.json`);
console.log('='.repeat(80));
console.log(`Completed at: ${new Date().toISOString()}`);
