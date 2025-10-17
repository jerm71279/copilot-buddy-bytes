#!/bin/bash

# Run Code Modularization Analysis
# This script runs both validation tools and displays results

echo "🚀 Running Code Modularization Analysis..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Run comprehensive validation
echo "📊 Step 1: Running comprehensive validation..."
echo ""
node scripts/validate-code-modularization.js

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Run redundancy analysis
echo "🔍 Step 2: Running redundancy analysis and generating refactoring plan..."
echo ""
node scripts/analyze-and-fix-redundancies.js

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Analysis complete!"
echo ""
echo "📄 Reports generated:"
echo "   • Console output (above)"
echo "   • MODULARIZATION_REPORT.json"
echo "   • CODE_MODULARIZATION_ANALYSIS.md"
echo ""
echo "📖 For full documentation, see: CODE_MODULARIZATION_ANALYSIS.md"
echo ""
