#!/usr/bin/env node

/**
 * Edge Function Modularization Validator
 * 
 * Checks for:
 * 1. Duplicated authentication patterns
 * 2. Redundant Supabase client creation
 * 3. Missing use of shared utilities
 * 4. Code that should be extracted to _shared folder
 */

const fs = require('fs');
const path = require('path');

const EDGE_FUNCTIONS_DIR = 'supabase/functions';
const SHARED_DIR = 'supabase/functions/_shared';

const results = {
  totalFunctions: 0,
  usingSharedAuth: 0,
  duplicateAuthPatterns: [],
  duplicateClientCreation: [],
  suggestions: [],
  score: 0
};

console.log('🔍 Edge Function Modularization Analysis\n');
console.log('═'.repeat(60));

// 1. Scan all edge functions
function scanEdgeFunctions() {
  const functionDirs = fs.readdirSync(EDGE_FUNCTIONS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== '_shared')
    .map(d => d.name);

  results.totalFunctions = functionDirs.length;
  console.log(`📊 Found ${results.totalFunctions} edge functions\n`);

  for (const funcName of functionDirs) {
    const indexPath = path.join(EDGE_FUNCTIONS_DIR, funcName, 'index.ts');
    
    if (!fs.existsSync(indexPath)) continue;
    
    const content = fs.readFileSync(indexPath, 'utf8');
    
    // Check if using shared auth
    if (content.includes("from '../_shared/supabaseAuth'") || 
        content.includes('from "../_shared/supabaseAuth"')) {
      results.usingSharedAuth++;
    }
    
    // Check for duplicate auth patterns
    const hasManualAuth = 
      content.includes('auth.getUser(') &&
      content.includes('createClient') &&
      !content.includes("from '../_shared/supabaseAuth'");
    
    if (hasManualAuth) {
      results.duplicateAuthPatterns.push({
        function: funcName,
        issue: 'Manual auth implementation instead of using shared/supabaseAuth.ts',
        severity: 'medium'
      });
    }
    
    // Check for multiple createClient calls
    const clientCreationMatches = content.match(/createClient\(/g);
    if (clientCreationMatches && clientCreationMatches.length > 1) {
      // Check if it's the two-client pattern (user + service)
      const hasUserClient = content.includes('supabaseUser') || content.includes('userClient');
      const hasServiceClient = content.includes('supabaseService') || content.includes('serviceClient');
      
      if (hasUserClient && hasServiceClient) {
        results.suggestions.push({
          function: funcName,
          suggestion: 'Consider using shared/supabaseAuth.ts which returns both authenticated context and service client',
          priority: 'low'
        });
      } else {
        results.duplicateClientCreation.push({
          function: funcName,
          count: clientCreationMatches.length,
          severity: 'low'
        });
      }
    }
  }
}

// 2. Calculate modularization score
function calculateScore() {
  const authModularizationScore = (results.usingSharedAuth / results.totalFunctions) * 40;
  const duplicateAuthPenalty = results.duplicateAuthPatterns.length * 5;
  const duplicateClientPenalty = results.duplicateClientCreation.length * 2;
  
  results.score = Math.max(0, Math.min(100, 
    authModularizationScore + 60 - duplicateAuthPenalty - duplicateClientPenalty
  ));
}

// 3. Print results
function printResults() {
  console.log('\n📈 MODULARIZATION METRICS');
  console.log('─'.repeat(60));
  console.log(`Total Edge Functions: ${results.totalFunctions}`);
  console.log(`Using Shared Auth: ${results.usingSharedAuth} (${Math.round((results.usingSharedAuth/results.totalFunctions)*100)}%)`);
  console.log(`Duplicate Auth Patterns: ${results.duplicateAuthPatterns.length}`);
  console.log(`Functions with Multiple Clients: ${results.duplicateClientCreation.length}`);
  
  console.log('\n🎯 MODULARIZATION SCORE: ' + results.score + '/100');
  
  if (results.score >= 90) {
    console.log('✅ EXCELLENT - Well modularized codebase');
  } else if (results.score >= 70) {
    console.log('⚠️  GOOD - Some improvements possible');
  } else if (results.score >= 50) {
    console.log('⚠️  FAIR - Significant refactoring recommended');
  } else {
    console.log('❌ POOR - Major modularization needed');
  }
  
  // Print issues
  if (results.duplicateAuthPatterns.length > 0) {
    console.log('\n🔴 DUPLICATE AUTH PATTERNS (should use shared/supabaseAuth.ts):');
    results.duplicateAuthPatterns.forEach(issue => {
      console.log(`   • ${issue.function}`);
      console.log(`     └─ ${issue.issue}`);
    });
  }
  
  if (results.suggestions.length > 0) {
    console.log('\n💡 OPTIMIZATION SUGGESTIONS:');
    results.suggestions.forEach(sug => {
      console.log(`   • ${sug.function}`);
      console.log(`     └─ ${sug.suggestion}`);
    });
  }
  
  console.log('\n📋 SHARED UTILITIES AVAILABLE:');
  console.log('   • supabaseAuth.ts - Handles user authentication and customer context');
  console.log('   └─ Returns: { supabase, userId, customerId }');
  
  console.log('\n💡 REFACTORING RECOMMENDATIONS:');
  console.log('   1. Use getAuthContext() from shared/supabaseAuth.ts for authentication');
  console.log('   2. Extract common patterns to _shared folder');
  console.log('   3. Avoid duplicating client creation logic');
  console.log('   4. Keep edge functions focused and DRY');
  
  console.log('\n' + '═'.repeat(60));
}

// Run analysis
try {
  scanEdgeFunctions();
  calculateScore();
  printResults();
  
  // Exit with appropriate code
  if (results.score >= 70) {
    process.exit(0);
  } else {
    process.exit(1);
  }
} catch (error) {
  console.error('Error running analysis:', error.message);
  process.exit(1);
}
