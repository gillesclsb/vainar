@echo off
setlocal
cd /d "%~dp0"
title Vainaar Stoppen

echo Vainaar wordt gestopt...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-vainaar-ports.ps1"
echo.
echo Klaar.
pause
