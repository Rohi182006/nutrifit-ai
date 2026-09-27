@echo off
title NutriFit AI Desktop Application
echo ========================================================
echo   Launching NutriFit AI Standalone Desktop Application
echo ========================================================
cd /d "%~dp0"
start "" "backend\venv\Scripts\pythonw.exe" desktop_app.py
exit
