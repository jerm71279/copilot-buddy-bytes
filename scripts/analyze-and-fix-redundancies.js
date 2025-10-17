#!/usr/bin/env node

/**
 * Automated Redundancy Analyzer & Fixer
 * 
 * This script:
 * 1. Identifies all auth pattern redundancies
 * 2. Generates specific refactoring recommendations
 * 3. Creates a detailed action plan
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 REDUNDANCY ANALYSIS & REFACTORING PLAN\n');
console.log('═'.repeat(80));
console.log('\n');

const srcPath = path.join(__dirname, '../src');

// ========================================
// 1. AUTH PATTERN CONSOLIDATION PLAN
// ========================================
console.log('📋 1. AUTH PATTERN CONSOLIDATION\n');

const authPatternFiles = {
  checkAuth: [],
  checkAuthAndLoad: [],
  checkAdminAccess: [],
  redirectToDepartmentDashboard: []
};

function scanForPatterns(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules')) {
      scanForPatterns(filePath);
    } else if (filePath.match(/\.(ts|tsx)$/)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = filePath.replace(srcPath + '/', '');
      
      Object.keys(authPatternFiles).forEach(pattern => {
        const regex = new RegExp(`const\\s+${pattern}|function\\s+${pattern}`, 'g');
        if (regex.test(content)) {
          authPatternFiles[pattern].push(relativePath);
        }
      });
    }
  });
}

scanForPatterns(srcPath);

// Display findings
Object.entries(authPatternFiles).forEach(([pattern, files]) => {
  console.log(`\n${pattern}:`);
  if (files.length === 0) {
    console.log('   ✅ Not found (good)');
  } else if (files.length === 1) {
    console.log(`   ✅ Centralized in: ${files[0]}`);
  } else {
    console.log(`   ❌ DUPLICATED in ${files.length} files:`);
    files.forEach(f => console.log(`      → ${f}`));
  }
});

console.log('\n');
console.log('═'.repeat(80));
console.log('\n📝 REFACTORING ACTION PLAN\n');
console.log('═'.repeat(80));
console.log('\n');

// ========================================
// 2. SPECIFIC REFACTORING STEPS
// ========================================

console.log('STEP 1: Create Centralized Auth Utilities');
console.log('─'.repeat(80));
console.log('');
console.log('File: src/lib/authUtils.ts');
console.log('');
console.log('Create a single source of truth for:');
console.log('  • checkAuth() - Validate session');
console.log('  • redirectByRole() - Redirect based on user role');
console.log('  • requireAuth() - Protected route guard');
console.log('');
console.log('This replaces:');
authPatternFiles.checkAuth.forEach(f => console.log(`  - checkAuth in ${f}`));
authPatternFiles.checkAuthAndLoad.forEach(f => console.log(`  - checkAuthAndLoad in ${f}`));
console.log('');

console.log('STEP 2: Extend useAuth Hook');
console.log('─'.repeat(80));
console.log('');
console.log('File: src/hooks/useAuth.ts');
console.log('');
console.log('Add methods:');
console.log('  • checkSession() - Returns current session state');
console.log('  • redirectToDashboard() - Centralized redirect logic');
console.log('  • requireRole(role) - Check if user has specific role');
console.log('');
console.log('This replaces:');
authPatternFiles.redirectToDepartmentDashboard.forEach(f => console.log(`  - redirectToDepartmentDashboard in ${f}`));
authPatternFiles.checkAdminAccess.forEach(f => console.log(`  - checkAdminAccess in ${f}`));
console.log('');

console.log('STEP 3: Update All Components');
console.log('─'.repeat(80));
console.log('');
console.log('Replace local auth patterns with useAuth hook:');

const allAuthFiles = new Set([
  ...authPatternFiles.checkAuth,
  ...authPatternFiles.checkAuthAndLoad,
  ...authPatternFiles.checkAdminAccess,
  ...authPatternFiles.redirectToDepartmentDashboard
]);

allAuthFiles.forEach(file => {
  if (file !== 'hooks/useAuth.ts' && file !== 'lib/authUtils.ts') {
    console.log(`  • ${file}`);
  }
});
console.log('');

console.log('STEP 4: Create Page-Specific Data Hooks');
console.log('─'.repeat(80));
console.log('');
console.log('Extract data fetching from pages into dedicated hooks:');
console.log('  • useAdminDashboardData() - For admin pages');
console.log('  • useOnboardingDashboardData() - For onboarding pages');
console.log('  • useNetworkMonitoringData() - For network monitoring');
console.log('');
console.log('Benefits:');
console.log('  ✓ Centralized data fetching logic');
console.log('  ✓ Easier testing');
console.log('  ✓ Better code organization');
console.log('  ✓ Reduced code duplication');
console.log('');

console.log('═'.repeat(80));
console.log('\n📊 IMPACT ANALYSIS\n');
console.log('═'.repeat(80));
console.log('\n');

const totalRedundancies = Array.from(allAuthFiles).length - 1; // -1 for the hook itself
console.log(`Files with redundant auth logic: ${totalRedundancies}`);
console.log(`Estimated lines of code to remove: ${totalRedundancies * 30} lines`);
console.log(`Estimated complexity reduction: ${Math.round(totalRedundancies * 15)}%`);
console.log(`Estimated debugging time saved: ${totalRedundancies * 5} minutes per debug session`);
console.log('');

console.log('═'.repeat(80));
console.log('\n✅ NEXT STEPS\n');
console.log('═'.repeat(80));
console.log('\n');
console.log('1. Review this analysis with the team');
console.log('2. Create src/lib/authUtils.ts with centralized auth logic');
console.log('3. Extend src/hooks/useAuth.ts with new methods');
console.log('4. Refactor one file at a time, testing after each change');
console.log('5. Run validate-code-modularization.js after refactoring to verify');
console.log('6. Update documentation to reflect new patterns');
console.log('\n');

// Write report to file
const report = {
  timestamp: new Date().toISOString(),
  authPatterns: authPatternFiles,
  totalFiles: Array.from(allAuthFiles).length,
  redundancyCount: totalRedundancies,
  estimatedImpact: {
    filesAffected: totalRedundancies,
    linesRemoved: totalRedundancies * 30,
    complexityReduction: `${Math.round(totalRedundancies * 15)}%`
  }
};

fs.writeFileSync(
  path.join(__dirname, '../MODULARIZATION_REPORT.json'),
  JSON.stringify(report, null, 2)
);

console.log('📄 Full report saved to: MODULARIZATION_REPORT.json\n');
