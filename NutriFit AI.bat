@echo off
title NutriFit AI Desktop Application
cd /d "%~dp0"
start "" "backend\venv\Scripts\pythonw.exe" desktop_app.py
exit
