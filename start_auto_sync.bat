@echo off
title KS Smart Solutions - Continuous Auto-Push Daemon
cd /d "%~dp0"

echo ==============================================================================
echo   KS SMART SOLUTIONS & TAMIL NADU SCHOOL EDUCATION PROJECT
echo   Continuous Automatic Git & Cloudflare Auto-Sync Service
echo ==============================================================================
echo.
echo [*] Starting background file watcher...
echo [*] Every edit you make will be automatically compiled, committed, and pushed!
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "auto_git_sync.ps1"

pause
