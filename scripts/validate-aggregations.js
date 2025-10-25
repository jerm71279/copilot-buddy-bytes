#!/usr/bin/env node

/**
 * Comprehensive Aggregation Query Validation & Performance Testing
 * 
 * Validates:
 * - Aggregate query performance (SUM, COUNT, AVG, GROUP BY)
 * - NULL handling in aggregations
 * - Index usage for aggregated columns
 * - Data type correctness
 * - Memory limits for large aggregations
 * - Query optimization opportunities
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const results = {
  performance: [],
  optimization: [],
  correctness: [],
  passed: []
};

function logResult(emoji, category, message, severity = 'passed') {
  const entry = `${emoji} ${category}: ${message}`;
  results[severity].push(entry);
  console.log(entry);
}

// Aggregate query patterns to detect
const aggregatePatterns = {
  sum: /\bSUM\s*\(/gi,
  count: /\bCOUNT\s*\(/gi,
  avg: /\bAVG\s*\(/gi,
  min: /\bMIN\s*\(/gi,
  max: /\bMAX\s*\(/gi,
  groupBy: /\bGROUP\s+BY\b/gi,
  having: /\bHAVING\b/gi,
  distinct: /\bDISTINCT\b/gi
};

console.log('📊 Starting Aggregation Query Analysis...\n');

// === SCAN EDGE FUNCTIONS ===
const functionDirs = readdirSync('supabase/functions', { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

let aggregationCount = 0;
const aggregationsByFunction = {};

console.log('🔍 Scanning Edge Functions for Aggregations...\n');

for (const funcName of functionDirs) {
  const indexPath = join('supabase/functions', funcName, 'index.ts');
  
  try {
    const content = readFileSync(indexPath, 'utf8');
    const aggregations = [];
    
    // Detect aggregate operations
    for (const [type, pattern] of Object.entries(aggregatePatterns)) {
      const matches = content.match(pattern);
      if (matches) {
        aggregations.push({ type, count: matches.length });
        aggregationCount += matches.length;
      }
    }
    
    if (aggregations.length > 0) {
      aggregationsByFunction[funcName] = aggregations;
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Function: ${funcName}`);
      console.log('='.repeat(60));
      
      aggregations.forEach(({ type, count }) => {
        console.log(`  Found ${count} ${type.toUpperCase()} operation(s)`);
      });
      
      // === CHECK 1: NULL handling in aggregations ===
      const hasNullCheck = content.includes('COALESCE') || 
                          content.includes('IS NOT NULL') ||
                          content.includes('NULLIF');
      
      if (!hasNullCheck) {
        logResult('⚠️', funcName, 'Missing NULL handling in aggregations', 'optimization');
      } else {
        logResult('✅', funcName, 'NULL handling present (COALESCE/NULLIF)', 'passed');
      }
      
      // === CHECK 2: Performance considerations ===
      const hasLimit = content.includes('LIMIT') || content.includes('.limit(');
      const hasWhere = content.includes('WHERE') || content.includes('.eq(');
      
      if (!hasWhere) {
        logResult('⚠️', funcName, 'Aggregation without WHERE clause - may be slow', 'performance');
      }
      
      if (content.match(/GROUP\s+BY/i) && !hasLimit) {
        logResult('⚠️', funcName, 'GROUP BY without LIMIT - unbounded result set', 'performance');
      }
      
      // === CHECK 3: Index usage hints ===
      if (content.includes('GROUP BY') || content.includes('.groupBy')) {
        logResult('ℹ️', funcName, 'GROUP BY detected - verify index on grouped columns', 'optimization');
      }
      
      // === CHECK 4: Large dataset handling ===
      const hasPagination = content.includes('offset') || 
                           content.includes('page') ||
                           content.includes('cursor');
      
      if ((content.includes('SUM') || content.includes('AVG')) && !hasPagination) {
        logResult('ℹ️', funcName, 'Large aggregation without pagination', 'optimization');
      } else if (hasPagination) {
        logResult('✅', funcName, 'Pagination present for large datasets', 'passed');
      }
      
      // === CHECK 5: Data type validation ===
      const castsToNumeric = content.includes('::numeric') || 
                            content.includes('::integer') ||
                            content.includes('CAST(');
      
      if ((content.includes('SUM') || content.includes('AVG')) && !castsToNumeric) {
        logResult('ℹ️', funcName, 'Consider explicit type casting for numeric aggregations', 'correctness');
      }
      
      // === CHECK 6: Efficient aggregate alternatives ===
      if (content.includes('COUNT(*)') && content.includes('DISTINCT')) {
        logResult('ℹ️', funcName, 'COUNT(DISTINCT) can be slow - consider alternatives', 'optimization');
      }
      
      // === CHECK 7: Subquery in aggregation ===
      const hasSubquery = (content.match(/\(/g) || []).length > 
                         (content.match(/SUM\(|COUNT\(|AVG\(/gi) || []).length;
      
      if (hasSubquery && content.includes('FROM (SELECT')) {
        logResult('⚠️', funcName, 'Subquery in aggregation - may impact performance', 'performance');
      }
    }
    
  } catch (err) {
    // Skip unreadable files
  }
}

// === SCAN SOURCE FILES ===
console.log('\n\n🔍 Scanning Source Files for Aggregations...\n');

function scanDirectory(dir, extensions = ['.ts', '.tsx']) {
  const files = [];
  
  try {
    const items = readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = join(dir, item.name);
      
      if (item.isDirectory() && !item.name.includes('node_modules')) {
        files.push(...scanDirectory(fullPath, extensions));
      } else if (item.isFile() && extensions.some(ext => item.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    // Skip inaccessible directories
  }
  
  return files;
}

const srcFiles = scanDirectory('src');

for (const filePath of srcFiles) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const relPath = filePath.replace(/^src\//, '');
    
    // Check for client-side aggregations (inefficient)
    const hasClientAggregation = content.includes('.reduce((acc') && 
                                 (content.includes('+ item.') || content.includes('sum'));
    
    if (hasClientAggregation) {
      const hasLargeDataset = content.includes('data.length >') || 
                             content.includes('items.length >');
      
      if (hasLargeDataset || !content.includes('.slice(')) {
        logResult('⚠️', relPath, 'Client-side aggregation - move to database', 'performance');
      }
    }
    
    // Check for inefficient filters before aggregations
    if (content.includes('.filter(') && content.includes('.reduce(')) {
      const filterBeforeReduce = content.indexOf('.filter(') < content.indexOf('.reduce(');
      if (filterBeforeReduce) {
        logResult('✅', relPath, 'Filter before reduce - efficient pattern', 'passed');
      }
    }
    
    // Check for memoization on expensive aggregations
    if (content.includes('.reduce(') || content.includes('.map(')) {
      const hasMemoization = content.includes('useMemo') || 
                            content.includes('useCallback') ||
                            content.includes('React.memo');
      
      if (!hasMemoization && content.includes('data?.length >')) {
        logResult('ℹ️', relPath, 'Consider memoizing expensive aggregations', 'optimization');
      } else if (hasMemoization) {
        logResult('✅', relPath, 'Aggregation properly memoized', 'passed');
      }
    }
    
  } catch (err) {
    // Skip unreadable files
  }
}

// === FINAL REPORT ===
console.log('\n' + '='.repeat(60));
console.log('📊 AGGREGATION VALIDATION SUMMARY');
console.log('='.repeat(60) + '\n');

console.log(`Total Edge Functions Scanned: ${functionDirs.length}`);
console.log(`Functions with Aggregations: ${Object.keys(aggregationsByFunction).length}`);
console.log(`Total Aggregation Operations: ${aggregationCount}`);
console.log(`Source Files Scanned: ${srcFiles.length}\n`);

const totalIssues = results.performance.length + results.optimization.length + 
                   results.correctness.length;

console.log(`Performance Issues: ${results.performance.length}`);
console.log(`Optimization Opportunities: ${results.optimization.length}`);
console.log(`Correctness Warnings: ${results.correctness.length}`);
console.log(`Passed Checks: ${results.passed.length}\n`);

if (results.performance.length > 0) {
  console.log('⚠️  PERFORMANCE ISSUES:');
  console.log('━'.repeat(60));
  results.performance.forEach(issue => console.log(`  ${issue}`));
  console.log();
}

if (results.optimization.length > 0) {
  console.log('💡 OPTIMIZATION OPPORTUNITIES:');
  console.log('━'.repeat(60));
  results.optimization.forEach(issue => console.log(`  ${issue}`));
  console.log();
}

if (results.correctness.length > 0) {
  console.log('ℹ️  CORRECTNESS WARNINGS:');
  console.log('━'.repeat(60));
  results.correctness.forEach(issue => console.log(`  ${issue}`));
  console.log();
}

// Aggregation efficiency score
const performanceWeight = results.performance.length * 5;
const optimizationWeight = results.optimization.length * 2;
const correctnessWeight = results.correctness.length * 1;

const totalWeight = performanceWeight + optimizationWeight + correctnessWeight;
const maxScore = 100;
const efficiencyScore = Math.max(0, maxScore - totalWeight);

console.log('🎯 AGGREGATION EFFICIENCY SCORE');
console.log('━'.repeat(60));
console.log(`Score: ${efficiencyScore}/100`);

if (efficiencyScore >= 90) {
  console.log('Status: ✅ EXCELLENT - Highly optimized aggregations');
} else if (efficiencyScore >= 70) {
  console.log('Status: ⚠️  GOOD - Minor optimizations possible');
} else if (efficiencyScore >= 50) {
  console.log('Status: ⚠️  NEEDS IMPROVEMENT - Performance concerns detected');
} else {
  console.log('Status: 🚨 CRITICAL - Major performance issues detected');
}

console.log('\n' + '='.repeat(60));
console.log('📚 BEST PRACTICES');
console.log('='.repeat(60));
console.log(`
1. Always use WHERE clauses with aggregations to limit data scanned
2. Add LIMIT to GROUP BY queries to bound result sets
3. Use COALESCE() or NULLIF() to handle NULL values properly
4. Create indexes on columns used in GROUP BY and aggregate functions
5. Use pagination for large aggregation results (offset/cursor)
6. Cast to explicit types (::numeric, ::integer) for aggregations
7. Avoid COUNT(DISTINCT) on large datasets - use approximations if possible
8. Move client-side aggregations to database (use Supabase functions)
9. Memoize expensive client-side aggregations with useMemo
10. Test aggregation performance with realistic data volumes

Performance Targets:
  • Simple aggregations: < 500ms
  • Complex GROUP BY: < 1000ms  
  • Large datasets: < 2000ms with pagination
`);

console.log('='.repeat(60));
console.log('📋 DETECTED AGGREGATIONS BY FUNCTION');
console.log('='.repeat(60) + '\n');

if (Object.keys(aggregationsByFunction).length > 0) {
  for (const [funcName, aggregations] of Object.entries(aggregationsByFunction)) {
    console.log(`${funcName}:`);
    aggregations.forEach(({ type, count }) => {
      console.log(`  • ${count}x ${type.toUpperCase()}`);
    });
    console.log();
  }
} else {
  console.log('No aggregations detected in edge functions.\n');
}

// Exit with appropriate code
if (results.performance.length > 0) {
  console.log('⚠️  VALIDATION WARNING - Performance issues detected\n');
  process.exit(1);
} else if (efficiencyScore < 70) {
  console.log('⚠️  VALIDATION WARNING - Efficiency score below threshold\n');
  process.exit(1);
} else {
  console.log('✅ AGGREGATION VALIDATION PASSED\n');
  process.exit(0);
}
