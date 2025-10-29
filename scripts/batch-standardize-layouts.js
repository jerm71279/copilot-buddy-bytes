#!/usr/bin/env node

/**
 * Batch Layout Standardization Script
 * Automatically converts pages to use DashboardLayout
 */

const fs = require('fs');
const path = require('path');

const filesToStandardize = [
  'src/pages/SharePointSync.tsx',
  'src/pages/WorkflowDetail.tsx',
  'src/pages/WorkflowIntelligence.tsx',
  'src/pages/WorkflowKnowledgeIntegration.tsx',
  'src/pages/hr/EmployeeOnboardingDashboard.tsx',
  'src/pages/hr/EmployeeOnboardingDetail.tsx',
  'src/pages/hr/EmployeeOnboardingEdit.tsx',
  'src/pages/hr/EmployeeOnboardingNew.tsx',
  'src/pages/hr/EmployeeOnboardingTemplates.tsx',
];

function standardizeLayout(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Check if already using DashboardLayout
    if (content.includes('DashboardLayout')) {
      console.log(`✓ Already standardized: ${filePath}`);
      return false;
    }

    // Add DashboardLayout import
    const importRegex = /(import.*from ['"]@\/components\/.*['"];?\n)/;
    if (!content.includes('DashboardLayout')) {
      content = content.replace(
        importRegex,
        `$1import { DashboardLayout } from "@/components/layouts/DashboardLayout";\n`
      );
    }

    // Replace old pattern with DashboardLayout
    const oldPatternRegex = /<div className="min-h-screen bg-background">\s*<div className="container mx-auto[^>]*>/;
    if (oldPatternRegex.test(content)) {
      content = content.replace(
        oldPatternRegex,
        '<DashboardLayout>'
      );

      // Close DashboardLayout before final closing tags
      content = content.replace(
        /(\s*)<\/div>\s*<\/div>\s*\);/,
        '$1</DashboardLayout>\n  );'
      );

      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Standardized: ${filePath}`);
      return true;
    } else {
      console.log(`⚠️  Pattern not found in: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

console.log('🚀 Starting batch layout standardization...\n');

let standardized = 0;
let skipped = 0;
let errors = 0;

filesToStandardize.forEach(file => {
  const result = standardizeLayout(file);
  if (result === true) standardized++;
  else if (result === false) skipped++;
  else errors++;
});

console.log('\n📊 Standardization Summary:');
console.log(`   ✓ Standardized: ${standardized}`);
console.log(`   ⚠️  Skipped: ${skipped}`);
console.log(`   ✗ Errors: ${errors}`);
console.log(`\n✅ Batch process complete!`);
