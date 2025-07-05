#!/bin/bash
# Install Git hooks for V2 migration enforcement

echo "🔧 Installing V2 Migration Git Hooks..."

# Create .git/hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy pre-commit hook
cp .githooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

echo "✅ Pre-commit hook installed successfully"

# Configure Git to use custom hooks directory
git config core.hooksPath .githooks

echo "✅ Git configured to use .githooks directory"
echo
echo "🎯 V2 Migration enforcement is now active!"
echo "   • All commits will be checked for legacy store usage"
echo "   • PRs will be blocked until migration requirements are met"
echo "   • See MIGRATION_STATUS.md for detailed requirements"
echo
echo "🔄 To bypass checks (for emergency commits only):"
echo "   git commit --no-verify"
echo
echo "📚 Migration resources:"
echo "   • MIGRATION_STATUS.md - Complete component checklist"
echo "   • docs/v2-stores.md - V2 store usage guide"
echo "   • scripts/migrate-component.sh - Automated migration helper"