@echo off
setlocal

:: Sync UI files from Readdy download
:: Usage: sync-from-readdy.bat "E:\path\to\readdy\download"

if "%~1"=="" (
    echo Usage: sync-from-readdy.bat "E:\path\to\readdy\download"
    echo.
    echo Example: sync-from-readdy.bat "E:\martha\sandbox\from_readdy"
    exit /b 1
)

node "%~dp0sync-from-readdy.cjs" "%~1"

pause
