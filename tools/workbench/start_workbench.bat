@echo off
rem Starts the meclib workbench server and opens http://localhost:8765/ in the browser.
rem A workbench server that is still running is stopped first, so starting again always
rem gives a fresh server with the current code. Close this window to stop the server.
rem Needs Python 3 (standard library only).
cd /d "%~dp0"
set PY=
where py >nul 2>nul && set PY=py -3
if not defined PY where python >nul 2>nul && set PY=python
if not defined PY (
  echo Python 3 was not found. Install it from https://www.python.org/ and start again.
  pause
  exit /b 1
)
%PY% server.py %*
if errorlevel 1 (
  echo.
  echo The workbench server stopped with an error, see the messages above.
  pause
)
