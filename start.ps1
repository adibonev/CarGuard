# CarGuard Start Script for PowerShell

Write-Host "╔════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        Starting CarGuard App        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Yellow
Write-Host ""

# Kill any existing node processes
Write-Host "Cleaning up old processes..." -ForegroundColor Gray
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start backend
Write-Host "► Backend starting on port 5000..." -ForegroundColor Cyan
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$(Get-Location)'; npm start" -PassThru

# Wait for backend to start
Start-Sleep -Seconds 3

# Start frontend
Write-Host "► Frontend starting on port 3000..." -ForegroundColor Cyan
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$(Get-Location)\client'; npm start" -PassThru

# Wait for frontend to start
Start-Sleep -Seconds 5

# Open browser
Write-Host ""
Write-Host "Opening browser..." -ForegroundColor Green
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "╔════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   ✓ CarGuard is running!           ║" -ForegroundColor Green
Write-Host "╠════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║ Frontend:  http://localhost:3000   ║" -ForegroundColor Green
Write-Host "║ Backend:   http://localhost:5000   ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Keep the command windows open!" -ForegroundColor Yellow
Write-Host "Press Ctrl+C in each window to stop." -ForegroundColor Yellow
