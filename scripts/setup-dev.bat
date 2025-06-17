@echo off
REM MMV Development Setup Script for Windows
REM Run with: scripts\setup-dev.bat

echo 🚀 Setting up MMV development environment...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js ^(v18+^) first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM Set up environment file
if not exist ".env.local" (
    echo ⚙️  Setting up environment configuration...
    copy .env.example .env.local
    echo ✅ Created .env.local from .env.example
    echo    You can customize this file for your local development needs.
) else (
    echo ℹ️  .env.local already exists, skipping...
)

REM Verify setup
echo 🔍 Verifying setup...
npm run build:check

if %errorlevel% equ 0 (
    echo.
    echo ✅ Setup complete! 🎉
    echo.
    echo Next steps:
    echo   1. Start development server: npm run dev
    echo   2. Open http://localhost:5173 in your browser
    echo   3. For Electron app: npm run electron
    echo.
    echo Happy coding! 💻
) else (
    echo ❌ Setup verification failed. Check the errors above.
    pause
    exit /b 1
)

pause
