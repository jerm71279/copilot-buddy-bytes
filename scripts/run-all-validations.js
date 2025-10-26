#!/usr/bin/env node

/**
 * Master Validation Runner
 * Runs all validation scripts with comprehensive console output
 * 
 * Usage: node scripts/run-all-validations.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TIMESTAMP = new Date().toISOString();

console.log('\n' + '='.repeat(100));
console.log('🚀 COMPREHENSIVE VALIDATION SUITE');
console.log('='.repeat(100));
console.log(`Started at: ${TIMESTAMP}\n`);

const validations = [
  {
    name: 'Code Modularization Analysis',
    script: 'validate-code-modularization.js',
    emoji: '📦',
  },
  {
    name: 'Layout Uniformity Check',
    script: 'validate-layout-uniformity.js',
    emoji: '📐',
  },
  {
    name: 'Comprehensive Validation',
    script: 'validate-all.js',
    emoji: '🔍',
  },
];

const results = [];

validations.forEach((validation, index) => {
  console.log('\n' + '─'.repeat(100));
  console.log(`${validation.emoji} VALIDATION ${index + 1}/${validations.length}: ${validation.name}`);
  console.log('─'.repeat(100) + '\n');
  
  const startTime = Date.now();
  
  try {
    const output = execSync(`node scripts/${validation.script}`, {
      encoding: 'utf8',
      stdio: 'inherit' // Show output in real-time
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    results.push({
      name: validation.name,
      status: 'PASSED',
      duration: `${duration}s`,
    });
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    results.push({
      name: validation.name,
      status: 'FAILED',
      duration: `${duration}s`,
      error: error.message,
    });
  }
});

// Final Summary
console.log('\n' + '='.repeat(100));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(100) + '\n');

const passedCount = results.filter(r => r.status === 'PASSED').length;
const failedCount = results.filter(r => r.status === 'FAILED').length;

console.log(`Total Validations: ${results.length}`);
console.log(`✅ Passed: ${passedCount}`);
console.log(`❌ Failed: ${failedCount}\n`);

console.log('Validation Results:');
results.forEach((result, index) => {
  const statusEmoji = result.status === 'PASSED' ? '✅' : '❌';
  console.log(`  ${index + 1}. ${statusEmoji} ${result.name} (${result.duration})`);
  if (result.error) {
    console.log(`     Error: ${result.error}`);
  }
});

console.log('\n📄 Generated Reports:');
const reports = [
  'validation-modularization-results.json',
  'validation-layout-results.json',
  'MODULARIZATION_RESULTS.md',
  'LAYOUT_UNIFORMITY_RESULTS.md',
];

reports.forEach(report => {
  if (fs.existsSync(report)) {
    const stats = fs.statSync(report);
    const size = (stats.size / 1024).toFixed(2);
    console.log(`  • ${report} (${size} KB)`);
  }
});

console.log('\n' + '='.repeat(100));
console.log(`Completed at: ${new Date().toISOString()}`);
console.log('='.repeat(100) + '\n');

// Exit with appropriate code
if (failedCount > 0) {
  console.log('⚠️  Some validations failed. Review the results above.\n');
  process.exit(1);
} else {
  console.log('✅ All validations passed successfully!\n');
  process.exit(0);
}
