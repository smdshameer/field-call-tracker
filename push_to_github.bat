@echo off
setlocal enabledelayedexpansion
title KS Smart Solutions - Push to GitHub & Deploy Cloudflare

echo ==============================================================================
echo   KS SMART SOLUTIONS & TAMIL NADU SCHOOL EDUCATION PROJECT
echo   Auto GitHub Push & Cloudflare Worker Live Deployment Tool
echo ==============================================================================
echo.

:: Detect Git Executable
set "GIT_CMD=git"
if exist "C:\Program Files\Git\cmd\git.exe" (
    set "GIT_CMD=C:\Program Files\Git\cmd\git.exe"
) else if exist "C:\Users\acer\AppData\Local\Programs\Git\cmd\git.exe" (
    set "GIT_CMD=C:\Users\acer\AppData\Local\Programs\Git\cmd\git.exe"
) else if exist "C:\Users\acer\AppData\Local\MinGit\cmd\git.exe" (
    set "GIT_CMD=C:\Users\acer\AppData\Local\MinGit\cmd\git.exe"
)

echo [*] Using Git at: "!GIT_CMD!"
"!GIT_CMD!" --version
echo.

:: Change directory to project root
cd /d "%~dp0"

:: Step 1: Re-bundle standalone worker.js
echo [*] Bundling standalone Cloudflare Worker package...
if exist "scratch\bundle_worker.ps1" (
    powershell -ExecutionPolicy Bypass -File "scratch\bundle_worker.ps1"
)
echo.

:: Step 2: Stage all changes
echo [*] Staging files for Git commit...
"!GIT_CMD!" add .

:: Step 3: Get Commit Message or Default
set "COMMIT_MSG=%~1"
if "%COMMIT_MSG%"=="" (
    set "COMMIT_MSG=Update Field Call Tracker - %DATE% %TIME%"
)

echo [*] Committing with message: "%COMMIT_MSG%"
"!GIT_CMD!" commit -m "%COMMIT_MSG%"

:: Step 4: Push to GitHub
echo.
echo [*] Pushing latest changes to GitHub (smdshameer/field-call-tracker)...
"!GIT_CMD!" push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==============================================================================
    echo   [SUCCESS] Code successfully pushed to GitHub!
    echo   Cloudflare Worker will automatically redeploy live within 10-15 seconds.
    echo   Live URL: https://field-call-tracker.smssiddiq2011.workers.dev
    echo ==============================================================================
) else (
    echo.
    echo [!] Standard push failed. Attempting force push...
    "!GIT_CMD!" push --force origin main
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo [SUCCESS] Force push completed successfully!
    ) else (
        echo.
        echo [ERROR] Push failed. Please check your internet connection or git credentials.
    )
)

echo.
pause
