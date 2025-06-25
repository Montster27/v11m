#!/bin/bash
# Script to checkout the working commit 6957631 and examine key files

echo "Checking out working commit 6957631..."
cd /Users/montysharma/V11M2
git checkout 69576317d23540fa3de5a169c5e30f5133f126ea

echo "Working commit checked out successfully"
echo "Current commit:"
git log --oneline -1

echo "Examining Navigation component from working commit..."
if [ -f "src/components/Navigation.tsx" ]; then
    echo "=== Navigation.tsx from working commit ==="
    cat src/components/Navigation.tsx
else
    echo "Navigation.tsx not found in expected location"
    find . -name "Navigation.tsx" -type f
fi

echo -e "\n=== Examining App.tsx from working commit ==="
if [ -f "src/App.tsx" ]; then
    cat src/App.tsx
else
    echo "App.tsx not found"
fi

echo -e "\n=== Examining store structure ==="
echo "Store directories:"
find src -name "*store*" -type d
echo "Store files:"
find src -name "*store*" -type f
