#!/bin/bash
# V11M2 Desktop Build Script
# Builds Electron application for desktop platforms

set -e

echo "🖥️  Building V11M2 Desktop Application..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or later."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or later is required. Current version: $(node --version)"
    exit 1
fi

print_status "Node.js version: $(node --version) ✓"

# Check if npm dependencies are installed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm ci
fi

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf dist dist-electron

# Build web assets
print_status "Building web assets..."
npm run build:production

if [ ! -d "dist" ]; then
    print_error "Web build failed - dist directory not found"
    exit 1
fi

print_success "Web assets built successfully"

# Check if Electron is available
if ! npm list electron-builder > /dev/null 2>&1; then
    print_error "electron-builder not found. Installing..."
    npm install --save-dev electron-builder
fi

# Build Electron application
print_status "Building Electron application..."

# Set environment variables
export NODE_ENV=production
export VITE_APP_VERSION=${VITE_APP_VERSION:-"$(npm pkg get version | tr -d '\"')"}

# Run Electron build
npm run dist

# Check if build was successful
if [ ! -d "dist-electron" ]; then
    print_error "Electron build failed - dist-electron directory not found"
    exit 1
fi

# Report build results
print_success "Desktop build completed successfully!"
echo ""
echo "📦 Build artifacts:"
echo "=================="

if [ -d "dist-electron" ]; then
    ls -lah dist-electron/
    echo ""
    
    # Calculate total size
    TOTAL_SIZE=$(du -sh dist-electron/ | cut -f1)
    print_status "Total build size: $TOTAL_SIZE"
    
    # Check for common package formats
    if ls dist-electron/*.dmg 1> /dev/null 2>&1; then
        DMG_COUNT=$(ls dist-electron/*.dmg | wc -l)
        print_success "macOS packages: $DMG_COUNT .dmg file(s)"
    fi
    
    if ls dist-electron/*.exe 1> /dev/null 2>&1; then
        EXE_COUNT=$(ls dist-electron/*.exe | wc -l)
        print_success "Windows packages: $EXE_COUNT .exe file(s)"
    fi
    
    if ls dist-electron/*.AppImage 1> /dev/null 2>&1; then
        APPIMAGE_COUNT=$(ls dist-electron/*.AppImage | wc -l)
        print_success "Linux packages: $APPIMAGE_COUNT .AppImage file(s)"
    fi
    
    if ls dist-electron/*.deb 1> /dev/null 2>&1; then
        DEB_COUNT=$(ls dist-electron/*.deb | wc -l)
        print_success "Debian packages: $DEB_COUNT .deb file(s)"
    fi
else
    print_warning "No build artifacts found in dist-electron/"
fi

echo ""
print_success "🎉 V11M2 Desktop build complete!"
echo ""
echo "Next steps:"
echo "- Test the application: open the appropriate package for your platform"
echo "- For distribution: upload packages to GitHub releases or app stores"
echo "- For development: use 'npm run electron' for faster testing"