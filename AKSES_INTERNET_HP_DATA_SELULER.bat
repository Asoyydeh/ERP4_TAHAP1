@echo off
title AKSES INTERNET DATA SELULER HP - PT MODERN JAYA KONSTRUKSI
color 0A
cls
echo =========================================================================
echo MEMBUAT LINK INTERNET UNTUK HP / DATA SELULER KARYAWAN LUAR KANTOR
echo =========================================================================
echo.
echo Sedang membuat link HTTPS publik gratis via Cloudflare Tunnel...
echo.
echo PENTING: Salin/buka link ASLI yang muncul di dalam kotak di bawah ini!
echo.
echo [JANGAN TUTUP JENDELA INI SELAMA KARYAWAN MENGGUNAKAN APLIKASI DI HP]
echo =========================================================================
echo.

npx -y cloudflared tunnel --http-host-header="localhost:3000" --url http://localhost:3000

pause
