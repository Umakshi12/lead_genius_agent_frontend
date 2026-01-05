#!/bin/bash

# ============================================
# Lead Genius Agent - Startup Script for Replit
# ============================================

echo "🚀 Starting Lead Genius Agent..."
echo "=================================="

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
pip install -q -r requirements.txt
cd ..

# Install frontend dependencies and build
echo "📦 Installing frontend dependencies..."
cd frontend
npm install --silent
echo "🔨 Building frontend for production..."
npm run build
cd ..

# Start both services
echo ""
echo "🌐 Starting services..."
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:3000"
echo "=================================="

# Run backend in background
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Run frontend (this will be the main process)
cd frontend
npm run start

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT
