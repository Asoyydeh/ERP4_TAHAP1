# Pembaruan: Notifikasi Aktivitas Global bergaya Facebook

Saya telah berhasil memindahkan fitur "Notifikasi Aktivitas" (Audit Logs) menjadi menu dropdown di Top Navbar, sehingga lebih mirip dengan lonceng notifikasi di Facebook.

## Perubahan yang Dilakukan
- **Komponen Global (`NotificationsDropdown.tsx`)**: Membuat komponen ikon lonceng yang berada di pojok kanan atas layar (navbar).
- **Indikator Unread (Belum Dibaca)**: Terdapat titik merah (*red dot badge*) berkedip jika ada notifikasi baru sejak terakhir kali dropdown dibuka (menggunakan `localStorage` sementara).
- **Auto-Refresh Berjalan di Balik Layar**: Notifikasi ini mengecek *update* terbaru setiap 15 detik.
- **Klik untuk Navigasi**: Jika baris notifikasi diklik, pengguna akan diarahkan ke halaman yang sesuai (seperti Dashboard, Master Data, atau Users) sesuai dengan jenis aksi.
- **Dashboard Lebih Lega**: Tabel Proyek Utama (Aktivitas Proyek Terbaru) di halaman Dashboard kini mengambil tempat *full-width* secara maksimal karena panel sisi notifikasi dihilangkan, memberikan visibilitas yang jauh lebih baik untuk semua penggunanya.

## Pengujian
Anda dapat memeriksa dan mengujinya dengan:
1. Refresh halaman browser Anda.
2. Coba klik ikon **Lonceng / Bell** di sisi kanan atas layar dekat menu ganti tema (Sun/Moon).
3. Anda akan melihat animasi *dropdown* muncul menampilkan log aktivitas pengguna. 
4. Jika notifikasi diklik, ia akan tertutup dan sistem mencoba mengarahkan halaman Anda sesuai konteks (*Dashboard*, *Master Data*, dsb).
