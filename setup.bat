@echo off

REM Nutrient BOL Processor - Windows Setup Script
REM This script helps set up the project for local development on Windows

echo 🚀 Nutrient BOL Processor - Local Setup
echo ========================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 20+ from https://nodejs.org/
    echo    Choose LTS version and check "Add to PATH" during installation
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

REM Check if .NET is installed (optional but recommended)
dotnet --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ .NET detected
    dotnet --version
) else (
    echo ⚠️  .NET SDK not found (optional for XTractFlow service)
    echo    Install from: https://dotnet.microsoft.com/download/dotnet/8.0
)

REM Check if Docker is available (optional)
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Docker detected
    docker --version
) else (
    echo ⚠️  Docker not found (optional for containerized services)
    echo    Install from: https://www.docker.com/products/docker-desktop/
)

echo.
echo 📦 Installing Node.js dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    echo    Try: del /Q node_modules package-lock.json && npm install
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Check if .env exists, if not create from template
if not exist ".env" (
    if exist ".env.example" (
        echo 📝 Creating .env file from template...
        copy ".env.example" ".env" >nul
        echo ✅ .env file created - edit it to configure API keys
    )
)

echo.
echo 🎉 Setup complete! You can now run:
echo.
echo Development mode (mock processing):
echo    npm run dev
echo.
echo Production mode (requires API keys in .env):
echo    set NODE_ENV=production ^&^& npm run dev
echo.
echo Build for production:
echo    npm run build
echo    npm start
echo.
echo Optional: XTractFlow .NET service (for production):
echo    cd dotnet-service
echo    dotnet run --urls=http://localhost:8080
echo.
echo The application will be available at http://localhost:5000
echo API documentation: http://localhost:5000/api/docs
echo.
echo For detailed instructions, see README.md
echo.
pause