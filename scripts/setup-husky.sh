#!/bin/bash

# Setup Husky Git Hooks
echo "🔧 Setting up Husky git hooks..."

# Install husky
npx husky install

# Make pre-commit hook executable
chmod +x .husky/pre-commit

# Make validation scripts executable
chmod +x scripts/validate-design-system.js
chmod +x scripts/validate-security.js
chmod +x scripts/validate-edge-functions.js

echo "✅ Husky setup complete!"
echo ""
echo "Pre-commit validation will now run automatically on every commit."
echo "To bypass (emergency only): git commit --no-verify"
