@echo off
echo Starting Textlaire Development Environment
echo ========================================

echo Starting Server...
start cmd /k "cd server && npm run dev"

echo Waiting for server to start...
timeout /t 5

echo Starting Client...
start cmd /k "cd client && npm run dev"

echo ========================================
echo Development environment started!
echo Server: http://localhost:5000
echo Client: http://localhost:5173
echo ========================================
