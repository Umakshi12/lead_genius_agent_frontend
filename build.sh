#!/bin/bash
set -e  # Exit on error

echo "🏗️  Starting Build Process..."

# 1. Install Backend Dependencies
echo "🐍 Installing Backend Dependencies..."
cd backend
pip install -r requirements.txt
cd ..

# 2. Install Frontend Dependencies & Build
echo "⚛️  Installing & Building Frontend..."
cd frontend
npm install
npm run build
cd ..

echo "✅ Build Complete!"
