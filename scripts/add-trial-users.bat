@echo off
REM Batch Add Trial Users
REM Usage: add-trial-users.bat "path\to\file.csv"

if "%~1"=="" (
    echo Usage: add-trial-users.bat "path\to\file.csv"
    exit /b 1
)

node "%~dp0add-trial-users.cjs" "%~1"
