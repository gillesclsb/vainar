@echo off
setlocal
cd /d "%~dp0"
title Vainaar v2

echo.
echo =====================================
echo           VAINAAR STARTEN
echo =====================================
echo.

if not exist package.json (
  echo FOUT: package.json niet gevonden.
  echo Pak het ZIP-bestand eerst volledig uit.
  pause
  exit /b 1
)

if not exist data mkdir data

echo Oude Vainaar-processen controleren...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-vainaar-ports.ps1"
timeout /t 1 /nobreak >nul

set NEED_INSTALL=0
if not exist node_modules set NEED_INSTALL=1
if not exist .vainaar-deps-version set NEED_INSTALL=1

if "%NEED_INSTALL%"=="1" (
  echo.
  echo Modules moeten eenmalig worden geinstalleerd...
  if exist node_modules rmdir /s /q node_modules
  if exist package-lock.json del /f /q package-lock.json

  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo.
    echo Installatie mislukt.
    echo Voer install-vainaar.bat uit om het opnieuw te proberen.
    pause
    exit /b 1
  )

  > .vainaar-deps-version echo 2.1-node24
)

echo.
echo Backend starten...
start "Vainaar Backend" cmd /k "cd /d ""%~dp0"" && npm run server"
timeout /t 4 /nobreak >nul

echo Frontend starten...
start "Vainaar Frontend" cmd /k "cd /d ""%~dp0"" && npm run frontend"
timeout /t 4 /nobreak >nul

start http://localhost:5173

echo.
echo Vainaar is gestart.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3000
echo.
echo Laat de backend en frontend vensters open.
pause
