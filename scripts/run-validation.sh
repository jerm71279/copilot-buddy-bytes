#!/bin/bash

# Quick validation runner
# Run this anytime to verify all checks from validation .md files

echo "🚀 Running comprehensive validation..."
echo ""

node scripts/validate-all.js

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ All validation checks passed!"
  echo "   Safe to commit and push."
  exit 0
else
  echo ""
  echo "❌ Validation failed. Please fix issues above."
  exit 1
fi
