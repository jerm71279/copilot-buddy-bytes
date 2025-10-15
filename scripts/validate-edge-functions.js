#!/usr/bin/env node

/**
 * Edge Function Input Validation Checker
 * Ensures all edge functions have proper input validation
 */

const fs = require('fs');
const path = require('path');

const VIOLATIONS = [];
const EDGE_FUNCTIONS_DIR = 'supabase/functions';

const REQUIRED_PATTERNS = [
  {
    check: (content) => content.includes('req.json()'),
    requires: [
      /typeof requestData [!=]== ['"]object['"]/,
      /requestData !== null/,
    ],
    rule: 'req.json() must be followed by type and null validation',
  },
  {
    check: (content) => content.includes('Array.isArray'),
    requires: [
      /\.length\s*>\s*\d+/,
    ],
    rule: 'Array validation should include length limits',
  },
];

function validateEdgeFunction(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  REQUIRED_PATTERNS.forEach(({ check, requires, rule }) => {
    if (check(content)) {
      const hasAllRequired = requires.every(pattern => pattern.test(content));
      
      if (!hasAllRequired) {
        VIOLATIONS.push({
          file: filePath,
          rule,
        });
      }
    }
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
  console.log('🛡️  Validating Edge Function Input Validation...\n');
  
  const edgeFunctions = findEdgeFunctions();
  
  if (edgeFunctions.length === 0) {
    console.log('ℹ️  No edge functions found');
    process.exit(0);
  }
  
  edgeFunctions.forEach(validateEdgeFunction);
  
  if (VIOLATIONS.length === 0) {
    console.log('✅ All edge functions have proper input validation');
    process.exit(0);
  } else {
    console.log(`⚠️  Found ${VIOLATIONS.length} validation issues:\n`);
    
    VIOLATIONS.forEach(v => {
      console.log(`${v.file}`);
      console.log(`  ${v.rule}\n`);
    });
    
    // Don't fail build, just warn
    process.exit(0);
  }
}

main();
