#!/bin/bash

# Nutrient BOL Processor - Local Setup Script
# This script helps set up the project for local development

echo "🚀 Nutrient BOL Processor - Local Setup"
echo "========================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ from https://nodejs.org/"
    echo "   Mac: brew install node@20"
    echo "   Or download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 20+"
    echo "   Current version: $(node -v)"
    echo "   Required: v20.x.x or higher"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm"
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Check if .NET is installed (optional but recommended)
if command -v dotnet &> /dev/null; then
    echo "✅ .NET $(dotnet --version) detected"
else
    echo "⚠️  .NET SDK not found (optional for XTractFlow service)"
    echo "   Install from: https://dotnet.microsoft.com/download/dotnet/8.0"
    echo "   Mac: brew install --cask dotnet-sdk"
fi

# Check if Docker is available (optional)
if command -v docker &> /dev/null; then
    echo "✅ Docker $(docker --version | cut -d' ' -f3 | tr -d ',') detected"
else
    echo "⚠️  Docker not found (optional for containerized services)"
    echo "   Install from: https://www.docker.com/products/docker-desktop/"
fi

echo ""
echo "📦 Installing Node.js dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    echo "   Try: rm -rf node_modules package-lock.json && npm install"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if .env exists, if not create from template
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "📝 Creating .env file from template..."
        cp .env.example .env
        echo "✅ .env file created - edit it to configure API keys"
    fi
fi

echo ""
echo "🎉 Setup complete! You can now run:"
echo ""
echo "Development mode (mock processing):"
echo "   npm run dev"
echo ""
echo "Production mode (requires API keys in .env):"
echo "   NODE_ENV=production npm run dev"
echo ""
echo "Build for production:"
echo "   npm run build"
echo "   npm start"
echo ""
echo "Optional: XTractFlow .NET service (for production):"
echo "   cd dotnet-service"
echo "   dotnet run --urls=http://localhost:8080"
echo ""
echo "The application will be available at http://localhost:5000"
echo "API documentation: http://localhost:5000/api/docs"
echo ""
echo "For detailed instructions, see README.md"