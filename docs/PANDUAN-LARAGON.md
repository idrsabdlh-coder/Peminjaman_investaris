# Panduan Laragon untuk Pemula

Panduan ini menjelaskan cara memakai Laragon sebagai **tempat MySQL berjalan** untuk proyek Peminjaman & Inventaris Tim IT. Ditulis untuk yang baru pertama memakai Laragon.

> Nama menu dan tombol dapat sedikit berbeda antar versi Laragon. Bila tidak menemukan yang disebut di sini, cari yang paling mirip, dan andalkan pemeriksaan lewat perintah (`SELECT VERSION();`, `mysql -u ...`) yang hasilnya sama di semua versi.

## 1. Apa itu Laragon, dan apa yang dipakai proyek ini

Laragon adalah paket lingkungan pengembangan untuk Windows. Satu aplikasi berisi server web (Apache atau Nginx), MySQL atau MariaDB, PHP, Node.js, dan alat bantu lain. Ia mengatur semuanya agar bisa dinyalakan dengan satu tombol.

**Proyek ini hanya memakai MySQL dari Laragon.** Server aplikasinya adalah Express (Node.js), jadi Apache atau Nginx tidak diperlukan.

| Bagian proyek | Dijalankan oleh |
|---|---|
| MySQL (basis data) | Laragon |
| Backend Express (port 3001) | `node server.js` atau `npm run dev` dari terminal |
| Frontend React (port 3000) | `npm run dev` dari terminal |

## 2. Mengenal jendela Laragon

Setelah dibuka, jendela utama Laragon biasanya memiliki tombol berikut:

| Tombol | Fungsi |
|---|---|
| **Start All** / **Stop** | Menyalakan atau mematikan semua layanan yang aktif |
| **Database** | Membuka **HeidiSQL**, aplikasi untuk melihat dan mengelola basis data |
| **Terminal** | Membuka terminal yang sudah mengenal `mysql`, `mysqldump`, dan `node` |
| **Menu** (atau klik kanan ikon Laragon di pojok kanan bawah layar) | Pengaturan layanan, versi MySQL, dan berkas konfigurasi |

Ikon Laragon di baki sistem (dekat jam) memuat menu yang sama. Klik kanan ikon itu bila jendela utama ditutup.

## 3. Langkah awal (sekali saja)

### 3.1 Cukup nyalakan MySQL

Buka pengaturan layanan (biasanya **Menu → Preferences → Services & Ports**). Nonaktifkan **Apache/Nginx** bila tidak dipakai proyek lain. Biarkan **MySQL** aktif. Ini mengurangi pemakaian memori dan menghindari bentrok port.

### 3.2 Nyalakan dan periksa

1. Klik **Start All**.
2. Pastikan MySQL berstatus berjalan. Port bawaannya **3306**.
3. Bila port bentrok (misalnya ada MySQL lain dari XAMPP atau pemasangan lain), matikan yang lain, atau ganti port di pengaturan Laragon dan samakan nilainya di `.env` nanti.

### 3.3 Periksa versi MySQL (penting)

1. Klik **Database** untuk membuka HeidiSQL. Pada jendela sesi, klik **Open** (pengguna `root`, kata sandi bawaan Laragon **kosong**).
2. Buka tab **Query**, ketik lalu jalankan dengan **F9**:

```sql
SELECT VERSION();
```

Proyek ini membutuhkan **MySQL 8.0.16 atau lebih baru** (atau MariaDB 10.2.1 atau lebih baru). Pada versi lebih rendah, aturan `CHECK` yang menjaga stok **diabaikan tanpa pesan galat**. Laragon edisi Full biasanya membawa MySQL 8.0.x, jadi umumnya sudah memenuhi.

Bila versinya terlalu rendah, ganti lewat **Menu → MySQL** (atau klik kanan ikon Laragon → MySQL) dan pilih atau unduh versi yang lebih baru, lalu **Stop** dan **Start All** lagi.

### 3.4 Beri kata sandi pada `root`

`root` bawaan Laragon tidak berkata sandi. Itu aman hanya untuk laptop pengembangan yang tidak dibuka ke jaringan. Tetap biasakan menggantinya, dan **wajib** pada PC server kantor.

Di tab **Query** HeidiSQL:

```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'GANTI_DENGAN_KATA_SANDI_KUAT';
```

Sesudah ini HeidiSQL tidak bisa masuk lagi dengan kata sandi kosong. Perbarui sesinya: buka **Session manager** di HeidiSQL, pilih sesi Laragon, isi kolom **Password**, lalu **Save**. Catat kata sandi `root` di tempat aman.

Bila lupa kata sandi `root`: pada versi Laragon yang umum ada **Menu → MySQL → Start Safe Mode**. Mode ini menyalakan MySQL tanpa pemeriksaan kata sandi, sehingga Anda bisa menjalankan `ALTER USER` di atas lewat **Terminal** (`mysql -u root`), lalu mematikan Safe Mode dan memulai ulang.

## 4. Membuat basis data dan akun untuk pengembangan

Aplikasi **tidak memakai `root`**. Buat akun khusus. Jalankan di tab **Query** HeidiSQL, sambil login sebagai `root`:

```sql
CREATE DATABASE IF NOT EXISTS inventaris_it_dev
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS inventaris_it_test
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'dev_inventaris'@'localhost' IDENTIFIED BY 'GANTI_KATA_SANDI_DEV';
GRANT ALL PRIVILEGES ON inventaris_it_dev.*  TO 'dev_inventaris'@'localhost';
GRANT ALL PRIVILEGES ON inventaris_it_test.* TO 'dev_inventaris'@'localhost';
FLUSH PRIVILEGES;
```

Dua basis data dengan fungsi berbeda:

| Basis data | Fungsi |
|---|---|
| `inventaris_it_dev` | Tempat Anda menjalankan dan mencoba aplikasi. Boleh dikosongkan kapan saja |
| `inventaris_it_test` | Dipakai tes otomatis dan dikosongkan setiap kali tes jalan. **Jangan simpan data penting di sini** |

Untuk **PC server kantor** (produksi), hak akses dibuat lebih ketat dan terpisah (akun aplikasi, migrasi, backup). Lihat [`SYSTEM-DESIGN.md`](SYSTEM-DESIGN.md) bagian 6A.3. Itu dikerjakan menjelang go-live, bukan sekarang.

## 5. Membuat tabel (menjalankan skema)

Skema ada di berkas migrasi `db/migrations/0001_init.sql` (isinya sama dengan blok SQL di `SYSTEM-DESIGN.md` bagian 6). Ada dua cara menjalankannya.

**Cara A: lewat HeidiSQL (paling mudah untuk percobaan pertama)**

1. Di HeidiSQL, klik basis data `inventaris_it_dev` di panel kiri sampai terpilih (**pilih dulu, ini penting**).
2. Menu **File → Load SQL file**, pilih `0001_init.sql`.
3. Tekan **F9**.
4. Klik kanan `inventaris_it_dev` lalu **Refresh**. Seharusnya muncul 13 tabel (`users`, `items`, `loans`, dan seterusnya).

**Cara B: lewat aplikasi (setelah tahap fondasi selesai).** Perintah migrasi proyek (`npm run db:migrate`) menjalankan semua berkas di `db/migrations/` berurutan dan mencatat mana yang sudah jalan. Ini cara yang dipakai seterusnya, karena otomatis dan tidak mengulang.

## 6. Menghubungkan aplikasi

1. Salin `.env.example` menjadi `.env` di folder proyek.
2. Isi nilainya:

```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=inventaris_it_dev
DB_USER=dev_inventaris
DB_PASSWORD=KATA_SANDI_DEV_YANG_TADI
PORT=3001
```

3. Pastikan `.env` ada di `.gitignore`. Berkas ini **tidak boleh** di-commit, apalagi repositori ini publik.
4. Dari terminal proyek (terminal Laragon atau terminal VS Code, selama `node -v` berfungsi): `npm install`, lalu perintah migrasi dan jalankan sesuai README bagian 6.

Bila aplikasi tidak bisa menyala, pesan galatnya akan menyebut salah satu dari: tidak bisa terhubung, kata sandi salah, versi MySQL terlalu rendah, mode SQL tidak strict, atau charset salah. Lihat bagian 9.

## 7. Kebiasaan sehari-hari

**Mulai bekerja**

1. Buka Laragon, klik **Start All**.
2. Jalankan aplikasi dari terminal proyek.

**Selesai bekerja**

1. Hentikan aplikasi (Ctrl+C di terminal).
2. Klik **Stop** di Laragon bila tidak dipakai lagi.

**Menyalakan Laragon otomatis saat Windows hidup:** di **Menu → Preferences → General** biasanya ada pilihan seperti *Run Laragon when Windows starts* dan *Start All automatically*. Aktifkan **hanya di PC server kantor**, bukan di laptop pengembangan.

**Melihat isi tabel:** HeidiSQL (tombol **Database**) → klik basis data → klik tabel → tab **Data**. Aman untuk **membaca**.

## 8. Aturan yang perlu dipatuhi

1. **Jangan ubah data produksi lewat HeidiSQL.** Perubahan manual pada tabel stok dan peminjaman melewati buku besar stok dan merusak angka. Koreksi dilakukan lewat aplikasi. Di basis data pengembangan boleh bereksperimen.
2. **Jangan commit `.env`**, berkas `.sql` hasil backup, atau `database.sqlite`.
3. **Beda kata sandi untuk pengembangan dan produksi.** Kata sandi pengembangan boleh sederhana. Produksi harus kuat dan unik.
4. **Jangan buka port 3306 ke jaringan.** Di PC server kantor, MySQL hanya boleh menerima koneksi dari PC itu sendiri (`bind-address = 127.0.0.1`), dan firewall tidak membuka port 3306.
5. **Laragon adalah alat pengembangan.** Untuk PC server kantor, yang wajib dipastikan: MySQL menyala otomatis setelah PC hidup tanpa ada yang membuka jendela Laragon. Buktikan dengan **restart PC sungguhan**. Bila ragu, pasang MySQL Server resmi sebagai layanan Windows untuk server kantor.

## 9. Masalah yang sering muncul

| Gejala | Kemungkinan penyebab | Tindakan |
|---|---|---|
| `ECONNREFUSED 127.0.0.1:3306` | MySQL belum menyala | Klik **Start All** di Laragon |
| `Access denied for user ...` | Kata sandi di `.env` tidak cocok, atau akun belum dibuat | Cocokkan `DB_USER` dan `DB_PASSWORD` dengan bagian 4. Coba login lewat HeidiSQL dengan akun yang sama |
| `Unknown database 'inventaris_it_dev'` | Basis data belum dibuat, atau nama di `.env` salah | Jalankan SQL bagian 4, periksa `DB_NAME` |
| MySQL tidak mau menyala, port 3306 dipakai | Ada MySQL lain yang berjalan (XAMPP, pemasangan lain) | Matikan yang lain, atau ganti port di Laragon dan di `.env` |
| Aplikasi menolak menyala dengan pesan versi | MySQL di bawah 8.0.16 | Ganti versi lewat Menu → MySQL (bagian 3.3) |
| Huruf aneh, tanda tanya pada nama berakhiran | Charset bukan `utf8mb4` | Buat ulang basis data dengan perintah bagian 4 |
| HeidiSQL tidak bisa masuk setelah ganti kata sandi `root` | Sesi HeidiSQL masih menyimpan kata sandi lama | Perbarui kata sandi di Session manager (bagian 3.4) |
| Tabel tidak muncul setelah menjalankan skema | Basis data belum dipilih sebelum menekan F9 | Pilih `inventaris_it_dev` di panel kiri, jalankan ulang |

## 10. Backup sederhana (pengembangan)

Untuk menyimpan salinan basis data pengembangan, di **Terminal** Laragon:

```
mysqldump -u dev_inventaris -p --default-character-set=utf8mb4 inventaris_it_dev > inventaris_it_dev_cadangan.sql
```

Perintah akan menanyakan kata sandi. Hasilnya berupa berkas `.sql` yang bisa dipulihkan ke basis data kosong dengan:

```
mysql -u dev_inventaris -p inventaris_it_dev < inventaris_it_dev_cadangan.sql
```

Berkas `.sql` tidak boleh masuk Git. Untuk backup terjadwal di PC server kantor, ikuti [`SYSTEM-DESIGN.md`](SYSTEM-DESIGN.md) bagian 6A.7.

## 11. Pindah dari laptop pengembangan ke PC server kantor

Langkah yang sama dipakai, dengan perbedaan berikut:

1. Pasang Laragon (atau MySQL Server resmi) di PC server.
2. Kata sandi `root` **wajib** diisi (bagian 3.4).
3. Buat basis data `inventaris_it` dan tiga akun terpisah (aplikasi, migrasi, backup) sesuai `SYSTEM-DESIGN.md` bagian 6A.3. **Jangan** memakai akun `dev_inventaris`.
4. Atur `my.ini` sesuai bagian 6A.4 (`bind-address`, charset, zona waktu).
5. Pasang backup terjadwal dan uji pemulihannya (bagian 6A.7).
6. Pastikan MySQL dan aplikasi menyala otomatis, lalu uji dengan restart PC.
7. Pindahkan data lama lewat skrip migrasi (`SYSTEM-DESIGN.md` bagian 11), dilatih dulu pada basis data percobaan.
