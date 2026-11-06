@echo off
rem Regression tests of the workbench (review rules etc.); no Maxima needed
cd /d "%~dp0.."
python -m unittest discover -s tests -v
pause
