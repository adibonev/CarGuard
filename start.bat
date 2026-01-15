@echo off
echo Starting CarGuard...
echo.

REM Check if node is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Start backend in a new window
echo Starting Backend on port 5000...
start cmd /k "npm start"

REM Wait a bit for backend to start
timeout /t 3 /nobreak

REM Start frontend in a new window
echo Starting Frontend on port 3000...
start cmd /k "cd client && npm start"

REM Wait a bit for frontend to start
timeout /t 5 /nobreak

REM Open browser
echo Opening browser...
start http://localhost:3000

echo.
echo CarGuard is running!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Keep these command windows open while working.
echo Press Ctrl+C in each window to stop the servers.
