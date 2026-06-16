@echo off
title Yosef Orders - QZ Trust Fix v4
cd /d "%~dp0"
echo Installing Yosef Orders v4 certificate for QZ Tray...
if not exist "%ProgramData%\qz" mkdir "%ProgramData%\qz"
copy /Y "override.crt" "%ProgramData%\qz\override.crt" >nul
copy /Y "override.crt" "%ProgramData%\qz\root-ca.crt" >nul
echo.
echo Done.
echo IMPORTANT:
echo 1. Right click QZ Tray icon near clock and choose Exit.
echo 2. Open QZ Tray again from Start Menu.
echo 3. Open https://yosef-orders.onrender.com/station.html
echo.
pause
