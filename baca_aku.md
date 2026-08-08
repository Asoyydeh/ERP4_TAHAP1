Rencana Implementasi Lengkap Revisi Aplikasi ERP Asset Management
Dokumen ini berisi rencana teknis rinci berdasarkan berkas 
revisi.md
 dan Diagram Struktur Hirarki Folder Whiteboard untuk Role Proyek Admin.

User Review Required
IMPORTANT

Struktur Folder Baru Proyek Admin (Sesuai Diagram Whiteboard):

Folder Klien (1. KLIEN): Berisi berkas utama (SPK, BOQ, Drawing) serta fitur pembuatan Subfolder Termin Klien (contoh: INV DP 50%, INV Termin 1 45%). Setiap folder termin dapat menampung berkas: Invoice, Faktur, Drawing, Foto, Tanda Terima, dan BAST.
Folder Subkon (2. SUBCON): Berisi subfolder vendor (1. Subcon 001, 2. Subcon 002) yang di dalamnya terdapat berkas SPK Subkon serta subfolder penagihan PR T1, PR T2, dst.
Folder Internal (3. INTERNAL 6M): Berisi dokumen teknis internal.
Proposed Changes
1. [Role Engineering] UI & Hak Akses Dokumen
[MODIFY] 
Sidebar.tsx
Hapus/sembunyikan menu Hasil Kerjaaan dari navigasi sidebar untuk role Engineering (dan role lain yang tidak memerlukan).
[MODIFY] 
DocumentExplorer.tsx
 / 
projects/page.tsx
Tambahkan Fitur Pencarian File Global (Search File Contents) di bagian luar folder pada Menu Proyek (Folder Explorer), sehingga user dapat mencari nama file secara langsung tanpa harus membuka subfolder satu per satu.
[MODIFY] 
dashboard/page.tsx
 / 
assets/page.tsx
Tombol + Tambah Laporan di Dashboard sudah dihilangkan untuk role Engineering.
Tambahkan izin unggah berkas A1 (SPK Client) dan dokumen pelengkap bagi role Engineering.
Pada Modal Upload Penawaran: ganti label input "Nama Vendor" menjadi "Nama PT Client".
Masukkan Penawaran Klien (Penawaran Draft / C4) ke dalam Folder Internal.
2. [Role Processing / Procurement] Dashboard & Izin Download
[MODIFY] 
ProcurementDashboard.tsx
Tambahkan kolom manual No SPK (manual) pada tabel Dashboard Procurement.
[MODIFY] 
dashboard/page.tsx
 / 
assets/page.tsx
Tambahkan izin download untuk tipe berkas C6 (Forecast Cost Estimasi) pada role Procurement.
3. [Role Finance] Tabel Dashboard & Hak Download Lengkap
[MODIFY] 
FinanceDashboard.tsx
Sempurnakan susunan kolom tabel Finance Dashboard sesuai spesifikasi: Kode Proyek | Nama Client | Nama Proyek | Nilai Kontrak | Awal Kontrak | Timeline | Akhir Kontrak | Status | Progress | BOQ | Invoice | TERMIN | NILAI | PPH | GRAND TOTAL | Status Penagihan | Remarks | Issue | Remark.
[MODIFY] 
dashboard/page.tsx
 / 
assets/page.tsx
Tambahkan izin download untuk role Finance pada dokumen berikut:
A2 Penawaran Final (PDF Scan)
A4 Invoice
B1 Subkon Docs (SPK, Invoice, RFQ Final)
B2 RFQ Scan Kosong
4. [Role Proyek Admin] Struktur Folder Hirarki Whiteboard & Upload Berkas
[MODIFY] 
DocumentExplorer.tsx
 / 
projects/page.tsx
Implementasikan struktur hirarki folder proyek untuk Proyek Admin:
1. KLIEN:
Dokumen Utama: SPK Client (A1), BOQ (C5), Drawing (A3).
Fitur Tambah Folder Termin Klien (INV DP 50%, INV Termin 1 45%, dst.).
Slot unggah berkas per-Termin: Invoice, Faktur, Drawing, Foto, Tanda Terima, BAST.
2. SUBCON:
Subfolder Vendor (1. Subcon 001, 2. Subcon 002, dst.).
Slot unggah di dalam folder subkon: SPK Subkon, serta subfolder penagihan PR T1, PR T2, dst. (SPK, Invoice, RFQ Final).
3. INTERNAL (6M):
Tempat unggah dan simpan dokumen internal proyek.
[MODIFY] 
ProyekAdminDashboard.tsx
Izinkan Proyek Admin untuk mengunggah dan mengedit berkas A1 SPK Client, C5 BOQ Internal, dan A3 Drawing Client.
Verification Plan
Manual Verification
Verifikasi Role Engineering:
Login ENGINEERING → Cek menu Hasil Kerjaaan hilang dari sidebar.
Cek pencarian nama file dari luar folder pada menu Proyek.
Cek modal upload Penawaran menggunakan label "Nama PT Client".
Verifikasi Role Procurement:
Login PROCUREMENT → Cek kolom No SPK (manual) di tabel dashboard.
Test download dokumen C6 (Forecast Cost).
Verifikasi Role Finance:
Login FINANCE → Cek kelengkapan kolom tabel Finance Dashboard.
Test download dokumen A2, A4, B1, dan B2.
Verifikasi Role Proyek Admin:
Login PROYEK_ADMIN → Buka menu Proyek / Explorer.
Test buat folder Termin Klien (misal: INV DP 50%) dan upload berkas (Invoice, Faktur, Drawing, Foto, Tanda Terima, BAST).
Test navigasi folder Subkon (Subcon 001 -> PR T1 / PR T2).
Verifikasi Kompilasi Kode:
Jalankan npx tsc --noEmit pada frontend dan backend.