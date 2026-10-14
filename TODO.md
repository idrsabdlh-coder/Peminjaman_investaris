# TODO: Pengembangan Lanjutan Sistem Peminjaman & Inventaris Tim IT

Acuan: [`docs/PRD.md`](docs/PRD.md) (v5.x) dan [`docs/SYSTEM-DESIGN.md`](docs/SYSTEM-DESIGN.md). Kode `BR-xx`, `FR-xx`, `D-x`, `T-5.x`, dan nomor bagian merujuk ke sana.

**Legenda.** Peran: **BE** back-end, **FE** front-end, **QA** pengujian, **PM** keputusan dan dokumen. Ukuran: **S** beberapa jam, **M** 1–2 hari, **L** 3 hari atau lebih. ⚙ = tes ditulis **sebelum** kodenya.

## Aturan kerja (pengembang dan AI agent)

1. Satu paket satu branch, digabung ke v5 setelah diperiksa, satu commit per task dengan ID task, PR ke main per phase. Nama branch: `feat/<id-task>-<nama-singkat>`.
2. Soal aturan bisnis, **PRD menang**. Soal teknis, **SYSTEM-DESIGN menang**. Bila ambigu atau bertentangan dengan kode: berhenti dan tanyakan, jangan menebak.
3. Jangan mengubah PRD tanpa persetujuan. Bila desain berubah, perbarui SYSTEM-DESIGN di commit yang sama.
4. Logika stok hanya di server, dalam transaksi, dengan baris `stock_movements` (BR-01, FR-S-01, FR-S-02).
5. Jangan commit `.env`, dump `.sql`, atau `database.sqlite`.
6. **Definisi selesai:** kriteria "Selesai jika" terpenuhi, tes terkait hijau, invarian BR-01 lolos, task dicentang, dan ada ringkasan singkat perubahan.

Urutan sesi dan paket: docs/PANDUAN-EKSEKUSI.md bagian D.

## Peta phase

| Phase | Isi | Bergantung pada |
|---|---|---|
| 0 | Persiapan, audit kode, keputusan, lingkungan MySQL | — |
| 1 | Fondasi: akses data, migrasi, autentikasi, tes | Phase 0 |
| 2 | Peminjaman, pemesanan, kelola barang | Phase 1 |
| 3 | Cek peminjaman, klaim parsial, verifikasi, stok rusak | Phase 2 |
| 4 | Perpanjangan, pembatalan, koreksi | Phase 3 |
| 5 | Panel admin lengkap, laporan, kiosk | Phase 3–4 |
| 6 | Migrasi data, hardening, go-live | Phase 5 |
| 7 | Backlog setelah stabil | Phase 6 |

Skema MySQL langsung memakai versi v5 (tanpa tahap antara "skema lama di MySQL"). Data lama dipindahkan sekali di Phase 6.

---

## Phase 0: Persiapan dan audit (S–M)

- [ ] **0.1 [PM] Susun repo.** Pindahkan `PRD.md` dan `SYSTEM-DESIGN.md` ke `docs/`. Tambahkan `AGENTS.md` dan `TODO.md` di akar. Perbarui README (lihat `docs/SYSTEM-DESIGN.md` bagian 6).
  *Selesai jika:* semua tautan antar dokumen berfungsi di GitHub.
  *Ringkasan (Task 0.1, 12 Okt 2026):* Tambah PRD 5.3 Kebutuhan Tambahan (kategori/kondisi/tipe peminjam). Geser 5.3 Asumsi → 5.4. Tambah BR-28–33, perbarui BR-17 (kode klaim KMB-XXXXXX), perbarui FR-K-01/02, FR-A-03/05/06/11, tambah FR-A-18. Tambah T-5.33–35. SYSTEM-DESIGN: tambah tabel `categories`, `items.kategori_id`, `loans.tipe_peminjam` di ERD dan skema SQL; tambah endpoint `/api/kiosk/categories` dan `/api/admin/categories`; perbarui pemetaan migrasi (category, condition, borrower_type); tambah bagian 13 (strategi dua sistem berdampingan). Perbarui aturan kerja TODO/AGENTS. PRD versi 5.3, SYSTEM-DESIGN versi 1.3.
- [ ] **0.2 [BE] Audit kode terhadap dokumen, tanpa mengubah kode.** Baca `server.js` dan `src/services/db.ts`, lalu tulis `docs/AUDIT-0.2.md`: di mana logika stok dihitung, validasi mana yang hanya ada di klien, endpoint mana yang tanpa autentikasi, skema tabel yang sebenarnya, dan selisih dengan SYSTEM-DESIGN.
  *Selesai jika:* ada daftar selisih, dan skema tabel sebenarnya tercatat untuk bahan skrip migrasi (6.1).
- [ ] **0.3 [BE] Amankan titik awal.** Beri tag Git `prototipe-v4` dan salin `database.sqlite` ke luar folder proyek.
- [ ] **0.4 [PM] Putuskan hal yang masih terbuka dan perbarui PRD:** Sudah diputuskan di 0.1: kategori/kondisi/tipe peminjam, strategi dua sistem berdampingan (SYSTEM-DESIGN bagian 13), format kode klaim. Masih terbuka: (1) MySQL final dan pengelola server, (2) printer kiosk, pengecualian perpanjangan per barang, pelepasan otomatis pemesanan tak diambil, (3) operasi buku besar TANDAI_RUSAK, (4) bahasa server TypeScript atau JavaScript.
- [ ] **0.5 [BE] Siapkan MySQL di Laragon.** Cek `SELECT VERSION();` (syarat ≥ 8.0.16 atau MariaDB ≥ 10.2.1). Setel kata sandi `root`. Buat basis data `inventaris_it_dev` dan `inventaris_it_test`. Buat akun `app_inventaris`, `migrator`, `backup` sesuai SYSTEM-DESIGN 6A.3. Setel `bind-address=127.0.0.1`, charset `utf8mb4`, zona waktu `+00:00`. Periksa `@@sql_mode`.
  *Selesai jika:* tiap akun hanya bisa melakukan hal yang diizinkan, dan port 3306 tidak terjangkau dari komputer lain.
- [ ] **0.6 [BE] Rapikan konfigurasi.** Buat `.env.example`, tambahkan `.env`, `*.sql`, dan `database.sqlite` ke `.gitignore`.
- [ ] **0.7 [QA] Catat baseline.** Jalankan manual T-5.1 sampai T-5.6 pada prototipe dan simpan hasilnya.

## Phase 1: Fondasi (L)

- [ ] **1.1 [BE] Lapisan akses data (M).** Modul `server/db/` dengan pool `mysql2` sesuai SYSTEM-DESIGN 6A.4, helper `tx(fn)` dengan retry deadlock (galat 1213 dan 1205, maksimal 3 kali), seluruh kode `async/await`. Tidak ada SQL di rute.
  *Selesai jika:* tidak ada satu pun `import` driver basis data di luar `server/db/`.
- [ ] **1.2 [BE] Runner migrasi dan skema awal (M).** Berkas `db/migrations/0001_init.sql` dari skema MySQL (`SYSTEM-DESIGN.md` bagian 5 dan 6), tabel `schema_migrations`, backup otomatis sebelum migrasi (6A.5).
  *Selesai jika:* migrasi dari basis data kosong berhasil di MySQL Laragon, dan menjalankannya dua kali tidak mengulang apa pun.
- [ ] **1.9 [QA] Kerangka tes (M).** `vitest` dan `supertest`, basis data `inventaris_it_test` yang dibuat ulang tiap suite, pengaman yang menolak tes bila nama basis data tidak berakhiran `_test`, perintah `npm test`.
  *Selesai jika:* satu tes contoh berjalan hijau, dan tes menolak jalan pada basis data produksi.
- [ ] **1.3 [BE] Pemeriksaan saat start ⚙ (S).** Server menolak menyala bila versi, `sql_mode`, atau charset tidak sesuai, lalu menjalankan kueri invarian (SYSTEM-DESIGN 2.2). T-5.32.
- [ ] **1.4 [BE] Seed dan skrip admin (S).** Divisi awal, parameter bawaan (PRD bagian 8), skrip pembuat admin pertama yang meminta kata sandi, dan skrip reset kata sandi lewat konsol (FR-S-06).
  *Selesai jika:* tidak ada kata sandi bawaan di repo.
- [ ] **1.5 [BE] Autentikasi server-side ⚙ (M).** Hash `argon2id` atau `bcrypt`, sesi di tabel `sessions` (simpan hash token), cookie `httpOnly` dan `SameSite=Strict`, idle 15 menit ditegakkan server, middleware pada `/api/admin/*`, rate limit login (FR-A-01, BR-19).
  *Selesai jika:* T-5.1 lulus (API admin tanpa sesi membalas 401).
- [ ] **1.6 [FE+BE] Bersihkan kredensial dan sambungkan login ke API (S).** Hapus akun dan kata sandi dari UI, README, dan kode. Frontend memanggil `/api/auth/*`, menangani sesi kedaluwarsa, dan punya tombol logout.
  *Selesai jika:* T-5.20 lulus (pencarian `password123` dan `admin@kantor.id` di repo dan hasil build kosong).
- [ ] **1.7 [BE] Utilitas inti (S).** Pembangkit kode pinjam dan kode klaim (BR-17, `crypto.randomInt`, huruf besar), fungsi tanggal Asia/Jakarta (hari ini, selisih hari), penanganan kunci idempotensi (BR-20), validasi skema input (mis. `zod`).
- [ ] **1.8 [BE] Buku besar stok (S).** Fungsi `applyMovement()` yang menulis `stock_movements` dan memperbarui `items` dalam satu transaksi, serta pemeriksa invarian BR-01 yang dapat dipanggil dari tes.

## Phase 2: Peminjaman dan pemesanan (L)

- [ ] **2.1 [BE] Katalog dan divisi publik (S).** `GET /api/kiosk/items?q=` (hanya nama dan `tersedia`) dan `GET /api/kiosk/divisions` (FR-K-01).
- [ ] **2.2 [BE] Buat peminjaman ⚙ (L).** `POST /api/kiosk/loans` mengikuti SYSTEM-DESIGN 7.1: kunci baris urut `id`, pengurangan bersyarat, tanggal pinjam sesuai BR-23, kunci idempotensi, kode pinjam acak. Referensi: BR-02, BR-20, BR-22, BR-23.
  *Selesai jika:* T-5.2, T-5.21 (dua peminjaman bersamaan untuk stok 1, tepat satu berhasil), dan T-5.24 lulus.
- [ ] **2.3 [FE] Form peminjaman (M).** Divisi berupa pilihan, tanggal pinjam (default hari ini, sampai `maks_booking_hari` ke depan), batas kembali (maksimal `maks_durasi_awal_hari` dari tanggal pinjam), peringatan bahwa stok ditahan bila tanggal di masa depan, validasi di klien (FR-K-02).
- [ ] **2.4 [FE] Struk cetak (S).** Kode pinjam huruf besar, batas kembali, penanda PEMESANAN, stylesheet cetak, dan bukti tetap tampil di layar sebagai cadangan (FR-K-03).
- [ ] **2.5 [BE] Batalkan pemesanan oleh peminjam ⚙ (M).** `POST /api/kiosk/loans/cancel` (SYSTEM-DESIGN 7.7), jenis buku besar `BATAL_PINJAM` (FR-K-12, BR-24). Sisi FE di 3.2a.
  *Selesai jika:* T-5.25 lulus.
- [ ] **2.6 [BE+FE] Kelola barang, stok, dan divisi (M).** Tambah, ubah, soft-delete barang dengan penanda `boleh_diperpanjang` (FR-A-03, BR-14). Penyesuaian stok (FR-A-10, BR-15). Kelola divisi, nonaktifkan bukan hapus (FR-A-16, BR-27).
  *Selesai jika:* T-5.5 lulus.

## Phase 3: Cek peminjaman, klaim, verifikasi, stok rusak (L)

- [ ] **3.1 [BE] Cek peminjaman dan status turunan ⚙ (M).** `POST /api/kiosk/loans/lookup`. Satu fungsi `deriveStatus()` untuk semua status dan lencana (SYSTEM-DESIGN bagian 3). Batas percobaan kode gagal (BR-18).
  *Selesai jika:* T-5.4, T-5.6, dan T-5.16 lulus.
- [ ] **3.2 [FE] Halaman Cek Peminjaman (M).** Kartu per barang (dipinjam, menunggu, terverifikasi, sisa), penghitung mundur batas kembali, kuota perpanjangan, riwayat klaim dengan status (FR-K-04).
- [ ] **3.2a [FE] Tombol batal pemesanan di kiosk (S).** Tombol Batalkan pemesanan pada kartu peminjaman di halaman Cek Peminjaman (FE dari 2.5; butuh kartu peminjaman dari 3.2; FR-K-12, BR-24).
- [ ] **3.3 [BE] Klaim pengembalian parsial ⚙ (L).** `POST /api/kiosk/return-claims` mengikuti 7.2: kunci baris `loans`, sisa dihitung di server, hari terlambat dibekukan, stok tidak berubah. Referensi: BR-03, BR-04, BR-10, BR-20.
  *Selesai jika:* T-5.7, T-5.8, T-5.9, T-5.11, T-5.12, dan T-5.26 lulus.
- [ ] **3.4 [FE] Form klaim dan bukti klaim (M).** Per barang: jumlah Baik, Rusak, Hilang (total ≤ sisa), satu catatan per klaim, bukti klaim yang dapat dicetak dengan pengingat menyerahkan barang fisik (FR-K-05, FR-K-06).
- [ ] **3.5 [BE] Antrean dan verifikasi ⚙ (L).** `GET /api/admin/return-claims`, detail, dan `POST .../verify` mengikuti 7.3: bagi hasil ke baik, rusak, hilang, ditolak, catatan admin wajib bila berbeda, 409 bila sudah diproses. Referensi: BR-05 sampai BR-08.
  *Selesai jika:* T-5.3 dan T-5.14 lulus.
- [ ] **3.6 [FE] Antrean verifikasi (M).** Daftar terlama di atas, detail dengan catatan peminjam disorot, pembagian jumlah per baris, aksi cepat "Setujui sesuai laporan", lencana jumlah antrean (FR-A-04, FR-A-15).
- [ ] **3.7 [BE+FE] Stok rusak ⚙ (M).** Daftar barang `rusak > 0`, aksi "Selesai diperbaiki" dan "Afkir" (7.5, BR-09, FR-A-09).
  *Selesai jika:* T-5.15 lulus.
- [ ] **3.8 [FE] Hasil klaim terlihat peminjam (S).** Hasil verifikasi dan catatan admin tampil pada kartu peminjaman, dan form admin memberi petunjuk bahwa catatan itu terlihat peminjam (FR-K-09).
- [ ] **3.9 [QA] Tes invarian acak ⚙ (M).** Rangkaian acak pinjam, pesan, batal, klaim, verifikasi, perbaikan, afkir, lalu BR-01 dan buku besar harus tetap benar (T-5.10).

## Phase 4: Perpanjangan, pembatalan, koreksi (M)

- [ ] **4.1 [BE] Perpanjangan oleh peminjam ⚙ (M).** `POST /api/kiosk/extensions` mengikuti 7.4. Referensi: BR-11, BR-12, BR-26, D-12 (galat menyebut barang yang tidak boleh diperpanjang).
  *Selesai jika:* T-5.17, T-5.18, dan T-5.28 lulus.
- [ ] **4.2 [FE] Perpanjang dan bukti perpanjangan (S).** Tampilkan batas lama dan baru sebelum konfirmasi, serta alasan jelas bila tombol tidak aktif (FR-K-07, FR-K-08).
- [ ] **4.3 [BE] Perpanjangan oleh admin ⚙ (S).** Boleh untuk peminjaman terlambat, alasan wajib, tercatat sebagai pelaku admin (BR-13, FR-A-08). T-5.19. Sisi FE di 5.2a.
- [ ] **4.4 [BE] Batalkan peminjaman oleh admin ⚙ (S).** Hanya bila belum ada klaim, alasan wajib (BR-25, FR-A-17). T-5.27. Sisi FE di 5.2a.
- [ ] **4.5 [BE] Koreksi peminjaman (M).** Nama, divisi, telepon, batas kembali, tanggal pinjam, jumlah item, dengan alasan wajib dan `loan_corrections`. Koreksi jumlah mengikuti 7.6 (BR-16, FR-A-07). Sisi FE di 5.2a.

## Phase 5: Panel admin lengkap dan kiosk (M–L)

- [ ] **5.1 [BE+FE] Daftar peminjaman dan filter (M).** Ringkasan, filter status (termasuk Dipesan dan Dibatalkan), barang, divisi, rentang tanggal, teks, "Ada catatan", "Ada kerusakan/kehilangan", tombol cepat Belum Dikembalikan (FR-A-05).
- [ ] **5.2 [BE+FE] Detail dan lini masa (M).** Pinjam, perpanjangan, klaim dengan catatan peminjam, verifikasi dengan catatan admin, koreksi (FR-A-06). T-5.13.
- [ ] **5.2a [FE] Tombol aksi admin di halaman detail (M).** Tombol aksi admin pada halaman detail peminjaman dari 5.2: perpanjang (FE dari 4.3), batalkan (FE dari 4.4), dan koreksi peminjaman (FE dari 4.5).
- [ ] **5.3 [BE+FE] Dasbor dan polling (S).** Angka ringkasan dan jumlah antrean, diperbarui tiap 30 detik (FR-A-15).
- [ ] **5.4 [BE] Laporan PDF (M).** Rekap peminjaman, belum dikembalikan (termasuk pemesanan belum dimulai), stok dan kondisi, riwayat pengembalian dan verifikasi dengan catatan (FR-A-11).
- [ ] **5.5 [BE+FE] Pengaturan parameter (S).** Nilai dari PRD bagian 8 dapat diubah tanpa mengubah kode (FR-A-12).
- [ ] **5.6 [BE+FE] Penampil jejak audit (S).** (FR-A-13)
- [ ] **5.7 [BE+FE] Akun admin (S).** Ganti kata sandi sendiri, tambah admin cadangan, nonaktifkan admin (FR-A-02).
- [ ] **5.8 [FE] Perilaku kiosk (S).** Reset otomatis setelah idle dengan hitung mundur, tanpa data peminjam di penyimpanan browser, target sentuh minimal 44×44 px (FR-K-10, FR-K-11).
- [ ] **5.9 [BE] Ekspor Excel/CSV (S, opsional).** (FR-A-14)

## Phase 6: Migrasi data, hardening, go-live (L)

- [ ] **6.1 [BE] Skrip migrasi SQLite ke MySQL ⚙ (L).** `scripts/migrate-sqlite-to-mysql` sesuai SYSTEM-DESIGN bagian 11. SQLite hanya dibaca. Dilatih ke `inventaris_it_trial` sampai bersih sebelum ke produksi.
  *Selesai jika:* T-5.22 lulus (jumlah peminjaman, total stok, dan status cocok, BR-01 benar untuk semua barang).
- [ ] **6.2 [PM] Rapikan divisi lama.** Satukan ejaan ganda dari data lama sebelum dipetakan ke tabel `divisions`.
- [ ] **6.3 [PM] Hitung fisik sekali.** Cocokkan stok sistem dengan barang di lemari dan tetapkan stok `rusak` awal lewat penyesuaian dan alur stok rusak (aturan lama memasukkan barang rusak ke `tersedia`).
- [ ] **6.4 [BE] Backup terjadwal dan uji pulih (M).** `mysqldump` harian lewat Task Scheduler, retensi 14, salinan di perangkat lain, dan satu kali pemulihan ke basis data terpisah (SYSTEM-DESIGN 6A.7). T-5.23.
- [ ] **6.5 [BE] Hardening MySQL (S).** Kata sandi root terisi, `bind-address=127.0.0.1`, port 3306 tertutup di firewall, hak akun sesuai 6A.3. T-5.31.
- [ ] **6.6 [BE] Satu port dan layanan otomatis (M).** Express menyajikan hasil build, aplikasi dan MySQL menyala otomatis setelah PC hidup.
  *Selesai jika:* setelah restart PC sungguhan, sistem berfungsi tanpa ada yang membuka terminal atau jendela Laragon.
- [ ] **6.7 [QA+PM] Uji penerimaan pengguna.** Jalankan SOP PRD 9.4 bersama petugas IT dan beberapa karyawan, catat kekurangan, perbaiki.
- [ ] **6.8 [PM] Runbook (S).** `docs/RUNBOOK.md`: menyalakan dan mematikan, backup dan pulih, reset kata sandi, mengubah parameter, siapa dihubungi bila macet.
- [ ] **6.9 [PM] Go-live dan pemantauan.** Hentikan buku catatan. Pantau dua minggu. Setelah sebulan, tinjau metrik PRD bagian 3 dan nilai parameter (bila sebagian besar peminjaman selalu memakai kuota perpanjangan penuh, naikkan durasi awal).

## Phase 7: Backlog setelah stabil

Pilih berdasarkan kebutuhan nyata, bukan urutan:

- [ ] Konfirmasi pengambilan dan pelepasan otomatis pemesanan yang tidak diambil (Q-7)
- [ ] Kalender ketersediaan per tanggal (agar unit tidak ditahan sebelum dipakai)
- [ ] Master data karyawan
- [ ] Lokasi simpan barang (kategori sudah masuk di v5.0)
- [ ] Tipe barang *habis pakai* dengan batas stok minimum
- [ ] Nomor seri atau asset tag per unit untuk aset bernilai tinggi (hibrida dengan jumlah)
- [ ] Barcode/QR dan pemindai USB
- [ ] Stock opname (hitung fisik dan rekonsiliasi selisih)
- [ ] Alur perawatan berkala
- [ ] Pengingat jatuh tempo lewat WhatsApp atau email
- [ ] Foto kondisi saat pengembalian rusak
- [ ] Kebijakan keterlambatan (batas hari, pemblokiran peminjam menunggak)
- [ ] Persetujuan perpanjangan oleh admin (parameter `perpanjangan_butuh_persetujuan`)
- [ ] Beberapa level peran admin
- [ ] HTTPS dengan sertifikat lokal
