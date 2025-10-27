#!/usr/bin/env node

/**
 * Security Pattern Validator
 * Checks edge functions for security best practices
 */

const fs = require('fs');
const path = require('path');

const VIOLATIONS = [];
const EDGE_FUNCTIONS_DIR = 'supabase/functions';

const SECURITY_PATTERNS = [
  {
    pattern: /\.single\(\)/,
    rule: 'Use .maybeSingle() instead of .single() to handle null gracefully',
    severity: 'error',
  },
  {
    pattern: /await req\.json\(\)(?![\s\S]{0,500}(sanitizeUnicode|detectPromptInjection))/,
    rule: 'Missing input sanitization after req.json() - use sanitizeUnicode and detectPromptInjection',
    severity: 'error',
  },
  {
    pattern: /supabase\.rpc\([^)]+\$\{/,
    rule: 'Potential SQL injection - never use string interpolation in RPC calls',
    severity: 'critical',
  },
  {
    pattern: /process\.env\.[A-Z_]+(?!.*===.*undefined)/,
    rule: 'Missing environment variable validation',
    severity: 'warning',
  },
  {
    pattern: /ai\.gateway\.lovable\.dev.*messages.*user.*content.*\$\{(?!.*sanitizeIndirectContent|.*addInputDelimiters)/,
    rule: 'AI prompt missing sanitization - use sanitizeIndirectContent and addInputDelimiters',
    severity: 'error',
  },
  {
    pattern: /choices\[0\]\.message\.content(?![\s\S]{0,200}filterOutput)/,
    rule: 'AI response missing output filtering - use filterOutput',
    severity: 'error',
  },
  {
    pattern: /tool_calls(?![\s\S]{0,500}validateToolCall)/,
    rule: 'Tool calls missing validation - use validateToolCall',
    severity: 'error',
  },
];

function validateEdgeFunction(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Skip if it imports promptSecurity (assumed to be secured)
  if (content.includes('from \'../_shared/promptSecurity.ts\'')) {
    console.log(`✅ ${filePath} - Uses promptSecurity module`);
    return;
  }
  
  lines.forEach((line, index) => {
    SECURITY_PATTERNS.forEach(({ pattern, rule, severity }) => {
      if (pattern.test(line)) {
        VIOLATIONS.push({
          file: filePath,
          line: index + 1,
          content: line.trim(),
          rule,
          severity,
        });
      }
    });
  });
}

function findEdgeFunctions() {
  const functions = [];
  
  if (!fs.existsSync(EDGE_FUNCTIONS_DIR)) {
    return functions;
  }
  
  const entries = fs.readdirSync(EDGE_FUNCTIONS_DIR, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('_')) {
      const indexPath = path.join(EDGE_FUNCTIONS_DIR, entry.name, 'index.ts');
      if (fs.existsSync(indexPath)) {
        functions.push(indexPath);
      }
    }
  }
  
  return functions;
}

function main() {
  console.log('🔒 Validating Security Patterns in Edge Functions...\n');
  
  const edgeFunctions = findEdgeFunctions();
  
  if (edgeFunctions.length === 0) {
    console.log('ℹ️  No edge functions found');
    process.exit(0);
  }
  
  console.log(`Found ${edgeFunctions.length} edge functions to validate\n`);
  
  edgeFunctions.forEach(validateEdgeFunction);
  
  const criticalViolations = VIOLATIONS.filter(v => v.severity === 'critical');
  const errorViolations = VIOLATIONS.filter(v => v.severity === 'error');
  const warningViolations = VIOLATIONS.filter(v => v.severity === 'warning');
  
  if (VIOLATIONS.length === 0) {
    console.log('\n✅ All edge functions follow security best practices');
    process.exit(0);
  } else {
    if (criticalViolations.length > 0) {
      console.log(`\n🚨 Found ${criticalViolations.length} CRITICAL security issues:\n`);
      criticalViolations.forEach(v => {
        console.log(`${v.file}:${v.line}`);
        console.log(`  ${v.rule}`);
        console.log(`  Code: ${v.content}\n`);
      });
    }
    
    if (errorViolations.length > 0) {
      console.log(`\n❌ Found ${errorViolations.length} security errors:\n`);
      errorViolations.forEach(v => {
        console.log(`${v.file}:${v.line}`);
        console.log(`  ${v.rule}`);
        console.log(`  Code: ${v.content}\n`);
      });
    }
    
    if (warningViolations.length > 0) {
      console.log(`\n⚠️  Found ${warningViolations.length} security warnings:\n`);
      warningViolations.forEach(v => {
        console.log(`${v.file}:${v.line}`);
        console.log(`  ${v.rule}`);
        console.log(`  Code: ${v.content}\n`);
      });
    }
    
    console.log('\n📚 Security Resources:');
    console.log('  - Prompt Security: supabase/functions/_shared/promptSecurity.ts');
    console.log('  - Security Audit: supabase/functions/_shared/securityAudit.ts');
    console.log('  - Best Practices: SECURITY_AUDIT_REPORT.md\n');
    
    // Only fail on critical and error violations
    if (criticalViolations.length > 0 || errorViolations.length > 0) {
      process.exit(1);
    }
    
    process.exit(0);
  }
}

main();

