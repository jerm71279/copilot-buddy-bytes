#!/usr/bin/env node

/**
 * Layout Validation Script
 * Checks page dimensions and layout uniformity across dashboards and portals
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const results = {
  timestamp: new Date().toISOString(),
  dashboards: [],
  portals: [],
  layoutIssues: [],
  dimensionIssues: [],
  uniformityScore: 0,
  recommendations: []
};

// Read all page/dashboard files
function findDashboardFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.')) {
      findDashboardFiles(filePath, fileList);
    } else if (
      (file.endsWith('.tsx') || file.endsWith('.ts')) &&
      (filePath.includes('/pages/') || filePath.includes('Dashboard') || filePath.includes('Portal'))
    ) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Extract layout patterns from file
function analyzeLayout(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);
  
  const analysis = {
    file: filePath.replace(srcDir, 'src'),
    name: fileName,
    usesLayout: false,
    containerClass: null,
    maxWidth: null,
    padding: null,
    gridSystem: null,
    responsiveBreakpoints: [],
    issues: []
  };
  
  // Check for layout components
  if (content.includes('DashboardLayout') || content.includes('Layout')) {
    analysis.usesLayout = true;
  } else {
    analysis.issues.push('No layout component detected');
  }
  
  // Check for container classes
  const containerMatch = content.match(/className="([^"]*container[^"]*)"/);
  if (containerMatch) {
    analysis.containerClass = containerMatch[1];
  }
  
  // Check for max-width
  const maxWidthMatch = content.match(/max-w-(\w+)/);
  if (maxWidthMatch) {
    analysis.maxWidth = maxWidthMatch[1];
  }
  
  // Check for padding
  const paddingMatches = content.match(/p-(\d+)|px-(\d+)|py-(\d+)/g);
  if (paddingMatches) {
    analysis.padding = [...new Set(paddingMatches)];
  }
  
  // Check for grid systems
  if (content.includes('grid-cols')) {
    const gridMatch = content.match(/grid-cols-(\d+)/g);
    if (gridMatch) {
      analysis.gridSystem = [...new Set(gridMatch)];
    }
  }
  
  // Check for responsive breakpoints
  const breakpoints = ['sm:', 'md:', 'lg:', 'xl:', '2xl:'];
  breakpoints.forEach(bp => {
    if (content.includes(bp)) {
      analysis.responsiveBreakpoints.push(bp.replace(':', ''));
    }
  });
  
  // Check for hardcoded dimensions
  const hardcodedDimensions = content.match(/width:\s*['"]?\d+px|height:\s*['"]?\d+px/g);
  if (hardcodedDimensions) {
    analysis.issues.push(`Hardcoded dimensions found: ${hardcodedDimensions.join(', ')}`);
  }
  
  return analysis;
}

// Compare layouts for uniformity
function checkUniformity(dashboards, portals) {
  const allLayouts = [...dashboards, ...portals];
  
  // Check max-width consistency
  const maxWidths = allLayouts.map(l => l.maxWidth).filter(Boolean);
  const uniqueMaxWidths = [...new Set(maxWidths)];
  
  if (uniqueMaxWidths.length > 2) {
    results.dimensionIssues.push({
      type: 'max-width',
      message: `Inconsistent max-width values found: ${uniqueMaxWidths.join(', ')}`,
      recommendation: 'Standardize max-width across dashboards'
    });
  }
  
  // Check padding consistency
  const paddings = allLayouts.flatMap(l => l.padding || []);
  const uniquePaddings = [...new Set(paddings)];
  
  if (uniquePaddings.length > 3) {
    results.dimensionIssues.push({
      type: 'padding',
      message: `Multiple padding values detected: ${uniquePaddings.join(', ')}`,
      recommendation: 'Use consistent padding values from design system'
    });
  }
  
  // Check layout component usage
  const layoutUsage = allLayouts.filter(l => l.usesLayout).length;
  const layoutScore = (layoutUsage / allLayouts.length) * 100;
  
  if (layoutScore < 80) {
    results.layoutIssues.push({
      message: `Only ${layoutScore.toFixed(0)}% of pages use layout components`,
      recommendation: 'Wrap all pages in consistent layout components'
    });
  }
  
  // Check responsive design
  const responsivePages = allLayouts.filter(l => l.responsiveBreakpoints.length > 2).length;
  const responsiveScore = (responsivePages / allLayouts.length) * 100;
  
  if (responsiveScore < 70) {
    results.layoutIssues.push({
      message: `Only ${responsiveScore.toFixed(0)}% of pages have comprehensive responsive design`,
      recommendation: 'Add responsive breakpoints (sm, md, lg, xl) to all pages'
    });
  }
  
  // Calculate uniformity score
  results.uniformityScore = Math.round(
    (layoutScore * 0.4) + (responsiveScore * 0.3) + 
    ((uniqueMaxWidths.length <= 2 ? 100 : 50) * 0.3)
  );
}

// Generate recommendations
function generateRecommendations() {
  if (results.uniformityScore < 60) {
    results.recommendations.push('CRITICAL: Implement consistent layout system across all dashboards');
  }
  
  if (results.dimensionIssues.length > 0) {
    results.recommendations.push('Standardize dimensions using design tokens from tailwind.config.ts');
  }
  
  if (results.layoutIssues.length > 0) {
    results.recommendations.push('Create shared layout components for consistent page structure');
  }
  
  const hardcodedDimensions = [...results.dashboards, ...results.portals]
    .filter(l => l.issues.some(i => i.includes('Hardcoded dimensions')));
    
  if (hardcodedDimensions.length > 0) {
    results.recommendations.push('Replace hardcoded dimensions with Tailwind utility classes');
  }
}

// Main execution
console.log('📐 Running Layout Validation...\n');

const files = findDashboardFiles(srcDir);
console.log(`Found ${files.length} dashboard/portal files\n`);

files.forEach(file => {
  const analysis = analyzeLayout(file);
  
  if (file.includes('Portal') || file.toLowerCase().includes('portal')) {
    results.portals.push(analysis);
  } else {
    results.dashboards.push(analysis);
  }
});

checkUniformity(results.dashboards, results.portals);
generateRecommendations();

// Print results
console.log('📊 LAYOUT VALIDATION RESULTS');
console.log('='.repeat(80));
console.log(`Timestamp: ${results.timestamp}`);
console.log(`Dashboards analyzed: ${results.dashboards.length}`);
console.log(`Portals analyzed: ${results.portals.length}`);
console.log(`Uniformity Score: ${results.uniformityScore}/100`);
console.log('\n');

if (results.dashboards.length > 0) {
  console.log('🖥️  DASHBOARDS:');
  results.dashboards.forEach((dash, i) => {
    console.log(`  ${i + 1}. ${dash.name}`);
    console.log(`     Layout: ${dash.usesLayout ? '✅' : '❌'}`);
    console.log(`     Max Width: ${dash.maxWidth || 'Not set'}`);
    console.log(`     Responsive: ${dash.responsiveBreakpoints.join(', ') || 'None'}`);
    if (dash.issues.length > 0) {
      console.log(`     Issues: ${dash.issues.join('; ')}`);
    }
  });
  console.log('\n');
}

if (results.portals.length > 0) {
  console.log('🌐 PORTALS:');
  results.portals.forEach((portal, i) => {
    console.log(`  ${i + 1}. ${portal.name}`);
    console.log(`     Layout: ${portal.usesLayout ? '✅' : '❌'}`);
    console.log(`     Max Width: ${portal.maxWidth || 'Not set'}`);
    console.log(`     Responsive: ${portal.responsiveBreakpoints.join(', ') || 'None'}`);
    if (portal.issues.length > 0) {
      console.log(`     Issues: ${portal.issues.join('; ')}`);
    }
  });
  console.log('\n');
}

if (results.dimensionIssues.length > 0) {
  console.log('📏 DIMENSION ISSUES:');
  results.dimensionIssues.forEach((issue, i) => {
    console.log(`  ${i + 1}. [${issue.type}] ${issue.message}`);
    console.log(`     → ${issue.recommendation}`);
  });
  console.log('\n');
}

if (results.layoutIssues.length > 0) {
  console.log('⚠️  LAYOUT ISSUES:');
  results.layoutIssues.forEach((issue, i) => {
    console.log(`  ${i + 1}. ${issue.message}`);
    console.log(`     → ${issue.recommendation}`);
  });
  console.log('\n');
}

console.log('💡 RECOMMENDATIONS:');
results.recommendations.forEach((rec, i) => {
  console.log(`  ${i + 1}. ${rec}`);
});
console.log('\n');

// Save detailed report
const reportPath = path.join(__dirname, '../LAYOUT_VALIDATION_REPORT.json');
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`📄 Detailed report saved to: LAYOUT_VALIDATION_REPORT.json`);
console.log('='.repeat(80));
