@echo off
title NutriFit AI — Deploy to Vercel
color 0B
echo ======================================================================
echo           NutriFit AI — 1-Click Vercel Cloud Deployment
echo ======================================================================
echo.
echo [1/2] Building frontend for production...
cd /d "%~dp0frontend"
call npm run build

echo.
echo ======================================================================
echo [2/2] Deploying to Vercel...
echo.
echo NOTE: If this is your first time:
echo   1. Vercel will ask to log in (choose "Continue with GitHub" or Email).
echo   2. Approve it in your browser window.
echo   3. Press Enter to accept default options.
echo   4. Your live https://...vercel.app URL will appear on screen!
echo ======================================================================
echo.
npx vercel --prod
echo.
pause
