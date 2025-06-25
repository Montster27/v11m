#!/bin/bash
cd /Users/montysharma/V11M2

# Check current state first
echo "=== CURRENT STATE (Before checkout) ==="
echo "Current commit:"
git log --oneline -1
echo "Current Navigation.tsx:"
if [ -f "src/components/Navigation.tsx" ]; then
    head -20 src/components/Navigation.tsx
else
    echo "Navigation.tsx not found"
fi

echo -e "\n=== CHECKING OUT WORKING COMMIT 6957631 ==="
git checkout 69576317d23540fa3de5a169c5e30f5133f126ea

echo -e "\n=== WORKING STATE (After checkout) ==="
echo "Working commit:"
git log --oneline -1

echo -e "\n=== Navigation.tsx from working commit ==="
if [ -f "src/components/Navigation.tsx" ]; then
    cat src/components/Navigation.tsx
else
    echo "Navigation.tsx not found, searching..."
    find . -name "Navigation.tsx" -type f
fi
