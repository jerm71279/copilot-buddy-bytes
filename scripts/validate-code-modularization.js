#!/usr/bin/env node

/**
 * Comprehensive Code Modularization Validator
 * 
 * Checks for:
 * - Duplicate authentication patterns
 * - Redundant data fetching logic
 * - Unused hooks and components
 * - Code duplication across files
 * - Modularization opportunities
 */

const fs = require('fs');
const path = require('path');

const results = {
  critical: [],
  warnings: [],
  suggestions: [],
  passed: []
};

function logResult(emoji, category, message, severity = 'info') {
  const entry = { emoji, category, message, severity };
  
  if (severity === 'critical') {
    results.critical.push(entry);
  } else if (severity === 'warning') {
    results.warnings.push(entry);
  } else if (severity === 'suggestion') {
    results.suggestions.push(entry);
  } else {
    results.passed.push(entry);
  }
  
  console.log(`${emoji} [${category}] ${message}`);
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!filePath.includes('node_modules') && !filePath.includes('.git')) {
        getAllFiles(filePath, fileList);
      }
    } else if (filePath.match(/\.(ts|tsx)$/)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

console.log('🔍 COMPREHENSIVE CODE MODULARIZATION ANALYSIS\n');
console.log('═'.repeat(80));
console.log('\n');

// ========================================
// 1. DUPLICATE AUTH PATTERNS ANALYSIS
// ========================================
console.log('📋 1. DUPLICATE AUTH PATTERNS\n');

const authPatterns = {
  'checkAuth': [],
  'checkAuthAndLoad': [],
  'checkAdminAccess': [],
  'redirectToDepartmentDashboard': []
};

const srcFiles = getAllFiles(path.join(__dirname, '../src'));

srcFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  
  Object.keys(authPatterns).forEach(pattern => {
    const regex = new RegExp(`const\\s+${pattern}\\s*=|function\\s+${pattern}\\s*\\(`, 'g');
    if (regex.test(content)) {
      authPatterns[pattern].push(file.replace(path.join(__dirname, '../src/'), 'src/'));
    }
  });
});

let authDuplicationFound = false;
Object.entries(authPatterns).forEach(([pattern, files]) => {
  if (files.length > 1) {
    logResult('⚠️', 'AUTH', `Pattern "${pattern}" duplicated in ${files.length} files`, 'warning');
    files.forEach(f => console.log(`   → ${f}`));
    authDuplicationFound = true;
  } else if (files.length === 1) {
    logResult('✅', 'AUTH', `Pattern "${pattern}" properly centralized in 1 file`, 'info');
  }
});

if (!authDuplicationFound) {
  logResult('✅', 'AUTH', 'No duplicate authentication patterns found', 'info');
}

console.log('\n');

// ========================================
// 2. HOOK USAGE ANALYSIS
// ========================================
console.log('🪝 2. HOOK USAGE ANALYSIS\n');

const hookFiles = srcFiles.filter(f => f.includes('/hooks/'));
const hookExports = new Map();
const hookUsages = new Map();

// Find all exported hooks
hookFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const exportMatches = content.matchAll(/export\s+(?:function|const)\s+(\w+)/g);
  
  for (const match of exportMatches) {
    const hookName = match[1];
    if (!hookExports.has(hookName)) {
      hookExports.set(hookName, []);
    }
    hookExports.get(hookName).push(file.replace(path.join(__dirname, '../src/'), 'src/'));
  }
});

// Find hook usages
srcFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  
  hookExports.forEach((exportFiles, hookName) => {
    const usageRegex = new RegExp(`\\b${hookName}\\s*\\(`, 'g');
    if (usageRegex.test(content)) {
      if (!hookUsages.has(hookName)) {
        hookUsages.set(hookName, []);
      }
      hookUsages.get(hookName).push(file.replace(path.join(__dirname, '../src/'), 'src/'));
    }
  });
});

// Check for unused hooks
const unusedHooks = [];
hookExports.forEach((files, hookName) => {
  const usages = hookUsages.get(hookName) || [];
  // Exclude the file where it's defined
  const externalUsages = usages.filter(usage => !files.includes(usage));
  
  if (externalUsages.length === 0 && !hookName.startsWith('use')) {
    // Skip non-hook exports
    return;
  }
  
  if (externalUsages.length === 0) {
    unusedHooks.push({ hookName, definedIn: files[0] });
    logResult('⚠️', 'HOOK', `Hook "${hookName}" defined but never used`, 'warning');
  } else if (externalUsages.length === 1) {
    logResult('💡', 'HOOK', `Hook "${hookName}" used in only 1 file - consider inlining`, 'suggestion');
  } else {
    logResult('✅', 'HOOK', `Hook "${hookName}" properly reused in ${externalUsages.length} files`, 'info');
  }
});

console.log('\n');

// ========================================
// 3. DATA FETCHING REDUNDANCY CHECK
// ========================================
console.log('🗄️ 3. DATA FETCHING REDUNDANCY\n');

const dataFetchingPatterns = {
  'supabase.from': new Map(),
  'supabase.auth.getSession': new Map(),
  'supabase.rpc': new Map()
};

srcFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const relativePath = file.replace(path.join(__dirname, '../src/'), 'src/');
  
  // Track supabase.from() calls
  const fromMatches = content.matchAll(/supabase\.from\(['"`](\w+)['"`]\)/g);
  for (const match of fromMatches) {
    const table = match[1];
    if (!dataFetchingPatterns['supabase.from'].has(table)) {
      dataFetchingPatterns['supabase.from'].set(table, []);
    }
    dataFetchingPatterns['supabase.from'].get(table).push(relativePath);
  }
  
  // Track auth session checks
  if (content.includes('supabase.auth.getSession')) {
    if (!dataFetchingPatterns['supabase.auth.getSession'].has('getSession')) {
      dataFetchingPatterns['supabase.auth.getSession'].set('getSession', []);
    }
    dataFetchingPatterns['supabase.auth.getSession'].get('getSession').push(relativePath);
  }
  
  // Track RPC calls
  const rpcMatches = content.matchAll(/supabase\.rpc\(['"`](\w+)['"`]/g);
  for (const match of rpcMatches) {
    const rpcName = match[1];
    if (!dataFetchingPatterns['supabase.rpc'].has(rpcName)) {
      dataFetchingPatterns['supabase.rpc'].set(rpcName, []);
    }
    dataFetchingPatterns['supabase.rpc'].get(rpcName).push(relativePath);
  }
});

// Check for tables accessed from multiple files (should be in hooks)
dataFetchingPatterns['supabase.from'].forEach((files, table) => {
  const uniqueFiles = [...new Set(files)];
  if (uniqueFiles.length > 3) {
    const isInHook = uniqueFiles.some(f => f.includes('/hooks/'));
    if (!isInHook) {
      logResult('⚠️', 'DATA', `Table "${table}" accessed from ${uniqueFiles.length} files without a dedicated hook`, 'warning');
    } else {
      logResult('✅', 'DATA', `Table "${table}" has dedicated hook (used in ${uniqueFiles.length} files)`, 'info');
    }
  }
});

// Check auth session duplication
const sessionFiles = dataFetchingPatterns['supabase.auth.getSession'].get('getSession') || [];
const uniqueSessionFiles = [...new Set(sessionFiles)];
if (uniqueSessionFiles.length > 5) {
  const hasAuthHook = uniqueSessionFiles.some(f => f === 'src/hooks/useAuth.ts');
  if (hasAuthHook) {
    logResult('💡', 'AUTH', `Auth session checked in ${uniqueSessionFiles.length} files - consider using useAuth hook everywhere`, 'suggestion');
  } else {
    logResult('⚠️', 'AUTH', `Auth session checked in ${uniqueSessionFiles.length} files without centralized hook`, 'warning');
  }
}

console.log('\n');

// ========================================
// 4. COMPONENT COMPLEXITY CHECK
// ========================================
console.log('📦 4. COMPONENT COMPLEXITY\n');

const componentFiles = srcFiles.filter(f => 
  (f.includes('/components/') || f.includes('/pages/')) && 
  f.endsWith('.tsx')
);

const complexComponents = [];

componentFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n').length;
  const useStateCount = (content.match(/useState/g) || []).length;
  const useEffectCount = (content.match(/useEffect/g) || []).length;
  
  if (lines > 500 || useStateCount > 10 || useEffectCount > 5) {
    complexComponents.push({
      file: file.replace(path.join(__dirname, '../src/'), 'src/'),
      lines,
      useState: useStateCount,
      useEffect: useEffectCount
    });
  }
});

if (complexComponents.length > 0) {
  complexComponents.forEach(comp => {
    logResult('💡', 'COMP', `${comp.file} is complex (${comp.lines} lines, ${comp.useState} useState, ${comp.useEffect} useEffect) - consider splitting`, 'suggestion');
  });
} else {
  logResult('✅', 'COMP', 'All components are reasonably sized', 'info');
}

console.log('\n');

// ========================================
// 5. IMPORT ANALYSIS
// ========================================
console.log('📥 5. IMPORT ANALYSIS\n');

const componentImports = new Map();

srcFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const importMatches = content.matchAll(/import\s+.*?from\s+['"](.+?)['"]/g);
  
  for (const match of importMatches) {
    const importPath = match[1];
    if (importPath.startsWith('.') || importPath.startsWith('@/')) {
      if (!componentImports.has(importPath)) {
        componentImports.set(importPath, []);
      }
      componentImports.get(importPath).push(file.replace(path.join(__dirname, '../src/'), 'src/'));
    }
  }
});

// Check for heavily imported files (good - reusable)
let reusableCount = 0;
componentImports.forEach((files, importPath) => {
  if (files.length > 10) {
    reusableCount++;
    logResult('✅', 'IMPORT', `"${importPath}" reused in ${files.length} files - excellent modularization`, 'info');
  }
});

console.log('\n');

// ========================================
// 5. FINAL REPORT
// ========================================
console.log('═'.repeat(80));
console.log('\n📊 CODE MODULARIZATION SUMMARY\n');
console.log('═'.repeat(80));
console.log('\n');

console.log(`❗ Critical Issues:    ${results.critical.length}`);
console.log(`⚠️  Warnings:           ${results.warnings.length}`);
console.log(`💡 Suggestions:        ${results.suggestions.length}`);
console.log(`✅ Passed Checks:      ${results.passed.length}`);
console.log('\n');

// Calculate modularization score
const totalIssues = results.critical.length + results.warnings.length + results.suggestions.length;
const totalChecks = totalIssues + results.passed.length;
const score = totalChecks > 0 ? ((results.passed.length / totalChecks) * 100).toFixed(1) : 100;

console.log(`🎯 Modularization Score: ${score}%`);
console.log('\n');

// Export results to file for documentation
const reportData = {
  timestamp: new Date().toISOString(),
  score: parseFloat(score),
  critical: results.critical.length,
  warnings: results.warnings.length,
  suggestions: results.suggestions.length,
  passed: results.passed.length,
  details: {
    critical: results.critical,
    warnings: results.warnings,
    suggestions: results.suggestions
  }
};

try {
  fs.writeFileSync(
    'validation-modularization-results.json',
    JSON.stringify(reportData, null, 2)
  );
  console.log('📄 Results exported to: validation-modularization-results.json\n');
} catch (err) {
  console.error('⚠️  Could not export results file:', err.message);
}
console.log('\n');

// Detailed findings
if (results.critical.length > 0) {
  console.log('🔴 CRITICAL ISSUES TO FIX:\n');
  results.critical.forEach(r => console.log(`   ${r.emoji} ${r.message}`));
  console.log('\n');
}

if (results.warnings.length > 0) {
  console.log('⚠️  WARNINGS TO ADDRESS:\n');
  results.warnings.forEach(r => console.log(`   ${r.emoji} ${r.message}`));
  console.log('\n');
}

if (results.suggestions.length > 0) {
  console.log('💡 OPTIMIZATION SUGGESTIONS:\n');
  results.suggestions.slice(0, 10).forEach(r => console.log(`   ${r.emoji} ${r.message}`));
  if (results.suggestions.length > 10) {
    console.log(`   ... and ${results.suggestions.length - 10} more suggestions`);
  }
  console.log('\n');
}

// Recommendations
console.log('📋 RECOMMENDED ACTIONS:\n');
console.log('   1. Centralize all auth logic in useAuth hook');
console.log('   2. Create dedicated hooks for frequently accessed tables');
console.log('   3. Split complex components (>500 lines) into smaller ones');
console.log('   4. Remove or utilize unused hooks');
console.log('   5. Extract duplicate logic into shared utilities');
console.log('\n');

// Export status
if (results.critical.length > 0) {
  console.log('❌ CRITICAL ISSUES FOUND - IMMEDIATE ACTION REQUIRED\n');
  process.exit(1);
} else if (results.warnings.length > 5) {
  console.log('⚠️  MULTIPLE WARNINGS - REFACTORING RECOMMENDED\n');
  process.exit(0); // Don't fail build, but flag for review
} else {
  console.log('✅ CODE MODULARIZATION ACCEPTABLE\n');
  process.exit(0);
}
