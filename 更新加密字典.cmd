@echo off
chcp 65001 >nul
cd /d "%~dp0"
pwsh -NoProfile -File "tools\update-encrypted-dictionary.ps1"
echo.
pause
