@echo off
rem Double-click this file to open the dashboard. It needs no internet.
rem It serves the built site from this laptop and opens it in the browser.
rem Close this window (or press Ctrl+C) to stop it.

cd /d "%~dp0web"

if not exist node_modules (
  echo The libraries are missing. Run "npm install" in the web folder once, with internet.
  pause
  exit /b 1
)

if not exist dist (
  echo Building the site for the first time...
  call npm run build
)

echo.
echo Opening the dashboard. Keep this window open while you use it.
call npm run preview -- --open
