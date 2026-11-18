@echo off
chcp 65001 >nul
title TechZone Computer - Automated Test Suite (Jest)
color 0A

echo ===============================================================================
echo           TECHZONE COMPUTER SHOP - AUTOMATED TEST SUITE (JEST)
echo             52 Tests (5 Test Suites) - Unit & Integration Tests
echo ===============================================================================
echo.

:: Determine Code directory
set "SCRIPT_DIR=%~dp0"
if exist "%SCRIPT_DIR%Code\package.json" (
    set "CODE_DIR=%SCRIPT_DIR%Code"
) else if exist "%SCRIPT_DIR%package.json" (
    set "CODE_DIR=%SCRIPT_DIR%"
) else if exist "%SCRIPT_DIR%Computer-Shop-Management\Code\package.json" (
    set "CODE_DIR=%SCRIPT_DIR%Computer-Shop-Management\Code"
) else (
    echo [ERROR] Khong tim thay thu muc Code chua package.json!
    pause
    exit /b 1
)

cd /d "%CODE_DIR%"
echo [INFO] Dang chay Jest Test Suite...
echo.
cmd /c npm.cmd test

echo.
echo ===============================================================================
echo [HOAN TAT] Kiem tra ket qua test ben tren.
echo Nhan phim bat ky de thoat...
echo ===============================================================================
pause >nul
