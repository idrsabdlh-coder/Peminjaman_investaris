# Website Peminjaman & Inventaris Barang Kantor (Versi Sederhana)

**Berdasarkan PRD v4.0 & DESIGN.md v3.0**

Aplikasi web pencatatan peminjaman inventaris barang kantor yang menggantikan buku catatan. Dirancang untuk komputer kantor bersama dengan dua mode: layar sentuh Kiosk untuk karyawan tanpa login, dan Panel Admin untuk petugas inventaris yang dilindungi login.

## Teknologi

- **Frontend**: React + TypeScript, dijalankan dengan Vite (port 3000)
- **Backend**: Node.js + Express (port 3001)
- **Database**: SQLite lewat `better-sqlite3`, tersimpan di file `database.sqlite`

## 1. Fitur Utama

### Mode Karyawan (Tanpa Login, Layar Kiosk)

1. **Katalog & Cek Stok**
   - Menampilkan nama barang dan stok tersedia.
   - Barang dengan stok 0 tidak dapat dipilih.
   - Pencarian instan berdasarkan nama barang.
2. **Formulir Peminjaman**
   - Isian: nama peminjam, divisi, nomor telepon (opsional), tanggal pinjam, dan rencana kembali.
   - Validasi: tanggal kembali tidak boleh sebelum tanggal pinjam, jumlah tidak melebihi stok, minimal 1 barang, item yang sama tidak boleh ganda dalam satu form.
   - Bukti tanda terima yang siap cetak setelah peminjaman berhasil.
3. **Pengembalian Mandiri**
   - Hanya menampilkan peminjaman aktif milik peminjam itu sendiri, tanpa data peminjam lain.
   - Pemeriksaan kondisi saat pengembalian:
     - **Baik**: stok tersedia bertambah kembali.
     - **Rusak**: stok tersedia bertambah dan kerusakan tercatat di riwayat.
     - **Hilang**: stok tersedia tidak bertambah dan jumlah total barang berkurang permanen.
   - Pengembalian ganda ditolak.

### Mode Panel Admin (Wajib Login)

1. **Keamanan**
   - Login dengan email dan password.
   - Sesi berakhir otomatis setelah 15 menit tanpa aktivitas.
   - Tidak ada registrasi publik.
2. **Kelola Barang**
   - Tambah, ubah, dan hapus barang.
   - Stok tersedia otomatis sama dengan jumlah total saat barang ditambahkan.
   - Barang yang masih dipinjam tidak bisa dihapus.
   - Penghapusan memakai *soft-delete* (data tetap tersimpan).
   - Pencarian dan pagination.
3. **Pemantauan & Koreksi Peminjaman**
   - Ringkasan: jumlah sedang dipinjam, terlambat, dan selesai.
   - Filter: status, barang, rentang tanggal, dan pencarian teks.
   - Tombol cepat **Belum Dikembalikan** (dipinjam dan terlambat).
   - Badge status: Dipinjam (biru), Terlambat (merah, dengan jumlah hari terlambat), Dikembalikan (hijau).
   - Koreksi data peminjaman oleh admin, dengan alasan wajib diisi dan dicatat sebagai riwayat koreksi.
4. **Ekspor Laporan PDF**
   - Rekapitulasi peminjaman (mengikuti filter yang dipilih).
   - Laporan barang belum dikembalikan.
   - Laporan stok dan kondisi inventaris.
   - Format tabel sederhana berisi judul, periode, dan waktu cetak (tanpa kop surat dan tanda tangan).

## 2. Akun Admin Default

- **Email**: `admin@kantor.id`
- **Password**: `password123`

> Akun ini hanya untuk pengembangan. Ganti sebelum dipakai sungguhan. Saat ini login masih dicek di sisi browser, belum di server.

## 3. Keputusan Desain

1. Barang dicatat per jumlah (*quantity*), bukan per nomor seri.
2. Pengembalian berstatus hilang: stok tersedia tidak bertambah, total barang dikurangi.
3. Pengembalian berstatus rusak: stok tersedia bertambah dan catatan kerusakan disimpan.
4. Aplikasi dijalankan di jaringan lokal kantor (tidak di-deploy ke hosting), sehingga dipilih SQLite.

## 4. Cara Menjalankan

Instal dependensi sekali saja:

```bash
npm install
```

Jalankan **dua terminal sekaligus**:

```bash
# Terminal 1: backend + database (port 3001)
node server.js

# Terminal 2: frontend (port 3000)
npm run dev
```

Buka `http://localhost:3000`. Dari komputer lain di jaringan yang sama, buka `http://<IP-komputer-server>:3000`. Jika tidak bisa terbuka, izinkan port 3000 dan 3001 di Windows Firewall.

Untuk build produksi:

```bash
npm run build
```

## 5. Backup Data

Seluruh data peminjaman dan barang tersimpan di satu file, yaitu `database.sqlite` di folder utama proyek. Untuk backup, salin file itu secara berkala (matikan `server.js` dulu agar aman). File ini tidak ikut ke GitHub karena berisi data asli.

## 6. Struktur Proyek

| Lokasi | Fungsi |
|---|---|
| `src/` | Seluruh tampilan React (kiosk dan panel admin) |
| `src/services/db.ts` | Logika peminjaman dan stok, serta sinkronisasi data ke server |
| `src/types.ts` | Definisi tipe data |
| `server.js` | API Express yang menyimpan data ke SQLite |
| `database.sqlite` | File database (dibuat otomatis, tidak masuk Git) |

## 7. Pengujian

Skenario uji yang menjadi acuan (jalankan ulang setelah perubahan besar):

| ID | Skenario |
|---|---|
| T-5.1 | Halaman admin tanpa login dialihkan ke halaman login |
| T-5.2 | Peminjaman mengurangi stok; melebihi stok ditolak |
| T-5.3 | Pengembalian menambah stok; kondisi hilang memotong total; pengembalian ganda ditolak |
| T-5.4 | Status tampilan dan jumlah hari terlambat dihitung dinamis |
| T-5.5 | Barang dengan peminjaman aktif tidak bisa dihapus; soft-delete berfungsi |
| T-5.6 | Halaman karyawan tidak menampilkan data peminjam lain |