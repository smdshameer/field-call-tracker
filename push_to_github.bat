@echo off
title Push Field Call Tracker to GitHub
color 0A
echo ============================================================
echo      KS SMART SOLUTIONS - PUSH TO GITHUB AUTOMATION
echo ============================================================
echo.

set "GIT_CMD=git"
where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    if exist "C:\Users\acer\AppData\Local\MinGit\cmd\git.exe" (
        set "GIT_CMD=C:\Users\acer\AppData\Local\MinGit\cmd\git.exe"
    ) else (
        color 0C
        echo [ERROR] Git is not found.
        pause
        exit /b 1
    )
)

echo [1/4] Initializing Git repository...
if not exist ".git" (
    "%GIT_CMD%" init
    "%GIT_CMD%" branch -M main
)

echo.
echo [2/4] Staging and committing all project files...
"%GIT_CMD%" config user.name "smdshameer"
"%GIT_CMD%" config user.email "smssiddiq2011@gmail.com"
"%GIT_CMD%" add .
"%GIT_CMD%" commit -m "Update password reset and standalone worker"

echo.
echo [3/4] Linking GitHub Remote (smdshameer/field-call-tracker)...
"%GIT_CMD%" remote remove origin >nul 2>nul
"%GIT_CMD%" remote add origin https://github.com/smdshameer/field-call-tracker.git
"%GIT_CMD%" branch -M main

echo.
echo [4/4] Pushing to GitHub (main branch)...
"%GIT_CMD%" push -u origin main

if %ERRORLEVEL% equ 0 (
    color 0A
    echo.
    echo ============================================================
    echo   SUCCESS! Your software is pushed to GitHub!
    echo ============================================================
    echo.
    echo Next Steps to deploy on Cloudflare Pages or Vercel:
    echo 1. Cloudflare Pages (UNLIMITED Bandwidth & 100%% Uptime):
    echo    - Go to https://dash.cloudflare.com
    echo    - Click Workers & Pages -> Create -> Pages -> Connect to Git
    echo    - Select your repository and click Deploy!
    echo.
    echo 2. Vercel:
    echo    - Go to https://vercel.com
    echo    - Click Add New -> Project -> Import your repo -> Deploy!
    echo.
) else (
    color 0C
    echo.
    echo [NOTE] If push failed due to authentication, please ensure you are
    echo logged into your GitHub account or have created the repo on GitHub first.
    echo.
)

pause
