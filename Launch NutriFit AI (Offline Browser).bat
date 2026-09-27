@echo off
title NutriFit AI — Offline Web Application Launcher
echo ======================================================================
echo   Launching NutriFit AI in Offline Browser Mode (No Internet Needed)
echo ======================================================================
cd /d "%~dp0"

echo Starting offline services and opening URL link: http://localhost:3000 ...
"backend\venv\Scripts\python.exe" run_offline_web.py
pause
