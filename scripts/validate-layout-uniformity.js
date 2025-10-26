#!/usr/bin/env node

/**
 * Layout Uniformity Validator
 * 
 * Checks for consistent layout patterns across:
 * - Dashboard pages
 * - Portal pages
 * - Data Lake pages
 * 
 * Expected uniform patterns:
 * - Container structure
 * - Padding/spacing
 * - Header layout
 * - Responsive breakpoints
 */

const fs = require('fs');
const path = require('path');

const results = {
  layoutIssues: [],
  spacingIssues: [],
  headerIssues: [],
  passed: []
};

function logResult(emoji, category, message, severity = 'info') {
  const entry = { emoji, category, message, severity, timestamp: new Date().toISOString() };
  
  if (severity === 'critical' || severity === 'warning') {
    if (category === 'LAYOUT') results.layoutIssues.push(entry);
    if (category === 'SPACING') results.spacingIssues.push(entry);
    if (category === 'HEADER') results.headerIssues.push(entry);
  } else {
    results.passed.push(entry);
  }
  
  console.log(`${emoji} [${category}] ${message}`);
}

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!filePath.includes('node_modules') && !filePath.includes('.git')) {
        getAllFiles(filePath, fileList);
      }
    } else if (filePath.match(/\.(tsx)$/)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

console.log('🎨 LAYOUT UNIFORMITY VALIDATION\n');
console.log('═'.repeat(80));
console.log('\n');

// ========================================
// 1. IDENTIFY DASHBOARD AND PORTAL PAGES
// ========================================
console.log('📋 1. IDENTIFYING PAGES\n');

const pagesDir = path.join(__dirname, '../src/pages');
const allPages = getAllFiles(pagesDir);

const dashboardPages = allPages.filter(f => 
  f.includes('Dashboard.tsx') || 
  f.includes('Portal.tsx') ||
  f.includes('Data') && (f.includes('.tsx'))
);

console.log(`Found ${dashboardPages.length} dashboard/portal pages to validate\n`);

// ========================================
// 2. LAYOUT PATTERN ANALYSIS
// ========================================
console.log('📐 2. LAYOUT PATTERN ANALYSIS\n');

const layoutPatterns = {
  'min-h-screen bg-background': [],
  'min-h-screen bg-gradient': [],
  'container mx-auto': [],
  'marginTop: var(--lanes-height': [],
  'paddingTop: calc(var(--lanes-bottom': [],
  'px-4 pb-8 pt-8': [],
  'px-4 py-8': [],
  'p-6': [],
  'space-y-6': [],
  'space-y-8': []
};

dashboardPages.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const fileName = file.replace(path.join(__dirname, '../src/pages/'), '');
  
  Object.keys(layoutPatterns).forEach(pattern => {
    if (content.includes(pattern)) {
      layoutPatterns[pattern].push(fileName);
    }
  });
});

// Check for consistency
const standardLayout = 'min-h-screen bg-background';
const standardContainer = 'container mx-auto';
const standardPadding = 'px-4 pb-8 pt-8';
const standardMargin = 'marginTop: var(--lanes-height';

dashboardPages.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const fileName = file.replace(path.join(__dirname, '../src/pages/'), '');
  
  // Check main layout wrapper
  if (!content.includes(standardLayout)) {
    if (content.includes('min-h-screen')) {
      logResult('⚠️', 'LAYOUT', `${fileName} uses non-standard layout wrapper`, 'warning');
    }
  }
  
  // Check container pattern
  if (content.includes('main') && !content.includes(standardContainer)) {
    logResult('⚠️', 'LAYOUT', `${fileName} missing standard container pattern`, 'warning');
  }
  
  // Check top spacing consistency
  const hasLanesHeight = content.includes(standardMargin);
  const hasLanesBottom = content.includes('paddingTop: calc(var(--lanes-bottom');
  
  if (hasLanesHeight && hasLanesBottom) {
    logResult('⚠️', 'SPACING', `${fileName} has conflicting top spacing patterns`, 'warning');
  } else if (hasLanesHeight) {
    logResult('✅', 'SPACING', `${fileName} uses standard lanes-height spacing`, 'info');
  } else if (hasLanesBottom) {
    logResult('💡', 'SPACING', `${fileName} uses lanes-bottom spacing (consider standardizing)`, 'info');
  }
});

console.log('\n');

// ========================================
// 3. HEADER PATTERN ANALYSIS
// ========================================
console.log('📑 3. HEADER PATTERN ANALYSIS\n');

const headerPatterns = {
  hasIcon: [],
  hasTitle: [],
  hasDescription: [],
  hasActions: [],
  consistent: []
};

dashboardPages.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const fileName = file.replace(path.join(__dirname, '../src/pages/'), '');
  
  // Check for header icon
  const hasHeaderIcon = content.match(/className="h-8 w-8 text-primary"/);
  if (hasHeaderIcon) headerPatterns.hasIcon.push(fileName);
  
  // Check for title
  const hasTitle = content.match(/className="text-4xl font-bold"/);
  if (hasTitle) headerPatterns.hasTitle.push(fileName);
  
  // Check for description
  const hasDescription = content.match(/text-muted-foreground text-lg/);
  if (hasDescription) headerPatterns.hasDescription.push(fileName);
  
  // Consistent header structure
  if (hasHeaderIcon && hasTitle) {
    headerPatterns.consistent.push(fileName);
    logResult('✅', 'HEADER', `${fileName} has consistent header structure`, 'info');
  } else {
    logResult('⚠️', 'HEADER', `${fileName} missing standard header elements`, 'warning');
  }
});

console.log('\n');

// ========================================
// 4. RESPONSIVE DESIGN CHECK
// ========================================
console.log('📱 4. RESPONSIVE DESIGN CHECK\n');

const responsivePatterns = {
  hasGridResponsive: [],
  hasFlexResponsive: [],
  hasMobileBreakpoint: [],
  hasTabletBreakpoint: [],
  hasDesktopBreakpoint: []
};

dashboardPages.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const fileName = file.replace(path.join(__dirname, '../src/pages/'), '');
  
  // Check for responsive grid
  if (content.includes('md:grid-cols') || content.includes('lg:grid-cols')) {
    responsivePatterns.hasGridResponsive.push(fileName);
  }
  
  // Check for responsive flex
  if (content.includes('md:flex') || content.includes('lg:flex')) {
    responsivePatterns.hasFlexResponsive.push(fileName);
  }
  
  // Check breakpoints
  if (content.includes('sm:')) responsivePatterns.hasMobileBreakpoint.push(fileName);
  if (content.includes('md:')) responsivePatterns.hasTabletBreakpoint.push(fileName);
  if (content.includes('lg:')) responsivePatterns.hasDesktopBreakpoint.push(fileName);
  
  const hasResponsive = 
    content.includes('md:') || 
    content.includes('lg:') || 
    content.includes('sm:');
    
  if (!hasResponsive) {
    logResult('⚠️', 'RESPONSIVE', `${fileName} lacks responsive design patterns`, 'warning');
  } else {
    logResult('✅', 'RESPONSIVE', `${fileName} implements responsive design`, 'info');
  }
});

console.log('\n');

// ========================================
// 5. PAGE DIMENSION UNIFORMITY CHECK
// ========================================
console.log('📐 5. PAGE DIMENSION UNIFORMITY CHECK\n');

const dimensionPatterns = {
  standardWidth: [],
  customWidth: [],
  standardMaxWidth: [],
  fullWidth: [],
  fixedHeight: [],
  minHeight: []
};

const standardDimensions = {
  containerMaxWidth: ['max-w-7xl', 'container'],
  standardPadding: ['px-4', 'px-6'],
  standardHeight: ['min-h-screen', 'h-screen']
};

dashboardPages.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const fileName = file.replace(path.join(__dirname, '../src/pages/'), '');
  
  // Check container width patterns
  if (content.includes('max-w-7xl') || content.includes('container mx-auto')) {
    dimensionPatterns.standardWidth.push(fileName);
    logResult('✅', 'DIMENSION', `${fileName} uses standard container width`, 'info');
  } else if (content.match(/max-w-\[?(\d+)(px|rem|em)/)) {
    dimensionPatterns.customWidth.push(fileName);
    const customMatch = content.match(/max-w-\[?(\d+)(px|rem|em)/);
    logResult('⚠️', 'DIMENSION', `${fileName} uses custom width: ${customMatch ? customMatch[0] : 'unknown'}`, 'warning');
  } else if (content.includes('w-full') && !content.includes('max-w')) {
    dimensionPatterns.fullWidth.push(fileName);
    logResult('💡', 'DIMENSION', `${fileName} uses full width without max-width constraint`, 'info');
  }
  
  // Check height patterns
  if (content.includes('min-h-screen')) {
    dimensionPatterns.minHeight.push(fileName);
    logResult('✅', 'DIMENSION', `${fileName} uses min-h-screen for viewport height`, 'info');
  } else if (content.match(/h-\[?(\d+)(px|rem|vh)/)) {
    dimensionPatterns.fixedHeight.push(fileName);
    const heightMatch = content.match(/h-\[?(\d+)(px|rem|vh)/);
    logResult('⚠️', 'DIMENSION', `${fileName} uses fixed height: ${heightMatch ? heightMatch[0] : 'unknown'}`, 'warning');
  }
  
  // Check for inconsistent padding
  const paddingClasses = content.match(/p[xy]?-\d+/g);
  if (paddingClasses) {
    const uniquePaddings = [...new Set(paddingClasses)];
    if (uniquePaddings.length > 3) {
      logResult('⚠️', 'DIMENSION', `${fileName} has ${uniquePaddings.length} different padding values (recommend max 3)`, 'warning');
    }
  }
  
  // Check for hardcoded pixel dimensions
  const hardcodedWidths = content.match(/width:\s*['"]?\d+px/g);
  const hardcodedHeights = content.match(/height:\s*['"]?\d+px/g);
  
  if (hardcodedWidths && hardcodedWidths.length > 0) {
    logResult('⚠️', 'DIMENSION', `${fileName} has ${hardcodedWidths.length} hardcoded pixel widths (use Tailwind classes)`, 'warning');
  }
  
  if (hardcodedHeights && hardcodedHeights.length > 0) {
    logResult('⚠️', 'DIMENSION', `${fileName} has ${hardcodedHeights.length} hardcoded pixel heights (use Tailwind classes)`, 'warning');
  }
});

console.log('\n');

// ========================================
// FINAL REPORT
// ========================================
console.log('═'.repeat(80));
console.log('\n📊 LAYOUT UNIFORMITY SUMMARY\n');
console.log('═'.repeat(80));
console.log('\n');

console.log(`🎨 Layout Issues:       ${results.layoutIssues.length}`);
console.log(`📏 Spacing Issues:      ${results.spacingIssues.length}`);
console.log(`📑 Header Issues:       ${results.headerIssues.length}`);
console.log(`✅ Passed Checks:       ${results.passed.length}`);
console.log('\n');

// Pattern distribution
console.log('📊 PATTERN DISTRIBUTION:\n');
console.log(`   Standard Layout (${layoutPatterns[standardLayout].length} files):`);
console.log(`   Standard Container (${layoutPatterns[standardContainer].length} files):`);
console.log(`   Standard Padding (${layoutPatterns[standardPadding].length} files):`);
console.log(`   Consistent Headers (${headerPatterns.consistent.length} files):`);
console.log('\n');

// Recommendations
console.log('📋 RECOMMENDED LAYOUT STANDARDS:\n');
console.log('   1. Wrapper: <div className="min-h-screen bg-background">');
console.log('   2. Container: <div className="container mx-auto px-4 pb-8 pt-8">');
console.log('   3. Top Spacing: style={{ marginTop: \'var(--lanes-height, 0px)\' }}');
console.log('   4. Header: Icon (h-8 w-8) + Title (text-4xl font-bold) + Description');
console.log('   5. Responsive: Use md:grid-cols-* and lg:grid-cols-* patterns');
console.log('\n');

// Detailed findings
if (results.layoutIssues.length > 0) {
  console.log('🎨 LAYOUT ISSUES TO FIX:\n');
  results.layoutIssues.forEach(r => console.log(`   ${r.emoji} ${r.message}`));
  console.log('\n');
}

if (results.spacingIssues.length > 0) {
  console.log('📏 SPACING ISSUES TO ADDRESS:\n');
  results.spacingIssues.forEach(r => console.log(`   ${r.emoji} ${r.message}`));
  console.log('\n');
}

if (results.headerIssues.length > 0) {
  console.log('📑 HEADER ISSUES TO ADDRESS:\n');
  results.headerIssues.forEach(r => console.log(`   ${r.emoji} ${r.message}`));
  console.log('\n');
}

// Export status
const totalIssues = results.layoutIssues.length + results.spacingIssues.length + results.headerIssues.length;

if (totalIssues === 0) {
  console.log('✅ LAYOUT UNIFORMITY EXCELLENT\n');
  process.exit(0);
} else if (totalIssues > 10) {
  console.log('⚠️  SIGNIFICANT LAYOUT INCONSISTENCIES - REFACTORING RECOMMENDED\n');
  process.exit(0);
} else {
  console.log('💡 MINOR LAYOUT INCONSISTENCIES - OPTIONAL CLEANUP\n');
  process.exit(0);
}
