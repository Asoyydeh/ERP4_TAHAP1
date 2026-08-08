@echo off
title ERP Asset Management - PT. Modern Jaya Konstruksi
color 0A

echo =======================================================
echo 🚀 MEMULAI APLIKASI ERP ASSET MANAGEMENT (LAN & KANTOR)
echo 🏢 PT. MODERN JAYA KONSTRUKSI
echo =======================================================
echo.

:: Dapatkan IP Address Lokal PC Server dari Wi-Fi / Ethernet
set SERVER_IP=
for /f "usebackq tokens=*" %%a in (`powershell -Command "Get-NetIPAddress -InterfaceAlias 'Wi-Fi*','Ethernet*' -AddressFamily IPv4 | Select-Object -ExpandProperty IPAddress ^| Select-Object -First 1"`) do (
    set SERVER_IP=%%a
)

if not defined SERVER_IP (
    for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" /c:"Alamat IPv4"') do (
        if not defined SERVER_IP set SERVER_IP=%%a
    )
)
if defined SERVER_IP set SERVER_IP=%SERVER_IP: =%

echo [INFO] IP Address Laptop Server Kantor Anda Saat Ini: %SERVER_IP%
echo.
echo 📢 PETUNJUK UNTUK REKAN KANTOR:
echo 1. Pastikan laptop/HP teman kantor terhubung ke Wi-Fi / LAN yang sama.
echo 2. Minta teman kantor membuka browser (Chrome/Edge/Safari) dan mengetik:
echo 👉 http://%SERVER_IP%:3000
echo.

echo 1. Memulai Backend Express Server (Port 5000)...
start "ERP Backend Server" cmd /k "cd /d %~dp0backend && npm run dev"

echo 2. Memulai Frontend Next.js Server (Port 3000)...
start "ERP Frontend Server" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo =======================================================
echo ✅ Aplikasi berhasil diluncurkan!
echo 🌐 Akses Lokal Laptop Anda: http://localhost:3000
echo 🌐 Akses Rekan Kantor (LAN): http://%SERVER_IP%:3000
echo =======================================================
pause
