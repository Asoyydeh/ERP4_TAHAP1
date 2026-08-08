@echo off
title Setup Lengkap dan Peluncur ERP - PT. Modern Jaya Konstruksi
color 0A

echo =======================================================
echo SETUP LENGKAP DAN PELUNCUR ERP AUTOMATIS
echo PT. MODERN JAYA KONTRUKSI
echo =======================================================
echo.

:: 0. Membersihkan Cache Kompilasi Lama Next.js
echo 0. Membersihkan Cache Kompilasi (.next)...
if exist "%~dp0frontend\.next" rd /s /q "%~dp0frontend\.next" >nul 2>&1

:: 1. Memeriksa & Menyalakan Service PostgreSQL Otomatis
echo 1. Memeriksa dan Menyalakan Layanan PostgreSQL...
sc query postgresql-x64-16 | findstr /i "RUNNING" >nul
if %errorlevel% neq 0 (
    net start postgresql-x64-16 >nul 2>&1
)
sc query postgresql-x64-15 | findstr /i "RUNNING" >nul
if %errorlevel% neq 0 (
    net start postgresql-x64-15 >nul 2>&1
)
powershell -Command "Get-Service *postgres* -ErrorAction SilentlyContinue | Start-Service -ErrorAction SilentlyContinue" >nul 2>&1

:: 2. Setup Database & Seed Data Pengguna + Proyek
cd /d %~dp0backend

echo.
echo 2. Menyinkronkan Skema Database PostgreSQL (Prisma DB Push)...
call npx prisma db push --accept-data-loss

echo.
echo 3. Membuat 6 Akun Pengguna Default (Prisma DB Seed)...
call npx prisma db seed

echo.
echo 4. Mengisi Data Dummy Proyek dan Dokumen ERP...
call node seed-10-dummy-projects.js

:: 3. Konfigurasi Port Firewall LAN
echo.
echo 5. Konfigurasi Windows Firewall untuk Akses LAN Kantor...
netsh advfirewall firewall add rule name="ERP_Frontend_3000" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1
netsh advfirewall firewall add rule name="ERP_Backend_5000" dir=in action=allow protocol=TCP localport=5000 >nul 2>&1

:: 4. Dapatkan IP Address LAN Komputer
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" /c:"Alamat IPv4"') do (
    set SERVER_IP=%%a
)
set SERVER_IP=%SERVER_IP: =%

:: 5. Meluncurkan Server Backend & Frontend
echo.
echo 6. Memulai Server Backend (Port 5000) dan Frontend (Port 3000)...
start "ERP Backend Server" cmd /k "cd /d %~dp0backend && npm run dev"
start "ERP Frontend Server" cmd /k "cd /d %~dp0frontend && npm run dev"

:: 6. Buka Browser Otomatis
timeout /t 3 >nul
start http://localhost:3000

echo.
echo =======================================================
echo APLIKASI BERHASIL DI-SETUP DAN DILUNCURKAN!
echo Akses Lokal   : http://localhost:3000
echo Akses LAN     : http://%SERVER_IP%:3000
echo =======================================================
pause
