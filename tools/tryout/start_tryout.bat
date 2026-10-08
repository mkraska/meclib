@echo off
rem Starts the meclib tryout server and opens http://localhost:8765/ in the browser.
rem Needs Python 3 (standard library only). Close this window to stop the server.
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 server.py %*
) else (
  python server.py %*
)
if errorlevel 1 (
  echo.
  echo The server could not be started. Is Python 3 installed and on the PATH?
  pause
)
