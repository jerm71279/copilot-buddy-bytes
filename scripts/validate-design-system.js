#!/usr/bin/env node

/**
 * Design System Compliance Validator
 * Checks for hardcoded colors and ensures semantic token usage
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VIOLATIONS = [];
const HARDCODED_COLOR_PATTERNS = [
  /className="[^"]*text-(white|black|red-|green-|blue-|yellow-|purple-|pink-|indigo-)/,
  /className="[^"]*bg-(white|black|red-|green-|blue-|yellow-|purple-|pink-|indigo-)/,
  /className="[^"]*border-(white|black|red-|green-|blue-|yellow-|purple-|pink-|indigo-)/,
];

const EXCLUDED_DIRS = ['node_modules', 'dist', 'build', '.git', 'coverage'];
const EXCLUDED_FILES = ['.test.tsx', '.test.ts', '.stories.tsx', 'test-utils.tsx'];

function shouldExclude(filePath) {
  return EXCLUDED_DIRS.some(dir => filePath.includes(dir)) ||
         EXCLUDED_FILES.some(ext => filePath.endsWith(ext));
}

function findTsxFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !EXCLUDED_DIRS.includes(entry.name)) {
      findTsxFiles(fullPath, files);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) && !shouldExclude(fullPath)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function validateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    HARDCODED_COLOR_PATTERNS.forEach(pattern => {
      if (pattern.test(line)) {
        VIOLATIONS.push({
          file: filePath,
          line: index + 1,
          content: line.trim(),
          rule: 'No hardcoded colors - use semantic tokens',
        });
      }
    });
  });
}

function main() {
  console.log('🎨 Validating Design System Compliance...\n');
  
  const srcFiles = findTsxFiles('src');
  
  srcFiles.forEach(validateFile);
  
  if (VIOLATIONS.length === 0) {
    console.log('✅ All files comply with design system guidelines');
    process.exit(0);
  } else {
    console.log(`❌ Found ${VIOLATIONS.length} design system violations:\n`);
    
    VIOLATIONS.forEach(violation => {
      console.log(`${violation.file}:${violation.line}`);
      console.log(`  Rule: ${violation.rule}`);
      console.log(`  Code: ${violation.content}`);
      console.log('');
    });
    
    console.log('Fix these violations by using semantic tokens from index.css and tailwind.config.ts');
    process.exit(1);
  }
}

main();
