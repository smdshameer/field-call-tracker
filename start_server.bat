@echo off
title Field Call Tracker Server
echo Starting Field Call Tracker Local Server...
powershell -ExecutionPolicy Bypass -File "%~dp0start_server.ps1"
pause
