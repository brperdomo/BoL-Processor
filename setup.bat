@echo off

REM Nutrient BOL Processor - Windows Setup Script
REM This script helps set up the project for local development on Windows

echo 🚀 Nutrient BOL Processor - Local Setup
echo ========================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 20+ from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected
node --version

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm
    pause
    exit /b 1
)

echo ✅ npm detected
npm --version

REM Install dependencies
echo 📦 Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully
echo.
echo 🎉 Setup complete! You can now run:
echo    npm run dev    - Start development server
echo    npm run build  - Build for production
echo    npm start      - Start production server
echo.
echo The application will be available at http://localhost:5000
echo.
echo For detailed instructions, see README.md
echo.
pause