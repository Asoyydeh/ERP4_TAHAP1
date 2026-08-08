@echo off
title Setup Database Offline - PT. Modern Jaya Konstruksi
color 0B

echo =======================================================
echo SETUP DATABASE POSTGRESQL dan DATA DUMMY ERP
echo PT. MODERN JAYA KONTRUKSI
echo =======================================================
echo.

cd /d %~dp0backend

echo 1. Melakukan Sinkronisasi Skema Database (Prisma DB Push)...
call npx prisma db push --accept-data-loss

echo.
echo 2. Membuat Akun Pengguna Default (Prisma DB Seed)...
call npx prisma db seed

echo.
echo 3. Pengisian Data Dummy dan Akun User Role...
call node seed-10-dummy-projects.js

echo.
echo =======================================================
echo ✅ Database berhasil di-setup dan diisi data dummy!
echo =======================================================
pause
