#!/usr/bin/env node

/**
 * Code Analysis Script
 * Checks for redundancies, modularization, and code quality
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const results = {
  timestamp: new Date().toISOString(),
  redundancies: [],
  modularization: {
    score: 0,
    issues: [],
    recommendations: []
  },
  duplicateCode: [],
  largeFiles: [],
  complexFunctions: [],
  summary: {}
};

// Helper: Read all files recursively
function readFilesRecursively(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      readFilesRecursively(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Check for duplicate code patterns
function checkDuplicateCode(files) {
  const codeBlocks = {};
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    // Check for duplicate blocks of 5+ lines
    for (let i = 0; i < lines.length - 5; i++) {
      const block = lines.slice(i, i + 5).join('\n').trim();
      if (block.length > 100) {
        if (!codeBlocks[block]) {
          codeBlocks[block] = [];
        }
        codeBlocks[block].push({ file, line: i + 1 });
      }
    }
  });
  
  Object.entries(codeBlocks).forEach(([block, locations]) => {
    if (locations.length > 1) {
      results.duplicateCode.push({
        locations,
        preview: block.substring(0, 100) + '...'
      });
    }
  });
}

// Check for large files
function checkLargeFiles(files) {
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n').length;
    
    if (lines > 300) {
      results.largeFiles.push({
        file: file.replace(srcDir, 'src'),
        lines,
        recommendation: 'Consider breaking into smaller modules'
      });
    }
  });
}

// Check for complex functions
function checkComplexFunctions(files) {
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const functionRegex = /(?:function|const)\s+(\w+)\s*=?\s*(?:\([^)]*\))?\s*(?:=>)?\s*{/g;
    let match;
    
    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[1];
      const startIndex = match.index;
      
      // Find matching closing brace
      let braceCount = 1;
      let endIndex = startIndex + match[0].length;
      
      while (braceCount > 0 && endIndex < content.length) {
        if (content[endIndex] === '{') braceCount++;
        if (content[endIndex] === '}') braceCount--;
        endIndex++;
      }
      
      const functionBody = content.substring(startIndex, endIndex);
      const functionLines = functionBody.split('\n').length;
      
      if (functionLines > 50) {
        results.complexFunctions.push({
          file: file.replace(srcDir, 'src'),
          function: functionName,
          lines: functionLines,
          recommendation: 'Consider breaking into smaller functions'
        });
      }
    }
  });
}

// Check modularization patterns
function checkModularization(files) {
  let score = 0;
  const issues = [];
  
  // Check for proper separation of concerns
  const hasComponents = files.some(f => f.includes('/components/'));
  const hasHooks = files.some(f => f.includes('/hooks/'));
  const hasServices = files.some(f => f.includes('/services/'));
  const hasUtils = files.some(f => f.includes('/utils/'));
  
  if (hasComponents) score += 25;
  else issues.push('Missing /components directory structure');
  
  if (hasHooks) score += 25;
  else issues.push('Missing /hooks directory for custom hooks');
  
  if (hasServices) score += 25;
  else issues.push('Missing /services directory for business logic');
  
  if (hasUtils) score += 25;
  else issues.push('Missing /utils directory for helper functions');
  
  // Check for shared modules
  const sharedFiles = files.filter(f => f.includes('/_shared/') || f.includes('/shared/'));
  if (sharedFiles.length > 0) {
    results.modularization.recommendations.push(`Found ${sharedFiles.length} shared modules - good practice`);
  } else {
    issues.push('No shared modules detected - consider creating shared utilities');
  }
  
  results.modularization.score = score;
  results.modularization.issues = issues;
}

// Check for redundant imports
function checkRedundantImports(files) {
  const importPatterns = {};
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const importRegex = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const imports = match[1].split(',').map(i => i.trim());
      const source = match[2];
      
      imports.forEach(imp => {
        const key = `${imp}::${source}`;
        if (!importPatterns[key]) {
          importPatterns[key] = [];
        }
        importPatterns[key].push(file);
      });
    }
  });
  
  // Check for frequently used imports that could be in a barrel export
  Object.entries(importPatterns).forEach(([key, files]) => {
    if (files.length > 5) {
      const [importName, source] = key.split('::');
      results.redundancies.push({
        type: 'frequent_import',
        import: importName,
        source,
        occurrences: files.length,
        recommendation: 'Consider creating a barrel export or shared module'
      });
    }
  });
}

// Generate summary
function generateSummary(files) {
  results.summary = {
    totalFiles: files.length,
    totalIssues: results.duplicateCode.length + results.largeFiles.length + 
                 results.complexFunctions.length + results.redundancies.length,
    modularizationScore: `${results.modularization.score}/100`,
    criticalIssues: results.largeFiles.length + results.complexFunctions.length,
    recommendations: []
  };
  
  if (results.duplicateCode.length > 0) {
    results.summary.recommendations.push('Refactor duplicate code into shared utilities');
  }
  
  if (results.largeFiles.length > 0) {
    results.summary.recommendations.push('Break large files into smaller, focused modules');
  }
  
  if (results.complexFunctions.length > 0) {
    results.summary.recommendations.push('Simplify complex functions for better maintainability');
  }
  
  if (results.modularization.score < 75) {
    results.summary.recommendations.push('Improve project structure with proper separation of concerns');
  }
}

// Main execution
console.log('🔍 Running Code Analysis...\n');

const files = readFilesRecursively(srcDir);
console.log(`Found ${files.length} files to analyze\n`);

checkDuplicateCode(files);
checkLargeFiles(files);
checkComplexFunctions(files);
checkModularization(files);
checkRedundantImports(files);
generateSummary(files);

// Print results
console.log('📊 CODE ANALYSIS RESULTS');
console.log('='.repeat(80));
console.log(`Timestamp: ${results.timestamp}`);
console.log(`Total Files: ${results.summary.totalFiles}`);
console.log(`Modularization Score: ${results.summary.modularizationScore}`);
console.log(`Total Issues: ${results.summary.totalIssues}`);
console.log('\n');

if (results.duplicateCode.length > 0) {
  console.log('🔄 DUPLICATE CODE BLOCKS:');
  results.duplicateCode.slice(0, 5).forEach((dup, i) => {
    console.log(`  ${i + 1}. Found in ${dup.locations.length} locations:`);
    dup.locations.forEach(loc => {
      console.log(`     - ${loc.file.replace(srcDir, 'src')}:${loc.line}`);
    });
  });
  console.log('\n');
}

if (results.largeFiles.length > 0) {
  console.log('📏 LARGE FILES (>300 lines):');
  results.largeFiles.slice(0, 10).forEach((file, i) => {
    console.log(`  ${i + 1}. ${file.file} - ${file.lines} lines`);
  });
  console.log('\n');
}

if (results.complexFunctions.length > 0) {
  console.log('🔧 COMPLEX FUNCTIONS (>50 lines):');
  results.complexFunctions.slice(0, 10).forEach((func, i) => {
    console.log(`  ${i + 1}. ${func.function} in ${func.file} - ${func.lines} lines`);
  });
  console.log('\n');
}

if (results.modularization.issues.length > 0) {
  console.log('📦 MODULARIZATION ISSUES:');
  results.modularization.issues.forEach((issue, i) => {
    console.log(`  ${i + 1}. ${issue}`);
  });
  console.log('\n');
}

if (results.redundancies.length > 0) {
  console.log('♻️  REDUNDANCIES:');
  results.redundancies.slice(0, 10).forEach((red, i) => {
    console.log(`  ${i + 1}. ${red.type}: ${red.import || red.pattern}`);
    console.log(`     Occurrences: ${red.occurrences}`);
  });
  console.log('\n');
}

console.log('💡 RECOMMENDATIONS:');
results.summary.recommendations.forEach((rec, i) => {
  console.log(`  ${i + 1}. ${rec}`);
});
console.log('\n');

// Save detailed report
const reportPath = path.join(__dirname, '../CODE_ANALYSIS_REPORT.json');
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`📄 Detailed report saved to: CODE_ANALYSIS_REPORT.json`);
console.log('='.repeat(80));
