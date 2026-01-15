@echo off
echo Stopping all Node.js processes...
taskkill /F /IM node.exe 2>nul

echo Waiting for cleanup...
timeout /t 2 /nobreak

echo.
echo All processes stopped!
echo.
echo Now run: start.bat
