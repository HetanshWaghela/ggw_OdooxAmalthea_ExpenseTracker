#!/bin/bash

# Kill any existing processes
echo "Killing existing processes..."
pkill -f "node.*index.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true

# Wait a moment
sleep 2

# Start backend server
echo "Starting backend server..."
cd server
node index.js &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Test backend
echo "Testing backend..."
curl -s http://localhost:5000/api/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend server is running on http://localhost:5000"
else
    echo "❌ Backend server failed to start"
    exit 1
fi

# Start frontend server
echo "Starting frontend server..."
cd ../client
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Test frontend
echo "Testing frontend..."
curl -s http://localhost:5173/ > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Frontend server is running on http://localhost:5173"
else
    echo "❌ Frontend server failed to start"
    exit 1
fi

echo ""
echo "🚀 Both servers are running successfully!"
echo "📱 Frontend: http://localhost:5173/"
echo "🔧 Backend API: http://localhost:5000/api"
echo ""
echo "Press Ctrl+C to stop both servers"

# Keep script running and handle cleanup
trap 'echo "Stopping servers..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT

# Wait for processes
wait
