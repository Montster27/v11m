#!/bin/bash

# MMV Development Setup Script
# Run with: bash scripts/setup-dev.sh

echo "🚀 Setting up MMV development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v18+) first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Node.js version is $NODE_VERSION. Recommended: v18+"
    echo "   Consider upgrading for best compatibility."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Set up environment file
if [ ! -f ".env.local" ]; then
    echo "⚙️  Setting up environment configuration..."
    cp .env.example .env.local
    echo "✅ Created .env.local from .env.example"
    echo "   You can customize this file for your local development needs."
else
    echo "ℹ️  .env.local already exists, skipping..."
fi

# Verify setup
echo "🔍 Verifying setup..."
npm run build:check

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Setup complete! 🎉"
    echo ""
    echo "Next steps:"
    echo "  1. Start development server: npm run dev"
    echo "  2. Open http://localhost:5173 in your browser"
    echo "  3. For Electron app: npm run electron"
    echo ""
    echo "Happy coding! 💻"
else
    echo "❌ Setup verification failed. Check the errors above."
    exit 1
fi
