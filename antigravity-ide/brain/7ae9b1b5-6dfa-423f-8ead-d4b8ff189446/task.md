# Pindah Notifikasi Aktivitas ke Top Bar

- [x] Membuat file komponen `c:\PROJECT\assetmenagemen\frontend\src\components\NotificationsDropdown.tsx`
- [x] Implementasi UI Dropdown bergaya Facebook (dengan bell icon, red badge counter, dan list aktivitas)
- [x] Menambahkan logika navigasi: Saat diklik, arahkan ke `/dashboard` atau `/projects` jika `tableName === 'projects'`, ke `/master-data` jika `tableName` terkait master data.
- [x] Memodifikasi `c:\PROJECT\assetmenagemen\frontend\src\app\(dashboard)\layout.tsx` untuk memasukkan komponen `NotificationsDropdown` di header.
- [x] Memodifikasi `c:\PROJECT\assetmenagemen\frontend\src\app\(dashboard)\dashboard\page.tsx`:
  - Menghapus panel `Notifikasi Aktivitas` dari sisi kanan.
  - Memperlebar `AllProyekTable` menjadi memakan seluruh baris (`lg:col-span-4`).
- [ ] Menambahkan file `walkthrough.md` untuk merangkum perubahan yang dibuat.
