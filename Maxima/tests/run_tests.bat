@echo off
rem Runs the offline meclib feedback-function test suite.
rem
rem First launch (no args) relaunches itself with all output redirected
rem to run_tests.log in this folder (see ../tests/.gitignore - that log
rem is never meant to be committed), then waits for a keypress so the
rem window stays open regardless of what happened. The actual logic
rem below only runs on that relaunch, as plain top-level statements (no
rem enclosing block) - a %variable% set and read again a few lines later
rem inside one big "( ... )" block does NOT reliably see its own updated
rem value in cmd.exe (it gets substituted once, when the whole block is
rem parsed) - that silently broke an earlier version of this script: the
rem detection logic for MAXIMA lived inside a block like that, so by the
rem time %MAXIMA% was echoed/used it still read as empty even though
rem "if not defined MAXIMA" correctly saw it as set.
if "%~1"=="" (
  call "%~f0" RUN > "%~dp0run_tests.log" 2>&1
  echo See "%~dp0run_tests.log" for the result.
  echo.
  pause
  exit /b
)

setlocal
cd /d "%~dp0"
echo ==== run_tests.bat started %date% %time% ====

rem Looks for maxima.bat in this order:
rem   1) MAXIMA_OVERRIDE below, if you set it by hand
rem   2) already on PATH
rem   3) typical install locations, version-folder-name independent
rem      (C:\maxima-*, Program Files, Program Files (x86), local AppData)
rem If none of that finds it, set MAXIMA_OVERRIDE below to your maxima.bat's
rem full path (e.g. "C:\maxima-5.48.1\bin\maxima.bat") and re-run.
set "MAXIMA_OVERRIDE="
set "MAXIMA="

if defined MAXIMA_OVERRIDE if exist "%MAXIMA_OVERRIDE%" set "MAXIMA=%MAXIMA_OVERRIDE%"

for /f "delims=" %%P in ('where maxima.bat 2^>nul') do if not defined MAXIMA set "MAXIMA=%%P"

rem "Program Files (x86)"'s literal parentheses are harmless here - this
rem SET is a plain top-level statement, not inside any block.
set "PF86=%ProgramFiles(x86)%"

for /f "delims=" %%N in ('dir /b /ad "C:\maxima-*" 2^>nul') do if not defined MAXIMA if exist "C:\%%N\bin\maxima.bat" set "MAXIMA=C:\%%N\bin\maxima.bat"
for /f "delims=" %%N in ('dir /b /ad "C:\Program Files\maxima-*" 2^>nul') do if not defined MAXIMA if exist "C:\Program Files\%%N\bin\maxima.bat" set "MAXIMA=C:\Program Files\%%N\bin\maxima.bat"
for /f "delims=" %%N in ('dir /b /ad "%PF86%\maxima-*" 2^>nul') do if not defined MAXIMA if exist "%PF86%\%%N\bin\maxima.bat" set "MAXIMA=%PF86%\%%N\bin\maxima.bat"
for /f "delims=" %%N in ('dir /b /ad "%LOCALAPPDATA%\maxima-*" 2^>nul') do if not defined MAXIMA if exist "%LOCALAPPDATA%\%%N\bin\maxima.bat" set "MAXIMA=%LOCALAPPDATA%\%%N\bin\maxima.bat"
for /f "delims=" %%N in ('dir /b /ad "%LOCALAPPDATA%\Programs\maxima-*" 2^>nul') do if not defined MAXIMA if exist "%LOCALAPPDATA%\Programs\%%N\bin\maxima.bat" set "MAXIMA=%LOCALAPPDATA%\Programs\%%N\bin\maxima.bat"

if not defined MAXIMA (
  echo Could not find maxima.bat automatically - it isn't on PATH and wasn't
  echo found under any of the usual install locations.
  echo Edit this file: set MAXIMA_OVERRIDE near the top to the full path of
  echo your maxima.bat, then run this script again.
  exit /b 1
)

echo Using: %MAXIMA%
"%MAXIMA%" --very-quiet -b run_tests.mac
echo ==== run_tests.bat finished %date% %time% ====
