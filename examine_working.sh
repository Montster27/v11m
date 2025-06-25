#!/bin/bash
# Script to examine working commit files
cd /Users/montysharma/V11M2

# Save current branch/state
echo "Saving current state..."
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
CURRENT_COMMIT=$(git rev-parse HEAD)

echo "Current branch: $CURRENT_BRANCH"
echo "Current commit: $CURRENT_COMMIT"

# Checkout working commit
echo "Checking out working commit 6957631..."
git checkout 69576317d23540fa3de5a169c5e30f5133f126ea >/dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Successfully checked out working commit"
    echo "Working commit details:"
    git log --oneline -1
    
    echo -e "\n=== WORKING Navigation.tsx ==="
    if [ -f "src/components/Navigation.tsx" ]; then
        cat src/components/Navigation.tsx
    else
        echo "❌ Navigation.tsx not found, searching..."
        find . -name "*avigation*" -type f
    fi
    
    echo -e "\n=== WORKING App.tsx ==="
    if [ -f "src/App.tsx" ]; then
        head -50 src/App.tsx
    else
        echo "❌ App.tsx not found"
    fi
    
    echo -e "\n=== WORKING Store Structure ==="
    echo "Store directories:"
    find src -name "*store*" -type d 2>/dev/null
    echo "Store files:"
    find src -name "*store*" -type f 2>/dev/null | head -10
    
else
    echo "❌ Failed to checkout working commit"
    exit 1
fi

# Return to original state
echo -e "\n=== Returning to original state ==="
git checkout $CURRENT_BRANCH >/dev/null 2>&1
echo "✅ Returned to $CURRENT_BRANCH"
