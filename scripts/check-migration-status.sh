#!/bin/bash
# Check V2 Migration Status - Verify compliance with MIGRATION_STATUS.md

echo "🔍 V2 Store Migration Status Check"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Legacy stores to check for
LEGACY_STORES=(
    "useAppStore"
    "useStoryletStore"
    "useClueStore"
    "useMinigameStore"
    "useNPCStore"
    "useStoryletCatalogStore"
    "useSaveStoreV2"
    "useCharacterStore"
)

# Directories to scan
SCAN_DIRS=("src/components" "src/pages" "src/hooks")

# Statistics
TOTAL_FILES=0
LEGACY_FILES=0
V2_FILES=0
MIXED_FILES=0
CLEAN_FILES=0

echo
echo "📊 Scanning for legacy store usage..."

# Function to check a single file
check_file() {
    local file="$1"
    local has_legacy=false
    local has_v2=false
    local legacy_stores_found=()
    
    # Skip certain files
    if [[ "$file" =~ (\.test\.|\.spec\.|/test/|/stores/|deprecated/|\.githooks/) ]]; then
        return
    fi
    
    ((TOTAL_FILES++))
    
    # Check for legacy stores
    for store in "${LEGACY_STORES[@]}"; do
        if grep -q "import.*$store\|from.*$store" "$file"; then
            has_legacy=true
            legacy_stores_found+=("$store")
        fi
    done
    
    # Check for V2 stores
    if grep -q "useCoreGameStore\|useNarrativeStore\|useSocialStore" "$file"; then
        has_v2=true
    fi
    
    # Categorize file
    if [ "$has_legacy" = true ] && [ "$has_v2" = true ]; then
        ((MIXED_FILES++))
        echo -e "${YELLOW}⚠️  MIXED: $file${NC}"
        echo "    Legacy: ${legacy_stores_found[*]}"
    elif [ "$has_legacy" = true ]; then
        ((LEGACY_FILES++))
        echo -e "${RED}❌ LEGACY: $file${NC}"
        echo "    Uses: ${legacy_stores_found[*]}"
    elif [ "$has_v2" = true ]; then
        ((V2_FILES++))
        echo -e "${GREEN}✅ V2: $file${NC}"
    else
        ((CLEAN_FILES++))
    fi
}

# Scan all directories
for dir in "${SCAN_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "📁 Scanning $dir..."
        while IFS= read -r -d '' file; do
            check_file "$file"
        done < <(find "$dir" -name "*.tsx" -o -name "*.ts" -print0)
    fi
done

echo
echo "📈 Migration Statistics"
echo "======================"
echo -e "Total Files Scanned: ${BLUE}$TOTAL_FILES${NC}"
echo -e "✅ V2 Only: ${GREEN}$V2_FILES${NC}"
echo -e "❌ Legacy Only: ${RED}$LEGACY_FILES${NC}"
echo -e "⚠️  Mixed Usage: ${YELLOW}$MIXED_FILES${NC}"
echo -e "🔄 No Store Usage: $CLEAN_FILES"

echo
echo "🎯 Migration Progress"
echo "===================="

MIGRATED_FILES=$V2_FILES
TOTAL_STORE_FILES=$((V2_FILES + LEGACY_FILES + MIXED_FILES))

if [ $TOTAL_STORE_FILES -gt 0 ]; then
    PROGRESS=$((MIGRATED_FILES * 100 / TOTAL_STORE_FILES))
    echo -e "Progress: ${BLUE}$PROGRESS%${NC} ($MIGRATED_FILES/$TOTAL_STORE_FILES files)"
else
    echo "No store usage found"
fi

echo
echo "🚦 Compliance Status"
echo "===================="

BLOCKING_ISSUES=$((LEGACY_FILES + MIXED_FILES))

if [ $BLOCKING_ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ MIGRATION COMPLETE${NC}"
    echo "All components are using V2 stores exclusively"
    echo "PRs can be merged safely"
else
    echo -e "${RED}🚫 MIGRATION INCOMPLETE${NC}"
    echo -e "Blocking issues: ${RED}$BLOCKING_ISSUES${NC} files"
    echo "PRs will be rejected until these are resolved"
    
    echo
    echo "Required actions:"
    if [ $LEGACY_FILES -gt 0 ]; then
        echo -e "• Migrate ${RED}$LEGACY_FILES${NC} files from legacy stores to V2"
    fi
    if [ $MIXED_FILES -gt 0 ]; then
        echo -e "• Complete migration of ${YELLOW}$MIXED_FILES${NC} files with mixed usage"
    fi
fi

echo
echo "🛠️  Migration Tools"
echo "=================="
echo "• scripts/migrate-component.sh <file> - Automated migration helper"
echo "• scripts/install-git-hooks.sh - Install PR blocking hooks"
echo "• MIGRATION_STATUS.md - Detailed component checklist"

echo
echo "📚 V2 Store Reference"
echo "===================="
echo "Legacy → V2 Mappings:"
echo "• useAppStore → useCoreGameStore"
echo "• useStoryletStore → useNarrativeStore"
echo "• useClueStore → useNarrativeStore"
echo "• useMinigameStore → useCoreGameStore"
echo "• useNPCStore → useSocialStore"
echo "• useStoryletCatalogStore → useNarrativeStore"
echo "• useSaveStoreV2 → useSocialStore"
echo "• useCharacterStore → useCoreGameStore"

echo
if [ $BLOCKING_ISSUES -eq 0 ]; then
    echo -e "${GREEN}🎉 Ready for production deployment!${NC}"
    exit 0
else
    echo -e "${RED}⛔ Migration must be completed before merging PRs${NC}"
    exit 1
fi