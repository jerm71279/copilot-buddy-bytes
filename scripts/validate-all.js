#!/usr/bin/env node

/**
 * Comprehensive validation script that enforces all checks from:
 * - AUTOMATIC_VALIDATION_PROCEDURES.md
 * - AI_WORK_PROCEDURES_CHECKLIST.md
 * 
 * Validates:
 * 1. TypeScript compilation
 * 2. Database query safety (.single() usage)
 * 3. Design system compliance (no hardcoded colors)
 * 4. Security patterns
 * 5. Edge function validation
 * 6. Input validation coverage
 * 7. ESLint rules
 * 8. Documentation updates (RECENT_FIXES_2025_10_15.md, VALIDATION_PROCEDURES.md)
 * 
 * Run this after every code change to ensure compliance.
 */

import { execSync } from 'child_process';
import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';

let errors = [];
let warnings = [];

console.log('🔍 Running comprehensive validation checks...\n');

// ===== 1. TYPESCRIPT COMPILATION =====
console.log('📝 Checking TypeScript compilation...');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✅ TypeScript: No compilation errors\n');
} catch (error) {
  errors.push('TypeScript compilation failed');
  console.error('❌ TypeScript: Compilation errors found\n');
}

// ===== 2. DATABASE QUERY SAFETY =====
console.log('🔍 Checking database query safety (.single() usage)...');
const singleViolations = [];

function scanDirectory(dir, filePattern, searchPattern) {
  const violations = [];
  const files = readdirSync(dir, { recursive: true, withFileTypes: true });
  
  for (const file of files) {
    if (file.isFile() && filePattern.test(file.name)) {
      const fullPath = join(file.path || dir, file.name);
      try {
        const content = readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          if (searchPattern.test(line)) {
            violations.push({
              file: fullPath,
              line: index + 1,
              content: line.trim()
            });
          }
        });
      } catch (err) {
        // Skip unreadable files
      }
    }
  }
  return violations;
}

// Check for .single() in src and supabase/functions
const singlePattern = /\.single\(\)/;
const tsxPattern = /\.(ts|tsx)$/;

const srcViolations = scanDirectory('src', tsxPattern, singlePattern);
const functionViolations = scanDirectory('supabase/functions', /index\.ts$/, singlePattern);

if (srcViolations.length > 0 || functionViolations.length > 0) {
  errors.push('.single() usage found - use .maybeSingle() instead');
  console.error(`❌ Found ${srcViolations.length + functionViolations.length} .single() violations:`);
  [...srcViolations, ...functionViolations].forEach(v => {
    console.error(`   ${v.file}:${v.line} - ${v.content}`);
  });
  console.log();
} else {
  console.log('✅ Database queries: No .single() violations\n');
}

// ===== 3. DESIGN SYSTEM COMPLIANCE =====
console.log('🎨 Checking design system compliance (hardcoded colors)...');
try {
  execSync('node scripts/validate-design-system.js', { stdio: 'pipe' });
  console.log('✅ Design system: No hardcoded color violations\n');
} catch (error) {
  errors.push('Hardcoded color violations found');
  console.error('❌ Design system: Violations found\n');
}

// ===== 4. SECURITY PATTERNS =====
console.log('🔒 Checking security patterns...');
try {
  execSync('node scripts/validate-security.js', { stdio: 'pipe' });
  console.log('✅ Security: All patterns validated\n');
} catch (error) {
  errors.push('Security validation failed');
  console.error('❌ Security: Issues found\n');
}

// ===== 5. EDGE FUNCTION VALIDATION =====
console.log('⚡ Checking edge functions...');
try {
  execSync('node scripts/validate-edge-functions.js', { stdio: 'pipe' });
  console.log('✅ Edge functions: All validated\n');
} catch (error) {
  warnings.push('Edge function validation had issues');
  console.warn('⚠️  Edge functions: Some issues found\n');
}

// ===== 6. INPUT VALIDATION COVERAGE =====
console.log('🛡️  Checking input validation in edge functions...');
const functionDirs = readdirSync('supabase/functions', { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

let missingValidation = [];
for (const funcName of functionDirs) {
  try {
    const indexPath = join('supabase/functions', funcName, 'index.ts');
    const content = readFileSync(indexPath, 'utf8');
    
    // Check if function handles POST/PUT and has validation
    if ((content.includes('POST') || content.includes('PUT')) && 
        content.includes('req.json()')) {
      
      const hasValidation = 
        content.includes('typeof') ||
        content.includes('Array.isArray') ||
        content.includes('.slice(') ||
        content.includes('z.') || // Zod validation
        content.includes('schema');
      
      if (!hasValidation) {
        missingValidation.push(funcName);
      }
    }
  } catch (err) {
    // Skip if file doesn't exist
  }
}

if (missingValidation.length > 0) {
  warnings.push(`${missingValidation.length} edge functions may need input validation`);
  console.warn(`⚠️  Functions possibly missing validation: ${missingValidation.join(', ')}\n`);
} else {
  console.log('✅ Input validation: All edge functions validated\n');
}

// ===== 7. LAYOUT UNIFORMITY =====
console.log('🎨 Running Layout Uniformity Check...');
try {
  execSync('node scripts/validate-layout-uniformity.js', { stdio: 'pipe' });
  console.log('✅ Layout Uniformity: Consistent patterns\n');
} catch (error) {
  warnings.push('Layout uniformity issues found');
  console.warn('⚠️  Layout Uniformity: Some inconsistencies found\n');
}

// ===== 8. ESLINT =====
console.log('🔧 Running ESLint...');
try {
  execSync('npx eslint src --ext .ts,.tsx --max-warnings 0', { stdio: 'pipe' });
  console.log('✅ ESLint: No issues\n');
} catch (error) {
  warnings.push('ESLint warnings found');
  console.warn('⚠️  ESLint: Some warnings found\n');
}

// ===== 9. DOCUMENTATION UPDATES =====
console.log('📚 Checking documentation updates...');
try {
  const recentFixesContent = readFileSync('RECENT_FIXES_2025_10_15.md', 'utf8');
  const validationProceduresContent = readFileSync('VALIDATION_PROCEDURES.md', 'utf8');
  
  // Check if RECENT_FIXES has been updated recently (within last hour)
  const recentFixesMatch = recentFixesContent.match(/\*\*Implementation Date\*\*:\s*(\d{4}-\d{2}-\d{2})/);
  if (recentFixesMatch) {
    const lastUpdateDate = recentFixesMatch[1];
    const today = new Date().toISOString().split('T')[0];
    
    if (lastUpdateDate === today) {
      console.log('✅ Documentation: RECENT_FIXES_2025_10_15.md updated today\n');
    } else {
      warnings.push('RECENT_FIXES_2025_10_15.md may need updating for recent changes');
      console.warn('⚠️  Documentation: RECENT_FIXES_2025_10_15.md not updated today\n');
      console.warn('   → Please document your changes in RECENT_FIXES_2025_10_15.md\n');
    }
  }
  
  // Reminder about validation procedures
  console.log('📝 Reminder: Update VALIDATION_PROCEDURES.md if validation steps changed\n');
  
} catch (error) {
  warnings.push('Could not verify documentation updates');
  console.warn('⚠️  Documentation: Unable to verify updates\n');
}

// ===== SUMMARY =====
console.log('═'.repeat(60));
console.log('📊 VALIDATION SUMMARY');
console.log('═'.repeat(60));

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ ALL CHECKS PASSED - Ready to commit\n');
  
  // Print success summary
  console.log('✨ Validation Results:');
  console.log('   • TypeScript: ✅ Compiled successfully');
  console.log('   • Database Queries: ✅ No .single() violations');
  console.log('   • Design System: ✅ No hardcoded colors');
  console.log('   • Security: ✅ All patterns validated');
  console.log('   • Edge Functions: ✅ All validated');
  console.log('   • Input Validation: ✅ Coverage complete');
  console.log('   • ESLint: ✅ No issues');
  console.log('   • Documentation: ✅ Up to date\n');
  
  process.exit(0);
} else {
  if (errors.length > 0) {
    console.log('\n❌ ERRORS (must fix):');
    errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS (should review):');
    warnings.forEach((warn, i) => console.log(`   ${i + 1}. ${warn}`));
  }
  
  console.log('\n❌ VALIDATION FAILED - Please fix issues before committing');
  console.log('━'.repeat(60));
  console.log('📋 Summary:');
  console.log(`   Total Errors: ${errors.length}`);
  console.log(`   Total Warnings: ${warnings.length}`);
  console.log('━'.repeat(60) + '\n');
  
  process.exit(1);
}
