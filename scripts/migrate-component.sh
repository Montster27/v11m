#!/bin/bash
# Automated V2 Store Migration Helper
# Usage: ./scripts/migrate-component.sh <component-file-path>

if [ $# -eq 0 ]; then
    echo "🔄 V2 Store Migration Helper"
    echo
    echo "Usage: $0 <component-file-path>"
    echo
    echo "Example: $0 src/components/MyComponent.tsx"
    echo
    echo "This script will:"
    echo "  1. Backup the original component"
    echo "  2. Replace legacy store imports with V2 equivalents"
    echo "  3. Update store usage patterns"
    echo "  4. Generate migration report"
    echo
    exit 1
fi

COMPONENT_FILE="$1"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if file exists
if [ ! -f "$COMPONENT_FILE" ]; then
    echo -e "${RED}❌ Error: File '$COMPONENT_FILE' not found${NC}"
    exit 1
fi

echo -e "${BLUE}🔄 Starting V2 Migration for: $COMPONENT_FILE${NC}"
echo

# Create backup
BACKUP_FILE="${COMPONENT_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$COMPONENT_FILE" "$BACKUP_FILE"
echo -e "${GREEN}📋 Backup created: $BACKUP_FILE${NC}"

# Migration mappings
declare -A STORE_MIGRATIONS=(
    ["useAppStore"]="useCoreGameStore"
    ["useStoryletStore"]="useNarrativeStore"
    ["useClueStore"]="useNarrativeStore"
    ["useMinigameStore"]="useCoreGameStore"
    ["useNPCStore"]="useSocialStore"
    ["useStoryletCatalogStore"]="useNarrativeStore"
    ["useSaveStoreV2"]="useSocialStore"
    ["useCharacterStore"]="useCoreGameStore"
)

# Legacy import patterns to remove
LEGACY_IMPORTS=(
    "import.*useAppStore.*from.*"
    "import.*useStoryletStore.*from.*"
    "import.*useClueStore.*from.*"
    "import.*useMinigameStore.*from.*"
    "import.*useNPCStore.*from.*"
    "import.*useStoryletCatalogStore.*from.*"
    "import.*useSaveStoreV2.*from.*"
    "import.*useCharacterStore.*from.*"
)

CHANGES_MADE=false

# Function to add V2 imports if not present
add_v2_imports() {
    local file="$1"
    local needs_core=false
    local needs_narrative=false
    local needs_social=false
    
    # Check which V2 stores are needed
    if grep -q "useCoreGameStore" "$file"; then
        needs_core=true
    fi
    if grep -q "useNarrativeStore" "$file"; then
        needs_narrative=true
    fi
    if grep -q "useSocialStore" "$file"; then
        needs_social=true
    fi
    
    # Build import statement
    local v2_imports=""
    if [ "$needs_core" = true ] || [ "$needs_narrative" = true ] || [ "$needs_social" = true ]; then
        v2_imports="import { "
        local first=true
        if [ "$needs_core" = true ]; then
            v2_imports+="useCoreGameStore"
            first=false
        fi
        if [ "$needs_narrative" = true ]; then
            [ "$first" = false ] && v2_imports+=", "
            v2_imports+="useNarrativeStore"
            first=false
        fi
        if [ "$needs_social" = true ]; then
            [ "$first" = false ] && v2_imports+=", "
            v2_imports+="useSocialStore"
        fi
        v2_imports+=" } from '../stores/v2';"
        
        # Add import if not already present
        if ! grep -q "from.*stores/v2" "$file"; then
            # Find where to insert (after other imports)
            local insert_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
            if [ -n "$insert_line" ]; then
                sed -i "" "${insert_line}a\\
$v2_imports
" "$file"
                echo -e "${GREEN}✅ Added V2 imports${NC}"
                CHANGES_MADE=true
            fi
        fi
    fi
}

# Replace legacy store usage
echo "🔄 Replacing legacy store usage..."

for legacy_store in "${!STORE_MIGRATIONS[@]}"; do
    v2_store="${STORE_MIGRATIONS[$legacy_store]}"
    
    if grep -q "$legacy_store" "$COMPONENT_FILE"; then
        echo -e "${YELLOW}   Replacing $legacy_store → $v2_store${NC}"
        
        # Replace store usage in destructuring
        sed -i "" "s/$legacy_store()/$v2_store()/g" "$COMPONENT_FILE"
        
        # Replace hook calls
        sed -i "" "s/const.*=.*$legacy_store(/const state = $v2_store(/g" "$COMPONENT_FILE"
        
        CHANGES_MADE=true
    fi
done

# Remove legacy imports
echo "🗑️  Removing legacy imports..."

for import_pattern in "${LEGACY_IMPORTS[@]}"; do
    if grep -q "$import_pattern" "$COMPONENT_FILE"; then
        echo -e "${YELLOW}   Removing legacy import${NC}"
        sed -i "" "/$import_pattern/d" "$COMPONENT_FILE"
        CHANGES_MADE=true
    fi
done

# Add V2 imports
add_v2_imports "$COMPONENT_FILE"

# Generate migration report
echo
echo -e "${BLUE}📊 Migration Report${NC}"
echo "===================="

if [ "$CHANGES_MADE" = true ]; then
    echo -e "${GREEN}✅ Component migrated successfully${NC}"
    echo
    echo "Changes made:"
    echo "• Replaced legacy store imports with V2 equivalents"
    echo "• Updated store usage patterns"
    echo "• Added V2 store imports"
    echo
    echo "Next steps:"
    echo "1. Review the migrated code manually"
    echo "2. Update any component-specific logic"
    echo "3. Test the component functionality"
    echo "4. Update MIGRATION_STATUS.md"
    echo
    echo -e "${YELLOW}⚠️  Manual verification required:${NC}"
    echo "• Check that all store method calls are correct"
    echo "• Verify data access patterns match V2 store structure"
    echo "• Test component functionality"
    echo "• Update any component tests"
else
    echo -e "${GREEN}✅ No legacy store usage found${NC}"
    echo "Component appears to already be V2 compliant or uses no stores."
fi

echo
echo "Backup: $BACKUP_FILE"
echo -e "${BLUE}📚 See MIGRATION_STATUS.md for detailed requirements${NC}"