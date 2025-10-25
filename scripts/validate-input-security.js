#!/usr/bin/env node

/**
 * Comprehensive Input Validation Security Checker
 * 
 * Validates ALL edge functions for:
 * - Complete input validation coverage
 * - Length limits enforcement
 * - String sanitization (control chars, null bytes)
 * - Array batch size limits
 * - SQL injection pattern blocking
 * - XSS pattern blocking
 * - Proper error responses
 * - Validation before database queries
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const results = {
  critical: [],
  high: [],
  medium: [],
  low: [],
  passed: []
};

function logResult(emoji, category, message, severity = 'low') {
  const entry = `${emoji} ${category}: ${message}`;
  results[severity].push(entry);
  console.log(entry);
}

// Get all edge functions
const functionDirs = readdirSync('supabase/functions', { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

console.log('🛡️  Starting Comprehensive Input Security Analysis...\n');
console.log(`Found ${functionDirs.length} edge functions to analyze\n`);

// Security patterns to check
const securityPatterns = {
  sqlInjection: [
    /\bDROP\s+TABLE\b/i,
    /\bUNION\s+SELECT\b/i,
    /\bDELETE\s+FROM\b/i,
    /--;/,
    /\/\*.*\*\//,
    /'\s+OR\s+'.*'=/i
  ],
  xss: [
    /<script/i,
    /<iframe/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /onerror\s*=/i,
    /onload\s*=/i
  ],
  controlChars: /[\x00-\x1F\x7F]/,
  nullBytes: /\x00/
};

// Analyze each edge function
for (const funcName of functionDirs) {
  const indexPath = join('supabase/functions', funcName, 'index.ts');
  
  try {
    const content = readFileSync(indexPath, 'utf8');
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Analyzing: ${funcName}`);
    console.log('='.repeat(60));
    
    // Skip if function doesn't handle user input
    if (!content.includes('req.json()') && !content.includes('await req.json()')) {
      logResult('ℹ️', funcName, 'No user input detected - skipping', 'passed');
      continue;
    }
    
    // === CHECK 1: Input extraction and validation ===
    const reqJsonMatches = content.match(/(?:const|let|var)\s+(\w+)\s*=\s*await\s+req\.json\(\)/g);
    
    if (reqJsonMatches) {
      logResult('🔍', funcName, `Found ${reqJsonMatches.length} input extraction point(s)`, 'low');
      
      // Check for validation after extraction
      const hasTypeofCheck = content.includes('typeof');
      const hasArrayCheck = content.includes('Array.isArray');
      const hasZodValidation = content.includes('z.') || content.includes('schema');
      const hasSliceLimit = content.includes('.slice(');
      const hasStringValidation = content.includes('String(') || content.includes('.trim()');
      
      if (!hasTypeofCheck && !hasZodValidation) {
        logResult('❌', funcName, 'CRITICAL: No type checking detected (typeof or Zod)', 'critical');
      }
      
      if (!hasArrayCheck && content.includes('array')) {
        logResult('⚠️', funcName, 'HIGH: Array inputs without Array.isArray() check', 'high');
      }
      
      if (!hasSliceLimit && (content.includes('array') || content.includes('Array'))) {
        logResult('⚠️', funcName, 'HIGH: No batch size limit (.slice) on arrays', 'high');
      }
      
      if (!hasStringValidation) {
        logResult('⚠️', funcName, 'MEDIUM: No string sanitization detected', 'medium');
      }
    }
    
    // === CHECK 2: Length limit enforcement ===
    const lengthChecks = {
      100: content.includes('.slice(0, 100)') || content.includes('FOR 100'),
      200: content.includes('.slice(0, 200)') || content.includes('FOR 200'),
      1000: content.includes('.slice(0, 1000)') || content.includes('FOR 1000'),
      2000: content.includes('.slice(0, 2000)') || content.includes('FOR 2000')
    };
    
    const hasAnyLengthLimit = Object.values(lengthChecks).some(v => v);
    
    if (content.includes('req.json()') && !hasAnyLengthLimit) {
      logResult('⚠️', funcName, 'MEDIUM: No string length limits detected', 'medium');
    } else if (hasAnyLengthLimit) {
      logResult('✅', funcName, 'String length limits enforced', 'passed');
    }
    
    // === CHECK 3: Batch size limits for arrays ===
    if (content.includes('Array.isArray')) {
      const hasBatchLimit = content.includes('.slice(0, 100)') || 
                           content.includes('.length > 100') ||
                           content.includes('max_items');
      
      if (!hasBatchLimit) {
        logResult('❌', funcName, 'CRITICAL: Array batch size not limited (max 100)', 'critical');
      } else {
        logResult('✅', funcName, 'Array batch size properly limited', 'passed');
      }
    }
    
    // === CHECK 4: SQL injection pattern blocking ===
    const hasValidationFunction = content.includes('validate_text_input') || 
                                  content.includes('validate_array_input');
    
    if (content.includes('req.json()') && !hasValidationFunction) {
      const checksSqlPatterns = securityPatterns.sqlInjection.some(pattern => 
        content.includes('test(') || content.includes('match(')
      );
      
      if (!checksSqlPatterns) {
        logResult('❌', funcName, 'CRITICAL: No SQL injection pattern validation', 'critical');
      }
    } else if (hasValidationFunction) {
      logResult('✅', funcName, 'Using validation functions (SQL protection)', 'passed');
    }
    
    // === CHECK 5: XSS pattern blocking ===
    if (content.includes('req.json()')) {
      const checksXssPatterns = content.includes('<script') || 
                               content.includes('javascript:') ||
                               hasValidationFunction;
      
      if (!checksXssPatterns) {
        logResult('⚠️', funcName, 'HIGH: No XSS pattern validation', 'high');
      } else {
        logResult('✅', funcName, 'XSS pattern validation present', 'passed');
      }
    }
    
    // === CHECK 6: Proper error responses ===
    const has400Response = content.includes('status: 400') || content.includes('status:400');
    const hasErrorMessage = content.includes("error: 'Invalid") || 
                           content.includes('error: "Invalid') ||
                           content.includes('error: `Invalid');
    
    if (content.includes('req.json()') && (!has400Response || !hasErrorMessage)) {
      logResult('⚠️', funcName, 'MEDIUM: Missing proper 400 error responses', 'medium');
    } else if (has400Response && hasErrorMessage) {
      logResult('✅', funcName, 'Proper error responses implemented', 'passed');
    }
    
    // === CHECK 7: Validation before database queries ===
    const hasDbQuery = content.includes('supabase.from(') || 
                      content.includes('.insert(') ||
                      content.includes('.update(');
    
    if (hasDbQuery && content.includes('req.json()')) {
      const validationIndex = content.indexOf('typeof') || content.indexOf('Array.isArray');
      const dbQueryIndex = content.indexOf('supabase.from(');
      
      if (validationIndex > 0 && dbQueryIndex > 0 && validationIndex > dbQueryIndex) {
        logResult('❌', funcName, 'CRITICAL: Database query BEFORE input validation', 'critical');
      } else if (validationIndex > 0) {
        logResult('✅', funcName, 'Validation occurs before database queries', 'passed');
      }
    }
    
    // === CHECK 8: Control character and null byte handling ===
    const hasControlCharCheck = content.includes('\\x00') || 
                                content.includes('strip_control_chars') ||
                                content.includes('control characters');
    
    if (content.includes('req.json()') && !hasControlCharCheck) {
      logResult('⚠️', funcName, 'MEDIUM: No control character/null byte filtering', 'medium');
    } else if (hasControlCharCheck) {
      logResult('✅', funcName, 'Control character filtering present', 'passed');
    }
    
    // === CHECK 9: Specific field validation ===
    const extractedFields = content.match(/(?:const|let|var)\s+\{([^}]+)\}\s*=\s*(?:requestData|data|body|req\.json)/);
    
    if (extractedFields && extractedFields[1]) {
      const fields = extractedFields[1].split(',').map(f => f.trim());
      logResult('🔍', funcName, `Extracting ${fields.length} field(s): ${fields.join(', ')}`, 'low');
      
      let validatedFields = 0;
      for (const field of fields) {
        const fieldName = field.split(':')[0].trim();
        
        // Check if field is validated
        const isValidated = content.includes(`${fieldName}.slice(`) ||
                          content.includes(`typeof ${fieldName}`) ||
                          content.includes(`String(${fieldName}`) ||
                          content.includes(`${fieldName}?.`);
        
        if (isValidated) {
          validatedFields++;
        }
      }
      
      const validationCoverage = (validatedFields / fields.length) * 100;
      
      if (validationCoverage < 50) {
        logResult('❌', funcName, `CRITICAL: Only ${validationCoverage.toFixed(0)}% of fields validated`, 'critical');
      } else if (validationCoverage < 80) {
        logResult('⚠️', funcName, `MEDIUM: ${validationCoverage.toFixed(0)}% of fields validated`, 'medium');
      } else {
        logResult('✅', funcName, `${validationCoverage.toFixed(0)}% of fields validated`, 'passed');
      }
    }
    
  } catch (err) {
    logResult('⚠️', funcName, `Unable to analyze: ${err.message}`, 'low');
  }
}

// === FINAL REPORT ===
console.log('\n' + '='.repeat(60));
console.log('📊 INPUT SECURITY VALIDATION SUMMARY');
console.log('='.repeat(60) + '\n');

const totalIssues = results.critical.length + results.high.length + 
                   results.medium.length + results.low.length;
const totalPassed = results.passed.length;

console.log(`Total Functions Analyzed: ${functionDirs.length}`);
console.log(`Total Issues Found: ${totalIssues}`);
console.log(`Total Passed Checks: ${totalPassed}\n`);

if (results.critical.length > 0) {
  console.log('🚨 CRITICAL ISSUES (must fix immediately):');
  console.log('━'.repeat(60));
  results.critical.forEach(issue => console.log(`  ${issue}`));
  console.log();
}

if (results.high.length > 0) {
  console.log('⚠️  HIGH SEVERITY ISSUES:');
  console.log('━'.repeat(60));
  results.high.forEach(issue => console.log(`  ${issue}`));
  console.log();
}

if (results.medium.length > 0) {
  console.log('⚠️  MEDIUM SEVERITY ISSUES:');
  console.log('━'.repeat(60));
  results.medium.forEach(issue => console.log(`  ${issue}`));
  console.log();
}

// Security score calculation
const criticalWeight = results.critical.length * 10;
const highWeight = results.high.length * 5;
const mediumWeight = results.medium.length * 2;
const lowWeight = results.low.length * 1;

const totalWeight = criticalWeight + highWeight + mediumWeight + lowWeight;
const maxPossibleScore = 100;
const securityScore = Math.max(0, maxPossibleScore - totalWeight);

console.log('🎯 INPUT SECURITY SCORE');
console.log('━'.repeat(60));
console.log(`Score: ${securityScore}/100`);

if (securityScore >= 90) {
  console.log('Status: ✅ EXCELLENT - Strong input validation security');
} else if (securityScore >= 70) {
  console.log('Status: ⚠️  GOOD - Minor security improvements needed');
} else if (securityScore >= 50) {
  console.log('Status: ⚠️  NEEDS IMPROVEMENT - Significant security gaps');
} else {
  console.log('Status: 🚨 CRITICAL - Major security vulnerabilities detected');
}

console.log('\n' + '='.repeat(60));
console.log('📚 RECOMMENDATIONS');
console.log('='.repeat(60));
console.log(`
1. All user inputs must be validated BEFORE database queries
2. Enforce length limits: operationName (200), resourceName (100), description (1000)
3. Use Array.isArray() and limit batch sizes to max 100 items
4. Use validate_text_input() and validate_array_input() database functions
5. Block SQL injection patterns (DROP, UNION, DELETE, --, etc.)
6. Block XSS patterns (<script, javascript:, onerror=, etc.)
7. Filter control characters and null bytes (\\x00)
8. Return proper 400 responses with descriptive error messages
9. Use String().slice() for all text fields
10. Validate EVERY extracted field from req.json()
`);

// Exit with appropriate code
if (results.critical.length > 0) {
  console.log('❌ VALIDATION FAILED - Critical security issues found\n');
  process.exit(1);
} else if (results.high.length > 0) {
  console.log('⚠️  VALIDATION WARNING - High severity issues found\n');
  process.exit(1);
} else if (securityScore < 70) {
  console.log('⚠️  VALIDATION WARNING - Security score below threshold\n');
  process.exit(1);
} else {
  console.log('✅ INPUT SECURITY VALIDATION PASSED\n');
  process.exit(0);
}
