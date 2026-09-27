@echo off
title NutriFit AI - Public URL Tunnel
color 0A
echo ======================================================================
echo           NutriFit AI — Public Internet Tunnel Service
echo ======================================================================
echo.
echo Fetching your one-time Tunnel Access Password (Public IP)...
for /f "tokens=*" %%a in ('curl -s https://loca.lt/mytunnelpassword') do set TUNNEL_PASS=%%a
echo Tunnel Access Password: %TUNNEL_PASS%
echo (When prompted in the browser by localtunnel, paste this password to continue)
echo.
echo ======================================================================
echo Starting tunnel to local port 3000...
echo ======================================================================
echo.
npx localtunnel --port 3000 --subdomain nutrifit-hub
pause
