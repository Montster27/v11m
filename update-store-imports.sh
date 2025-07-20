#!/bin/bash

# Phase 1 Store Consolidation - Import Path Update Script
echo "🔄 Updating store import paths..."

# Update all TypeScript files to change store/ to stores/
find src -name "*.ts" -o -name "*.tsx" | while read file; do
  if grep -q "from.*['\"].*store/" "$file"; then
    echo "Updating: $file"
    sed -i '' "s|from '\.\./store/|from '../stores/|g" "$file"
    sed -i '' "s|from '\.\./\.\./store/|from '../../stores/|g" "$file"
    sed -i '' "s|from '\.\./\.\./\.\./store/|from '../../../stores/|g" "$file"
    sed -i '' "s|from \".*store/|from \"../stores/|g" "$file"
    sed -i '' "s|from './store/|from './stores/|g" "$file"
  fi
done

echo "✅ Import path updates complete"