@echo off
chcp 65001 >nul
TITLE Yosef Orders - QZ Trust Fix
ECHO.
ECHO Installing Yosef Orders certificate for QZ Tray...
ECHO.

REM Stop QZ Tray if running
taskkill /IM qz-tray.exe /F >nul 2>nul
taskkill /IM javaw.exe /F >nul 2>nul

timeout /t 2 /nobreak >nul

REM Copy certificate to QZ override locations
copy /Y "%~dp0qz-cert.pem" "C:\Program Files\QZ Tray\override.crt" >nul 2>nul
copy /Y "%~dp0qz-cert.pem" "C:\ProgramData\qz\override.crt" >nul 2>nul
if not exist "%APPDATA%\qz" mkdir "%APPDATA%\qz" >nul 2>nul
copy /Y "%~dp0qz-cert.pem" "%APPDATA%\qz\override.crt" >nul 2>nul

ECHO.
ECHO Done. Now open QZ Tray again from Start Menu.
ECHO Then open https://yosef-orders.onrender.com/station.html
ECHO.
PAUSE
