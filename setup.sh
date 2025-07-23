#!/bin/bash

# Nutrient BOL Processor - Local Setup Script
# This script helps set up the project for local development

echo "🚀 Nutrient BOL Processor - Local Setup"
echo "========================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 20+"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm"
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

echo ""
echo "🎉 Setup complete! You can now run:"
echo "   npm run dev    - Start development server"
echo "   npm run build  - Build for production"
echo "   npm start      - Start production server"
echo ""
echo "The application will be available at http://localhost:5000"
echo ""
echo "For detailed instructions, see README.md"