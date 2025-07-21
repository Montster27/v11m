#!/bin/bash
# V11M2 Release Checklist Script
# Validates the codebase before creating a release

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "\n${BOLD}${BLUE}$1${NC}"
    echo "=================================="
}

print_check() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

# Track results
WARNINGS=0
ERRORS=0

print_header "V11M2 Release Checklist"
echo "Validating codebase for release readiness..."
echo ""

# Check 1: Git state
print_header "1. Git Repository State"
if [[ -n $(git status --porcelain) ]]; then
    print_error "Git working directory not clean"
    git status --short
    ERRORS=$((ERRORS + 1))
else
    print_check "Git working directory is clean"
fi

# Check current branch
BRANCH=$(git branch --show-current)
print_info "Current branch: $BRANCH"

if [ "$BRANCH" != "main" ] && [ "$BRANCH" != "master" ]; then
    print_warning "Not on main/master branch. Consider creating release from main."
    WARNINGS=$((WARNINGS + 1))
fi

# Check 2: Dependencies
print_header "2. Dependencies & Security"
print_info "Checking npm dependencies..."

if npm audit --audit-level=high > /dev/null 2>&1; then
    print_check "No high-level security vulnerabilities found"
else
    print_warning "Security vulnerabilities detected"
    npm audit --audit-level=high | head -20
    WARNINGS=$((WARNINGS + 1))
fi

# Check for outdated dependencies
OUTDATED=$(npm outdated --json 2>/dev/null || echo "{}")
if [ "$OUTDATED" != "{}" ]; then
    print_warning "Some dependencies are outdated"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 3: Code Quality
print_header "3. Code Quality Checks"

# Type checking
print_info "Running TypeScript type check..."
if npm run check:types > /dev/null 2>&1; then
    print_check "TypeScript type check passed"
else
    print_error "TypeScript type check failed"
    npm run check:types 2>&1 | head -10
    ERRORS=$((ERRORS + 1))
fi

# Linting
print_info "Running ESLint..."
if npm run lint > /dev/null 2>&1; then
    print_check "ESLint passed"
else
    print_warning "ESLint warnings/errors found"
    npm run lint 2>&1 | head -10
    WARNINGS=$((WARNINGS + 1))
fi

# Check for debug code
print_info "Checking for debug code..."
if npm run check:debug > /dev/null 2>&1; then
    print_check "No console.log statements found"
else
    print_warning "Debug console.log statements found"
    WARNINGS=$((WARNINGS + 1))
fi

# Check store structure
print_info "Validating store structure..."
if npm run check:stores > /dev/null 2>&1; then
    print_check "Store structure is valid"
else
    print_error "Invalid store structure detected"
    ERRORS=$((ERRORS + 1))
fi

# Check 4: Tests
print_header "4. Test Suite"
print_info "Running test suite..."

if npm run test:ci > /dev/null 2>&1; then
    print_check "All tests passed"
else
    print_error "Some tests failed"
    echo ""
    echo "Test failures:"
    npm run test:ci 2>&1 | grep -E "(FAIL|Error|✕)" | head -5
    ERRORS=$((ERRORS + 1))
fi

# Run integration tests
print_info "Running integration tests..."
if npm run test:integration > /dev/null 2>&1; then
    print_check "Integration tests passed"
else
    print_warning "Some integration tests failed"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 5: Build Process
print_header "5. Build Validation"
print_info "Testing production build..."

# Clean previous build
rm -rf dist

if npm run build:production > /dev/null 2>&1; then
    print_check "Production build successful"
else
    print_error "Production build failed"
    echo ""
    echo "Build errors:"
    npm run build:production 2>&1 | tail -10
    ERRORS=$((ERRORS + 1))
    exit 1
fi

# Check build output
if [ ! -d "dist" ]; then
    print_error "Build directory 'dist' not found"
    ERRORS=$((ERRORS + 1))
else
    print_check "Build directory exists"
fi

if [ ! -f "dist/index.html" ]; then
    print_error "index.html not found in build output"
    ERRORS=$((ERRORS + 1))
else
    print_check "index.html found in build output"
fi

# Check 6: Bundle Size Analysis
print_header "6. Bundle Size Analysis"
MAX_SIZE=500000 # 500KB

LARGE_FILES=0
for file in dist/assets/*.js; do
    if [ -f "$file" ]; then
        if command -v stat > /dev/null 2>&1; then
            # macOS/BSD stat
            size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0)
        else
            # GNU stat (Linux)
            size=$(stat -c%s "$file" 2>/dev/null || echo 0)
        fi
        
        filename=$(basename "$file")
        size_kb=$((size / 1024))
        
        if [ $size -gt $MAX_SIZE ]; then
            print_warning "Large bundle detected: $filename (${size_kb}KB)"
            LARGE_FILES=$((LARGE_FILES + 1))
            WARNINGS=$((WARNINGS + 1))
        else
            print_check "Bundle size OK: $filename (${size_kb}KB)"
        fi
    fi
done

if [ $LARGE_FILES -eq 0 ]; then
    print_check "All bundle sizes are within limits"
fi

# Check 7: Environment Configuration
print_header "7. Environment Configuration"

# Check for required environment variables in production
if grep -q "VITE_APP_VERSION" src/config/env.ts; then
    print_check "Version configuration found"
else
    print_warning "Version configuration might be missing"
    WARNINGS=$((WARNINGS + 1))
fi

# Check for proper environment handling
if grep -q "production" src/config/env.ts; then
    print_check "Production environment handling found"
else
    print_warning "Production environment handling might be missing"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 8: Documentation
print_header "8. Documentation & Changelog"

if [ -f "CHANGELOG.md" ]; then
    print_check "CHANGELOG.md exists"
    
    # Check if changelog was recently updated
    CHANGELOG_AGE=$(find CHANGELOG.md -mtime -7 2>/dev/null | wc -l)
    if [ $CHANGELOG_AGE -eq 0 ]; then
        print_warning "CHANGELOG.md hasn't been updated in the last 7 days"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    print_warning "CHANGELOG.md not found"
    WARNINGS=$((WARNINGS + 1))
fi

if [ -f "README.md" ]; then
    print_check "README.md exists"
else
    print_warning "README.md not found"
    WARNINGS=$((WARNINGS + 1))
fi

# Final Summary
print_header "Release Checklist Summary"

echo ""
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    print_check "All checks passed! Ready for release."
    echo ""
    echo -e "${GREEN}${BOLD}🎉 Ready for Release!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Update CHANGELOG.md with release notes"
    echo "2. Run one of:"
    echo "   • npm run version:patch  (for bug fixes)"
    echo "   • npm run version:minor  (for new features)"
    echo "   • npm run version:major  (for breaking changes)"
    echo "3. The git push will automatically trigger deployment"
    
elif [ $ERRORS -eq 0 ]; then
    print_warning "Checks completed with $WARNINGS warning(s)"
    echo ""
    echo -e "${YELLOW}${BOLD}⚠️  Proceed with Caution${NC}"
    echo ""
    echo "Release is possible but there are warnings to consider."
    echo "Review the warnings above and decide if they need to be addressed."
    
else
    print_error "Checks failed with $ERRORS error(s) and $WARNINGS warning(s)"
    echo ""
    echo -e "${RED}${BOLD}❌ Not Ready for Release${NC}"
    echo ""
    echo "Please fix the errors above before creating a release."
    exit 1
fi

echo ""
echo "Current version: $(npm pkg get version | tr -d '\"')"
echo "Build size: $(du -sh dist 2>/dev/null | cut -f1 || echo 'Unknown')"

# Clean up build artifacts
rm -rf dist