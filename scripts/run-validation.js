#!/usr/bin/env node

/**
 * Validation Script Runner
 * Executes comprehensive validation checks and prints results
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 Running Comprehensive Validation...\n');
console.log('=' .repeat(60));

try {
  // Run the validation script
  const result = execSync('node scripts/validate-all.js', {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log(result);
  console.log('=' .repeat(60));
  console.log('\n✅ All validation checks passed!\n');
  process.exit(0);
} catch (error) {
  console.log(error.stdout || '');
  console.log(error.stderr || '');
  console.log('=' .repeat(60));
  console.log('\n❌ Validation failed. Please fix the issues above.\n');
  process.exit(1);
}
