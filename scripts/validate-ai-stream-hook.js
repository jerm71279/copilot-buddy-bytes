#!/usr/bin/env node

/**
 * AI Stream Hook Validation Script
 * 
 * Validates useAIStream hook and searches for:
 * - Duplicate authentication patterns
 * - Redundant edge function calling code
 * - Inconsistent error handling
 * - Missing modularization opportunities
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

console.log('\n' + '='.repeat(80));
console.log('AI STREAM HOOK & EDGE FUNCTION CALL VALIDATION');
console.log('Generated:', new Date().toISOString());
console.log('='.repeat(80) + '\n');

let totalIssues = 0;
let criticalIssues = 0;
let warnings = 0;
let passed = 0;

function logResult(emoji, category, message, severity = 'info') {
  console.log(`${emoji} [${category}] ${message}`);
  
  if (severity === 'critical') criticalIssues++;
  else if (severity === 'warning') warnings++;
  else if (severity === 'pass') passed++;
}

// Find all TypeScript/TSX files
function getAllFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      getAllFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// 1. CHECK FOR AUTH PATTERN DUPLICATION
console.log('📋 1. AUTHENTICATION PATTERN DUPLICATION CHECK\n');

const authPatterns = [
  { pattern: /supabase\.auth\.getSession\(\)/, description: 'supabase.auth.getSession()' },
  { pattern: /session\.access_token/, description: 'session.access_token' },
  { pattern: /Authorization.*Bearer.*accessToken/, description: 'Authorization: Bearer ${accessToken}' },
  { pattern: /functions\/v1\//, description: 'Direct edge function calls' }
];

const srcFiles = getAllFiles('src');
const authPatternLocations = new Map();

authPatterns.forEach(({ pattern, description }) => {
  authPatternLocations.set(description, []);
});

srcFiles.forEach(file => {
  try {
    const content = readFileSync(file, 'utf-8');
    
    authPatterns.forEach(({ pattern, description }) => {
      if (pattern.test(content)) {
        authPatternLocations.get(description).push(file.replace(process.cwd() + '/', ''));
      }
    });
  } catch (err) {
    // Skip files that can't be read
  }
});

// Report findings
authPatternLocations.forEach((locations, pattern) => {
  if (locations.length > 1) {
    logResult('⚠️', 'AUTH', `Pattern "${pattern}" found in ${locations.length} files`, 'warning');
    locations.forEach(loc => {
      console.log(`     └─ ${loc}`);
    });
    totalIssues++;
  } else if (locations.length === 1) {
    logResult('✅', 'AUTH', `Pattern "${pattern}" used in 1 file only: ${locations[0]}`, 'pass');
  }
});

// 2. CHECK FOR EDGE FUNCTION CALL DUPLICATION
console.log('\n🔌 2. EDGE FUNCTION CALL PATTERN CHECK\n');

const edgeFunctionCallPatterns = [
  { pattern: /fetch\(`\$\{.*SUPABASE_URL\}\/functions\/v1\//, description: 'Direct fetch to functions/v1/' },
  { pattern: /supabase\.functions\.invoke\(/, description: 'supabase.functions.invoke()' }
];

const callPatternLocations = new Map();
edgeFunctionCallPatterns.forEach(({ description }) => {
  callPatternLocations.set(description, []);
});

srcFiles.forEach(file => {
  try {
    const content = readFileSync(file, 'utf-8');
    
    edgeFunctionCallPatterns.forEach(({ pattern, description }) => {
      if (pattern.test(content)) {
        callPatternLocations.get(description).push(file.replace(process.cwd() + '/', ''));
      }
    });
  } catch (err) {
    // Skip
  }
});

callPatternLocations.forEach((locations, pattern) => {
  if (locations.length > 0) {
    console.log(`\n${pattern}: ${locations.length} file(s)`);
    locations.forEach(loc => {
      console.log(`  └─ ${loc}`);
    });
  }
});

// Check if both patterns exist (inconsistency)
const fetchCount = callPatternLocations.get('Direct fetch to functions/v1/').length;
const invokeCount = callPatternLocations.get('supabase.functions.invoke()').length;

if (fetchCount > 0 && invokeCount > 0) {
  logResult('⚠️', 'CONSISTENCY', `Mixed edge function call patterns: ${fetchCount} direct fetch vs ${invokeCount} .invoke()`, 'warning');
  logResult('💡', 'RECOMMENDATION', 'Standardize on supabase.functions.invoke() for better error handling', 'info');
  totalIssues++;
} else if (fetchCount > 0) {
  logResult('⚠️', 'PATTERN', `Using direct fetch (${fetchCount} files) - consider using supabase.functions.invoke()`, 'warning');
  totalIssues++;
} else if (invokeCount > 0) {
  logResult('✅', 'PATTERN', `Using supabase.functions.invoke() consistently (${invokeCount} files)`, 'pass');
}

// 3. CHECK FOR ERROR HANDLING CONSISTENCY
console.log('\n⚠️ 3. ERROR HANDLING CONSISTENCY CHECK\n');

const errorHandlingPatterns = [
  { pattern: /toast\.error/, description: 'Uses toast.error' },
  { pattern: /console\.error/, description: 'Uses console.error' },
  { pattern: /catch\s*\(\s*error\s*\)/, description: 'Has try-catch blocks' }
];

srcFiles
  .filter(f => f.includes('useAIStream') || f.includes('streamResponse'))
  .forEach(file => {
    const content = readFileSync(file, 'utf-8');
    const fileName = file.replace(process.cwd() + '/', '');
    
    errorHandlingPatterns.forEach(({ pattern, description }) => {
      if (pattern.test(content)) {
        logResult('✅', 'ERROR', `${fileName}: ${description}`, 'pass');
      }
    });
  });

// 4. CHECK FOR MODULARIZATION OPPORTUNITIES
console.log('\n🏗️ 4. MODULARIZATION ANALYSIS\n');

// Check if useAIStream exists
const aiStreamExists = srcFiles.some(f => f.includes('useAIStream'));

if (aiStreamExists) {
  logResult('✅', 'MODULE', 'useAIStream hook exists for reusable streaming', 'pass');
  
  // Check how many files use it
  const usageCount = srcFiles.filter(file => {
    const content = readFileSync(file, 'utf-8');
    return content.includes('useAIStream');
  }).length;
  
  if (usageCount > 1) {
    logResult('✅', 'REUSE', `useAIStream hook used in ${usageCount} files - good reusability`, 'pass');
  } else {
    logResult('⚠️', 'REUSE', `useAIStream only used in 1 file - consider using in other AI features`, 'warning');
  }
} else {
  logResult('❌', 'MODULE', 'No reusable streaming hook found - code duplication likely', 'critical');
  totalIssues++;
  criticalIssues++;
}

// 5. CHECK FOR SENSITIVE DATA EXPOSURE
console.log('\n🔒 5. SECURITY CHECK\n');

const securityPatterns = [
  { pattern: /VITE_SUPABASE_ANON_KEY|VITE_SUPABASE_PUBLISHABLE_KEY/, severity: 'safe', msg: 'Uses publishable keys (safe for client)' },
  { pattern: /SUPABASE_SERVICE_ROLE_KEY/, severity: 'critical', msg: 'SERVICE ROLE KEY in client code (CRITICAL)' },
  { pattern: /Bearer.*ANON_KEY/, severity: 'warning', msg: 'Using anon key for authenticated endpoints (should use JWT)' }
];

srcFiles.forEach(file => {
  try {
    const content = readFileSync(file, 'utf-8');
    const fileName = file.replace(process.cwd() + '/', '');
    
    securityPatterns.forEach(({ pattern, severity, msg }) => {
      if (pattern.test(content)) {
        if (severity === 'critical') {
          logResult('❌', 'SECURITY', `${fileName}: ${msg}`, 'critical');
          criticalIssues++;
          totalIssues++;
        } else if (severity === 'warning') {
          logResult('⚠️', 'SECURITY', `${fileName}: ${msg}`, 'warning');
          totalIssues++;
        } else {
          logResult('✅', 'SECURITY', `${fileName}: ${msg}`, 'pass');
        }
      }
    });
  } catch (err) {
    // Skip
  }
});

// 6. CHECK USEAISTREAM IMPLEMENTATION
console.log('\n🔍 6. USEAISTREAM IMPLEMENTATION REVIEW\n');

try {
  const aiStreamPath = srcFiles.find(f => f.includes('useAIStream.ts'));
  if (aiStreamPath) {
    const content = readFileSync(aiStreamPath, 'utf-8');
    
    // Check for proper JWT usage (FIXED)
    if (content.includes('supabase.auth.getSession()') && content.includes('session.access_token')) {
      logResult('✅', 'AUTH', 'Uses user JWT token (FIXED)', 'pass');
    } else if (content.includes('SUPABASE_ANON_KEY') || content.includes('SUPABASE_PUBLISHABLE_KEY')) {
      logResult('❌', 'AUTH', 'Still using anon key instead of user JWT', 'critical');
      criticalIssues++;
      totalIssues++;
    }
    
    // Check for error handling
    if (content.includes('try') && content.includes('catch')) {
      logResult('✅', 'ERROR', 'Has try-catch error handling', 'pass');
    }
    
    // Check for toast notifications
    if (content.includes('toast.error')) {
      logResult('✅', 'UX', 'Shows user-friendly error messages', 'pass');
    }
    
    // Check for streaming implementation
    if (content.includes('reader') && content.includes('decoder') && content.includes('TextDecoder')) {
      logResult('✅', 'STREAM', 'Proper SSE streaming implementation', 'pass');
    }
  }
} catch (err) {
  logResult('❌', 'IMPL', `Failed to validate useAIStream: ${err.message}`, 'critical');
  criticalIssues++;
  totalIssues++;
}

// 7. CHECK FOR SIMILAR HOOKS
console.log('\n🔄 7. SIMILAR HOOKS ANALYSIS\n');

const similarHooks = srcFiles.filter(f => 
  f.includes('hooks/') && 
  (f.includes('AI') || f.includes('stream') || f.includes('chat'))
);

if (similarHooks.length > 0) {
  console.log(`Found ${similarHooks.length} AI/streaming related hooks:\n`);
  similarHooks.forEach(hook => {
    const fileName = hook.replace(process.cwd() + '/', '');
    console.log(`  - ${fileName}`);
  });
  
  if (similarHooks.length > 3) {
    logResult('⚠️', 'CONSOLIDATION', `${similarHooks.length} AI-related hooks - consider consolidating`, 'warning');
    totalIssues++;
  }
}

// 8. RECOMMENDATIONS
console.log('\n💡 8. RECOMMENDATIONS\n');

const recommendations = [
  {
    priority: 'HIGH',
    recommendation: 'Standardize all edge function calls to use supabase.functions.invoke()',
    reason: 'Better error handling, automatic retries, consistent auth'
  },
  {
    priority: 'MEDIUM',
    recommendation: 'Create shared utility for authenticated edge function calls',
    reason: 'Eliminate auth code duplication across hooks'
  },
  {
    priority: 'LOW',
    recommendation: 'Add TypeScript interfaces for all edge function payloads',
    reason: 'Type safety and better IDE autocomplete'
  }
];

recommendations.forEach((rec, i) => {
  console.log(`${i + 1}. [${rec.priority}] ${rec.recommendation}`);
  console.log(`   Reason: ${rec.reason}\n`);
});

// FINAL SUMMARY
console.log('='.repeat(80));
console.log('VALIDATION SUMMARY');
console.log('='.repeat(80));
console.log(`\n✅ Passed: ${passed}`);
console.log(`⚠️  Warnings: ${warnings}`);
console.log(`❌ Critical Issues: ${criticalIssues}`);
console.log(`📊 Total Issues: ${totalIssues}`);

if (criticalIssues === 0 && totalIssues === 0) {
  console.log('\n🎉 EXCELLENT - No redundancies or issues found\n');
  process.exit(0);
} else if (criticalIssues === 0) {
  console.log('\n⚠️  MINOR ISSUES - Hook functional but could be optimized\n');
  process.exit(0);
} else {
  console.log('\n❌ CRITICAL ISSUES - Must fix for reliable operation\n');
  process.exit(1);
}
