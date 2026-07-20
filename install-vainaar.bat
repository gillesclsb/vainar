@echo off
setlocal
cd /d "%~dp0"
title Vainaar Modules Installeren

echo.
echo =====================================
echo      VAINAAR MODULES INSTALLEREN
echo =====================================
echo.

if not exist package.json (
  echo FOUT: package.json niet gevonden.
  pause
  exit /b 1
)

if exist node_modules (
  echo Oude modules worden verwijderd...
  rmdir /s /q node_modules
)

if exist package-lock.json (
  del /f /q package-lock.json
)

echo Nieuwe modules voor Node.js worden geinstalleerd...
call npm install --no-audit --no-fund

if errorlevel 1 (
  echo.
  echo Installatie mislukt.
  echo Controleer je internetverbinding en Node.js-installatie.
  pause
  exit /b 1
)

> .vainaar-deps-version echo 2.1-node24
echo.
echo Installatie voltooid.
pause
