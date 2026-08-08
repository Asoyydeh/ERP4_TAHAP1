@echo off
title ERP Asset Management (MODE PRODUKSI / HIGH-PERFORMANCE) - PT. Modern Jaya Konstruksi
color 0B

echo =======================================================
echo 🚀 MEMULAI APLIKASI ERP MODE PRODUKSI (MAX STABILITY & SPEED)
echo 🏢 PT. MODERN JAYA KONSTRUKSI
echo =======================================================
echo.

:: Dapatkan IP Address Lokal PC Server
set SERVER_IP=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" /c:"Alamat IPv4"') do (
    if not defined SERVER_IP set SERVER_IP=%%a
)
if defined SERVER_IP set SERVER_IP=%SERVER_IP: =%

echo [INFO] IP Address Laptop Server Kantor: %SERVER_IP%
echo [INFO] Menyiapkan Build Produksi Next.js & Node.js Backend...
echo.

echo 1. Memulai Backend Express Server (Port 5000)...
start "ERP Backend Production" cmd /k "cd /d %~dp0backend && npm run build && npm run start"

echo 2. Memulai Frontend Next.js Production Server (Port 3000)...
start "ERP Frontend Production" cmd /k "cd /d %~dp0frontend && npm run build && npm run start"

echo.
echo =======================================================
echo ✅ Mode Produksi Siap! Performa & Akses Bersamaan Maksimal!
echo 🌐 Akses Lokal: http://localhost:3000
echo 🌐 Akses Rekan Kantor: http://%SERVER_IP%:3000
echo =======================================================
pause
