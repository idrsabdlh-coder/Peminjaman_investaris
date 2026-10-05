# Website Peminjaman & Inventaris Barang Kantor (Versi Sederhana)
**Berdasarkan PRD v4.0 & DESIGN.md v3.0**

Aplikasi web sistem pencatatan peminjaman inventaris barang kantor yang menggantikan buku catatan konvensional. Dirancang untuk komputer kantor bersama (dual-mode: layar sentuh Kiosk mandiri untuk karyawan tanpa login, dan Panel Administrasi untuk petugas inventaris yang dilindungi login dengan sesi otomatis 15 menit).

---

## 1. Fitur Utama

### Mode Karyawan (Tanpa Login - Layar Kiosk Mandiri)
1. **Katalog & Cek Stok Real-Time**:
   - Menampilkan kode barang, nama, kuantitas total, dan stok tersedia.
   - Barang dengan stok 0 terkunci dan tidak dapat dipilih.
   - Pencarian instan berdasarkan nama atau kode baran2. **Formulir Peminjaman Cepat**:
   - Isian identitas: Nama peminjam, NIK/ID karyawan (wajib), Divisi (wajib), Nomor WhatsApp/Telepon (opsional).
   - Validasi: Tanggal rencana kembali $\ge$ tanggal pinjam; kuantitas pinjam $\le$ stok tersedia; minimal 1 barang; proteksi anti-duplikasi item dalam 1 form.
   - Proteksi klik ganda (*anti-double submit*) dengan token transaksi.
   - Bukti tanda terima digital (*receipt*) yang siap cetak setelah transaksi berhasil.
3. **Pengembalian Mandiri & Privasi Karyawan**:
   - Pencarian peminjaman aktif berbasis NIK karyawan.
   - **Isolasi Privasi**: Tidak menampilkan NIK atau nomor telepon peminjam lain.
   - Pemeriksaan kondisi fisik saat pengembalian:
     - **Baik**: Stok tersedia bertambah kembali.
     - **Rusak**: Stok tersedia bertambah, catatan kerusakan masuk ke riwayat peminjaman untuk perbaikan.
     - **Hilang**: Stok tersedia tidak bertambah dan kuantitas total (*total_qty*) dipotong permanen sesuai jumlah barang yang hilang.
   - Pencegahan pengembalian berulang (*double-return prevention*).

### Mode Panel Admin (Wajib Login Petugas)
1. **Keamanan & Sesi Bersama**:
   - Dilindungi autentikasi email & password.
   - *Auto-logout timer*: Sesi berakhir otomatis setelah 15 menit tanpa aktivitas (`SESSION_LIFETIME=15`).
   - Registrasi publik dimatikan.
2. **Kelola Barang (CRUD Inventaris)**:
   - Tambah barang baru (kode unik, kuantitas total $\ge$ 0; stok tersedia otomatis sama dengan total stok).
   - Ubah detail dan kuantitas barang.
   - Hapus barang dengan proteksi: Jika barang masih memiliki peminjaman aktif yang belum dikembalikan, penghapusan ditolak secara transaksional. Menggunakan mekanisme *soft-delete*.
   - Pencarian dan pagination.
3. **Pemantauan & Koreksi Peminjaman**:
   - Ringkasan KPI di atas tabel: Jumlah Sedang Dipinjam, Jumlah Terlambat (*Overdue*), dan Jumlah Selesai.
   - Filter lengkap: Status peminjaman, filter per barang, rentang tanggal pinjam, dan pencarian teks.
   - Filter cepat satu tombol: **⚡ Belum Dikembalikan** (Dipinjam & Terlambat).
   - Badge status dinamis: **Dipinjam** (biru), **Terlambat** (merah dengan indikator `+X hari terlambat`), **Dikembalikan** (hijau).
   - Modal detail transaksi & fitur **Koreksi Data Peminjaman** oleh admin dengan rekam jejak audit (*audit log*).
4. **Ekspor Laporan PDF Siap Cetak**:
   - **Rekapitulasi Peminjaman (PDF)**: Landscape table, dinamis mengikuti filter status, barang, dan rentang tanggal yang dipilih.
   - **Laporan Barang Belum Dikembalikan (PDF)**: Dokumen khusus peminjaman aktif & jatuh tempo.
   - **Laporan Stok & Status Inventaris (PDF)**: Rekap seluruh aset dan kondisi fisik.
   - Sesuai keputusan sementara: Format tabel bersih dengan judul, periode, dan tanggal/waktu cetak (tanpa kop surat/tanda tangan).
5. **Suite Pengujian Otomatis (Fase 5)**:
   - Runner terintegrasi di panel admin yang mengeksekusi dan memvalidasi test T-5.1 hingga T-5.6 dengan hasil 100% lulus (hijau).

---

## 2. Kredensial Admin Default (Seeder)

- **Email**: `admin@kantor.id`
- **Password**: `password123`
- **Nama**: `Administrator Kantor (Budi Santoso)`

---

## 3. Keputusan Sementara (Berdasarkan PRD)

1. **Pencatatan Barang**: Barang dicatat per kuantitas/jumlah (*quantity*), bukan per nomor seri fisik individual.
2. **Kondisi Hilang**: Saat pengembalian dengan kondisi hilang, stok tersedia (*available_qty*) tidak bertambah dan kuantitas total (*total_qty*) dikurangi sesuai jumlah hilang.
3. **Kondisi Rusak**: Saat pengembalian dengan kondisi rusak, stok tersedia bertambah dan catatan kerusakan disimpan ke riwayat peminjaman.
4. **Format PDF**: Dokumen PDF diformat dalam tabel bersih dengan judul, filter/periode, dan stempel waktu cetak WIB.

---

## 4. Cara Menjalankan & Backup

### Menjalankan Aplikasi
```bash
# Menjalankan server pengembangan (port 3000)
npm run dev

# Membangun aplikasi produksi
npm run build
```

### Cara Backup Database
Data inventaris dan peminjaman tersimpan dengan integritas transaksional snapshot SQLite:
- Untuk mencadangkan data, seluruh state tersimpan pada key penyimpanan lokal `kantor_db_sqlite_v1`.
- Anda juga dapat menggunakan tombol **Reset Database ke Data Seed Awal** pada menu *Pengujian & Validasi* jika ingin kembali ke data simulasi bersih.

---

## 5. Ringkasan Pengujian Fase 5 (Test Suite)

| ID Test | Nama Uji | Kategori | Hasil |
|---|---|---|---|
| **T-5.1** | /admin tanpa login dialihkan ke login | Feature | **PASSED (LULUS)** |
| **T-5.2** | Peminjaman mengurangi stok; melebihi stok ditolak | Feature | **PASSED (LULUS)** |
| **T-5.3** | Pengembalian menambah stok; kondisi hilang potong total stok; cegah kembali ganda | Feature | **PASSED (LULUS)** |
| **T-5.4** | Unit test accessor `display_status` dan `days_late` dihitung dinamis | Unit | **PASSED (LULUS)** |
| **T-5.5** | Barang dengan peminjaman aktif tidak bisa dihapus & soft-delete berfungsi | Feature | **PASSED (LULUS)** |
| **T-5.6** | Isolasi privasi: halaman karyawan tidak menampilkan data peminjam lain | Feature | **PASSED (LULUS)** |
