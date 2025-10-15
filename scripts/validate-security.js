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
    pattern: /await req\.json\(\)(?![\s\S]{0,200}typeof requestData)/,
    rule: 'Missing input validation after req.json()',
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
];

function validateEdgeFunction(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
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
    if (entry.isDirectory()) {
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
  
  edgeFunctions.forEach(validateEdgeFunction);
  
  const criticalViolations = VIOLATIONS.filter(v => v.severity === 'critical');
  const errorViolations = VIOLATIONS.filter(v => v.severity === 'error');
  const warningViolations = VIOLATIONS.filter(v => v.severity === 'warning');
  
  if (VIOLATIONS.length === 0) {
    console.log('✅ All edge functions follow security best practices');
    process.exit(0);
  } else {
    if (criticalViolations.length > 0) {
      console.log(`🚨 Found ${criticalViolations.length} CRITICAL security issues:\n`);
      criticalViolations.forEach(v => {
        console.log(`${v.file}:${v.line}`);
        console.log(`  ${v.rule}`);
        console.log(`  Code: ${v.content}\n`);
      });
    }
    
    if (errorViolations.length > 0) {
      console.log(`❌ Found ${errorViolations.length} security errors:\n`);
      errorViolations.forEach(v => {
        console.log(`${v.file}:${v.line}`);
        console.log(`  ${v.rule}`);
        console.log(`  Code: ${v.content}\n`);
      });
    }
    
    if (warningViolations.length > 0) {
      console.log(`⚠️  Found ${warningViolations.length} security warnings:\n`);
      warningViolations.forEach(v => {
        console.log(`${v.file}:${v.line}`);
        console.log(`  ${v.rule}`);
        console.log(`  Code: ${v.content}\n`);
      });
    }
    
    // Only fail on critical and error violations
    if (criticalViolations.length > 0 || errorViolations.length > 0) {
      process.exit(1);
    }
    
    process.exit(0);
  }
}

main();
