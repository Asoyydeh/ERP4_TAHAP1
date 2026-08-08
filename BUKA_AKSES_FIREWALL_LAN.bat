@echo off
title Konfigurasi Firewall ERP Asset Management - PT. Modern Jaya Konstruksi
color 0B

:: Check for Administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Meminta hak akses Administrator untuk membuka firewall...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo =======================================================
echo MENGIZINKAN AKSES FIREWALL UNTUK KARYAWAN (LAN & WI-FI)
echo PT. MODERN JAYA KONTRUKSI
echo =======================================================
echo.
echo Sedang membuka Port 3000 (Frontend) & Port 5000 (Backend API) untuk semua profil (Public/Private)...
echo.

netsh advfirewall firewall delete rule name="ERP_Frontend_3000" >nul 2>&1
netsh advfirewall firewall delete rule name="ERP_Backend_5000" >nul 2>&1

netsh advfirewall firewall add rule name="ERP_Frontend_3000" dir=in action=allow protocol=TCP localport=3000 profile=any
netsh advfirewall firewall add rule name="ERP_Backend_5000" dir=in action=allow protocol=TCP localport=5000 profile=any

echo.
echo =======================================================
echo ✅ PENGATURAN FIREWALL BERHASIL!
echo Port 3000 dan Port 5000 telah terbuka penuh.
echo HP dan Laptop rekan kantor sekarang BISA LOGIN dan klik akun demo!
echo =======================================================
pause
