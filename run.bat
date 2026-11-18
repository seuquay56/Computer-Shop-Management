@echo off
chcp 65001 >nul
title TechZone Computer - Management & Storefront Web Server
color 0B

echo ===============================================================================
echo        TECHZONE COMPUTER SHOP - MANAGEMENT & STOREFRONT SYSTEM
echo                  Do An Cuoi Ky - SE Final Report
echo ===============================================================================
echo.

:: Determine Code directory
set "SCRIPT_DIR=%~dp0"
if exist "%SCRIPT_DIR%Code\src\server.js" (
    set "CODE_DIR=%SCRIPT_DIR%Code"
) else if exist "%SCRIPT_DIR%src\server.js" (
    set "CODE_DIR=%SCRIPT_DIR%"
) else if exist "%SCRIPT_DIR%Computer-Shop-Management\Code\src\server.js" (
    set "CODE_DIR=%SCRIPT_DIR%Computer-Shop-Management\Code"
) else (
    echo [ERROR] Khong tim thay thu muc Code chua src\server.js!
    pause
    exit /b 1
)

:: Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] May ban chua cai dat Node.js hoac chua them vao PATH!
    echo Vui long cai dat Node.js tu: https://nodejs.org
    pause
    exit /b 1
)

:: Check PostgreSQL service
sc query postgresql-x64-16 >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] PostgreSQL service dang hoat dong san sang.
)

echo.
echo ===============================================================================
echo                     THONG TIN TAI KHOAN DEMO (SEED SAN)
echo ===============================================================================
echo   [1] ADMIN (Quan tri vien):
echo       - Tai khoan : admin
echo       - Mat khau  : AdminSecurePassword123!
echo       - Vai tro   : Dashboard Doanh thu (TV1), Phan quyen RBAC, Kho hang (TV4)
echo.
echo   [2] STAFF (Nhan vien ban hang):
echo       - Tai khoan : demo_staff
echo       - Mat khau  : StaffPassword123!
echo       - Vai tro   : Quan ly San pham & Specs (TV2), Duyet & Dong goi Don hang (TV3)
echo.
echo   [3] CUSTOMER (Khach hang mua sam):
echo       - Tai khoan : demo_customer
echo       - Mat khau  : DemoCustomer123!
echo       - Hoac vao truc tiep voi che do Khach vang lai (Guest)
echo ===============================================================================
echo.
echo [INFO] Dang khoi dong Web Server tai http://localhost:5000 ...
echo [INFO] Trinh duyet se tu dong mo sau 2 giay...
echo.

:: Auto open default browser in background
start "" cmd /c "ping 127.0.0.1 -n 3 >nul & start http://localhost:5000"

:: Start the Express Server
cd /d "%CODE_DIR%"
node src/server.js

pause
