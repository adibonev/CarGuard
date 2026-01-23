# Dev environment starter
Write-Host "🚀 Стартиране на тестова среда..." -ForegroundColor Green
Write-Host ""

# Kill existing node processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

# Start server in new window
Write-Host "Стартира сървър на localhost:5000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$pwd'; node server.js"

Start-Sleep -Seconds 2

# Start client in new window  
Write-Host "Стартира клиент на localhost:3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$pwd\client'; npm start"

Write-Host ""
Write-Host "✅ Тестова среда стартирана!" -ForegroundColor Green
Write-Host "Сървър: http://localhost:5000" -ForegroundColor Yellow
Write-Host "Клиент: http://localhost:3000" -ForegroundColor Yellow
