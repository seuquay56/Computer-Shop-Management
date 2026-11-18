@echo off
chcp 65001 >nul
title TechZone Computer - Seed Demo Database
color 0E

echo ===============================================================================
echo           TECHZONE COMPUTER SHOP - KHOI TAO & SEED DU LIEU DEMO
echo      80 Linh kien, 8 Danh muc, Thong so Specs, Tai khoan & Don hang Mau
echo ===============================================================================
echo.

set "SCRIPT_DIR=%~dp0"
if exist "%SCRIPT_DIR%Code\package.json" (
    set "CODE_DIR=%SCRIPT_DIR%Code"
) else if exist "%SCRIPT_DIR%package.json" (
    set "CODE_DIR=%SCRIPT_DIR%"
) else if exist "%SCRIPT_DIR%Computer-Shop-Management\Code\package.json" (
    set "CODE_DIR=%SCRIPT_DIR%Computer-Shop-Management\Code"
) else (
    echo [ERROR] Khong tim thay thu muc Code!
    pause
    exit /b 1
)

cd /d "%CODE_DIR%"
echo [1/2] Ap dung Database Schema (11 tables)...
call cmd /c npm.cmd run db:init

echo.
echo [2/2] Nap 80 san pham, specs, va tai khoan demo...
call cmd /c npm.cmd run db:seed

echo.
echo ===============================================================================
echo [HOAN TAT] Du lieu demo da duoc khoi tao thanh cong!
echo Nhan phim bat ky de thoat...
echo ===============================================================================
pause >nul
