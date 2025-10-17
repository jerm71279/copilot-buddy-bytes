#!/usr/bin/env node

/**
 * MML System Specific Modularization Validator
 * 
 * Validates all three phases of the MESH LLM implementation for:
 * - Code duplication between phases
 * - Shared utility usage
 * - Pattern detection redundancy
 * - Correlation scoring consistency
 */

const fs = require('fs');
const path = require('path');

console.log('🧠 MML SYSTEM MODULARIZATION VALIDATION\n');
console.log('═'.repeat(80));
console.log('\n');

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

// ========================================
// 1. CHECK MML PHASE FILES
// ========================================
console.log('📋 1. MML PHASE IMPLEMENTATION CHECK\n');

const mmlFiles = {
  phase1: 'supabase/functions/department-assistant/index.ts',
  phase3: 'supabase/functions/central-mml-processor/index.ts',
  sharedPattern: 'supabase/functions/_shared/patternDetection.ts',
  sharedCorrelation: 'supabase/functions/_shared/correlationEngine.ts',
  sharedText: 'supabase/functions/_shared/textUtils.ts',
  sharedConfidence: 'supabase/functions/_shared/confidenceScoring.ts'
};

Object.entries(mmlFiles).forEach(([phase, filepath]) => {
  const fullPath = path.join(__dirname, '../', filepath);
  if (fs.existsSync(fullPath)) {
    logResult('✅', 'PHASE', `${phase}: ${filepath} exists`, 'info');
  } else {
    if (phase.startsWith('shared')) {
      logResult('⚠️', 'PHASE', `${phase}: ${filepath} missing - should be created for modularization`, 'warning');
    } else {
      logResult('❌', 'PHASE', `${phase}: ${filepath} MISSING`, 'critical');
    }
  }
});

console.log('\n');

// ========================================
// 2. PATTERN DETECTION REDUNDANCY
// ========================================
console.log('🔍 2. PATTERN DETECTION REDUNDANCY\n');

const patternDetectionSignatures = [
  'extractKeywords',
  'findCorrelations',
  'calculateCorrelation',
  'detectBottleneck',
  'detectOpportunity'
];

const phase1File = path.join(__dirname, '../supabase/functions/department-assistant/index.ts');
const phase3File = path.join(__dirname, '../supabase/functions/central-mml-processor/index.ts');

if (fs.existsSync(phase1File) && fs.existsSync(phase3File)) {
  const phase1Content = fs.readFileSync(phase1File, 'utf-8');
  const phase3Content = fs.readFileSync(phase3File, 'utf-8');
  
  patternDetectionSignatures.forEach(signature => {
    const inPhase1 = phase1Content.includes(signature);
    const inPhase3 = phase3Content.includes(signature);
    
    if (inPhase1 && inPhase3) {
      logResult('❌', 'REDUNDANCY', `"${signature}" found in BOTH Phase 1 and Phase 3 - MUST extract to shared module`, 'critical');
    } else if (inPhase1 || inPhase3) {
      const location = inPhase1 ? 'Phase 1' : 'Phase 3';
      logResult('💡', 'PATTERN', `"${signature}" only in ${location} - consider if it should be shared`, 'suggestion');
    }
  });
}

console.log('\n');

// ========================================
// 3. KEYWORD EXTRACTION DUPLICATION
// ========================================
console.log('📝 3. KEYWORD EXTRACTION ANALYSIS\n');

const stopWordPattern = /stopWords\s*=\s*\[/;
const keywordFunctionPattern = /function\s+extractKeywords|const\s+extractKeywords/;

let stopWordOccurrences = 0;
let keywordFunctionOccurrences = 0;

[phase1File, phase3File].forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf-8');
    const filename = path.basename(path.dirname(file));
    
    if (stopWordPattern.test(content)) {
      stopWordOccurrences++;
      logResult('⚠️', 'KEYWORD', `Stop words list found in ${filename}`, 'warning');
    }
    
    if (keywordFunctionPattern.test(content)) {
      keywordFunctionOccurrences++;
      logResult('⚠️', 'KEYWORD', `extractKeywords() found in ${filename}`, 'warning');
    }
  }
});

if (stopWordOccurrences > 1) {
  logResult('❌', 'REDUNDANCY', `Stop words list duplicated ${stopWordOccurrences} times - MUST extract to textUtils.ts`, 'critical');
} else if (stopWordOccurrences === 0) {
  logResult('✅', 'KEYWORD', 'No stop word duplication found', 'info');
}

if (keywordFunctionOccurrences > 1) {
  logResult('❌', 'REDUNDANCY', `extractKeywords() duplicated ${keywordFunctionOccurrences} times - MUST extract to textUtils.ts`, 'critical');
} else if (keywordFunctionOccurrences === 0) {
  logResult('✅', 'KEYWORD', 'No keyword extraction duplication found', 'info');
}

console.log('\n');

// ========================================
// 4. CONFIDENCE SCORING CONSISTENCY
// ========================================
console.log('🎯 4. CONFIDENCE SCORING ANALYSIS\n');

const confidencePatterns = [
  /confidence_score.*Math\.min/g,
  /confidence.*correlation/g,
  /confidence.*frequency/g
];

const confidenceMethods = new Set();

[phase1File, phase3File].forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf-8');
    const filename = path.basename(path.dirname(file));
    
    confidencePatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        confidenceMethods.add(`Method ${index + 1} in ${filename}`);
        logResult('💡', 'CONFIDENCE', `Confidence calculation method found in ${filename}`, 'suggestion');
      }
    });
  }
});

if (confidenceMethods.size > 1) {
  logResult('⚠️', 'CONSISTENCY', `${confidenceMethods.size} different confidence scoring methods found - should be unified in confidenceScoring.ts`, 'warning');
} else {
  logResult('✅', 'CONFIDENCE', 'Consistent confidence scoring approach', 'info');
}

console.log('\n');

// ========================================
// 5. FUNCTION SIZE CHECK
// ========================================
console.log('📦 5. FUNCTION SIZE ANALYSIS\n');

[phase1File, phase3File].forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n').length;
    const filename = path.basename(path.dirname(file));
    
    if (lines > 500) {
      logResult('❌', 'SIZE', `${filename}/index.ts has ${lines} lines - CRITICAL, should be split into smaller modules`, 'critical');
    } else if (lines > 300) {
      logResult('⚠️', 'SIZE', `${filename}/index.ts has ${lines} lines - consider splitting into smaller functions`, 'warning');
    } else {
      logResult('✅', 'SIZE', `${filename}/index.ts has ${lines} lines - acceptable size`, 'info');
    }
  }
});

console.log('\n');

// ========================================
// 6. SHARED MODULE USAGE CHECK
// ========================================
console.log('🔗 6. SHARED MODULE USAGE\n');

const sharedDir = path.join(__dirname, '../supabase/functions/_shared');
if (fs.existsSync(sharedDir)) {
  const sharedFiles = fs.readdirSync(sharedDir).filter(f => f.endsWith('.ts'));
  
  if (sharedFiles.length > 0) {
    logResult('✅', 'SHARED', `Found ${sharedFiles.length} shared modules`, 'info');
    
    // Check if MML functions import from shared
    [phase1File, phase3File].forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf-8');
        const filename = path.basename(path.dirname(file));
        
        const sharedImports = content.match(/from\s+['"].*\/_shared\//g);
        if (sharedImports) {
          logResult('✅', 'IMPORT', `${filename} uses ${sharedImports.length} shared modules`, 'info');
        } else {
          logResult('⚠️', 'IMPORT', `${filename} doesn't import any shared modules - check if it should`, 'warning');
        }
      }
    });
  } else {
    logResult('⚠️', 'SHARED', 'No shared modules found - MML system likely has duplication', 'warning');
  }
} else {
  logResult('⚠️', 'SHARED', '_shared directory not found - modularization needed', 'warning');
}

console.log('\n');

// ========================================
// 7. CORRELATION ENGINE CHECK
// ========================================
console.log('🔗 7. CORRELATION ENGINE ANALYSIS\n');

if (fs.existsSync(phase3File)) {
  const content = fs.readFileSync(phase3File, 'utf-8');
  
  // Check for hardcoded correlation logic
  const correlationFunctions = [
    'calculateCorrelation',
    'findCorrelations',
    'correlationType',
    'strength'
  ];
  
  const foundPatterns = correlationFunctions.filter(fn => content.includes(fn));
  
  if (foundPatterns.length > 2) {
    logResult('⚠️', 'CORRELATION', `Correlation logic embedded in Phase 3 - should extract to correlationEngine.ts`, 'warning');
  } else {
    logResult('✅', 'CORRELATION', 'Minimal correlation logic in main file', 'info');
  }
}

console.log('\n');

// ========================================
// FINAL REPORT
// ========================================
console.log('═'.repeat(80));
console.log('\n📊 MML MODULARIZATION SUMMARY\n');
console.log('═'.repeat(80));
console.log('\n');

console.log(`🔴 Critical Issues:     ${results.critical.length}`);
console.log(`⚠️  Warnings:           ${results.warnings.length}`);
console.log(`💡 Suggestions:        ${results.suggestions.length}`);
console.log(`✅ Passed Checks:      ${results.passed.length}`);
console.log('\n');

// Calculate modularization score
const totalIssues = results.critical.length + results.warnings.length;
const totalChecks = totalIssues + results.suggestions.length + results.passed.length;
const modularizationScore = totalChecks > 0 ? Math.round((results.passed.length / totalChecks) * 100) : 0;

console.log(`📈 MML Modularization Score: ${modularizationScore}%`);
console.log('\n');

// Priority actions
console.log('🎯 PRIORITY ACTIONS:\n');
console.log('   1. Extract extractKeywords() to _shared/textUtils.ts');
console.log('   2. Create _shared/correlationEngine.ts for Phase 3 logic');
console.log('   3. Unified _shared/confidenceScoring.ts for both phases');
console.log('   4. Extract pattern detection to _shared/patternDetection.ts');
console.log('   5. Split functions over 500 lines into smaller modules');
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

// Export status
if (results.critical.length > 0) {
  console.log('❌ MML SYSTEM HAS CRITICAL REDUNDANCIES - REFACTORING REQUIRED\n');
  console.log('See MML_SYSTEM_MODULARIZATION_ANALYSIS.md for detailed refactoring plan\n');
  process.exit(1);
} else if (results.warnings.length > 5) {
  console.log('⚠️  MULTIPLE WARNINGS - REFACTORING RECOMMENDED\n');
  console.log('See MML_SYSTEM_MODULARIZATION_ANALYSIS.md for optimization steps\n');
  process.exit(0);
} else {
  console.log('✅ MML SYSTEM MODULARIZATION ACCEPTABLE\n');
  process.exit(0);
}
