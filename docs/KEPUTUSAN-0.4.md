# Bahan Keputusan Task 0.4

Dokumen ini bahan untuk keputusan pengguna dan tim, bukan keputusan agent. **Kolom Keputusan yang kosong diisi pengguna.** Rekomendasi di bawah hanya bahan pertimbangan. PRD dan SYSTEM-DESIGN tetap draf; tidak ada perubahan pada keduanya dalam S03.

## Ringkasan

- **D-13: diputuskan bersama pada 16 Okt 2026:** basis data final adalah MySQL (InnoDB). Keputusan ini tidak dibuka lagi untuk perbandingan dengan PostgreSQL.
- Pertanyaan PRD bagian 14 yang masih perlu jawaban: Q-3, Q-6, Q-7, dan bagian tanggung jawab server dari Q-8. D-13 pada Q-8 sudah dijawab. Siapa yang mengelola server dan mesin tempat MySQL dipasang juga perlu diputuskan.
- Q-1, Q-2, Q-4, dan Q-5 telah memiliki jawaban di PRD: peminjam dari semua divisi; nilai kebijakan mengikuti rekomendasi bagian 8; kiosk memakai keyboard fisik; satu admin aktif. Dicatat sebagai konteks, tidak dibuka ulang di sini.

## 1. D-13: Basis Data Final

**Status:** Diputuskan bersama oleh pengguna dan pemilik repo pada 16 Okt 2026.

**Pertanyaan:** Tidak ada pertanyaan pemilihan DB yang tersisa. Bagaimana keputusan MySQL diterapkan dan didokumentasikan terhadap sumber data yang benar-benar berjalan?

**Opsi:** Tidak dibuka untuk pemilihan ulang. Basis data final adalah MySQL (InnoDB).

**Akibat pada skema/kode/data:** Data lama yang aktif berada di PostgreSQL, dalam tabel `app_state` dengan kolom JSONB, menurut [AUDIT-0.2.md](AUDIT-0.2.md) bagian 1 dan 8. Phase 6 harus mengekstrak larik JSONB dan memetakannya ke skema MySQL relasional. Task 6.1 dan [SYSTEM-DESIGN.md bagian 11](SYSTEM-DESIGN.md#11-migrasi-dari-prototipe-sqlite-ke-mysql-fr-s-03) perlu diperbarui pada S04 agar tidak menyebut SQLite sebagai sumber aktif. Audit juga mencatat README dan referensi sumber migrasi perlu direkonsiliasi; periksa PRD D-13 dan FR-S-03 yang masih menyebut SQLite.

**Alasan tim yang disampaikan:** Tim memilih MySQL dengan mempertimbangkan kemudahan pengelolaan basis data, ketersediaan dukungan dan dokumentasi, serta kesesuaian dengan lingkungan implementasi sistem. Pemilihan ini dimaksudkan agar pengembangan dan pemeliharaan sistem peminjaman inventaris kantor dapat dilakukan secara terukur sesuai kemampuan tim dan sumber daya yang tersedia. Alasan ini menjadi dasar keputusan tim sejauh sesuai dengan kondisi dan kesepakatan tim yang sebenarnya.

**Rekomendasi (bukan keputusan):** Pada S04, pertahankan keputusan MySQL dan koreksi seluruh penyebutan sumber migrasi agar sesuai dengan audit PostgreSQL JSONB; ini menghindari skrip migrasi yang dibuat untuk sumber yang keliru.

**Keputusan:** Diputuskan bersama: MySQL (InnoDB), 16 Okt 2026.

## 2. Q-8: Penanggung Jawab Operasional Server

**Pertanyaan:** Siapa yang bertanggung jawab atas operasi server, termasuk backup dan uji-pulih, restart aplikasi/MySQL, pengelolaan kredensial, dan serah-terima saat penanggung jawab utama tidak tersedia?

**Opsi:** (A) satu penanggung jawab IT dan satu pengganti; (B) tanggung jawab bergiliran dalam tim; (C) operator/penyedia layanan eksternal dengan kontak eskalasi internal.

**Akibat pada skema/kode/data:** Tidak mengubah skema transaksi. Menentukan pemilik jadwal backup dan pemulihan pada [SYSTEM-DESIGN.md bagian 6A.7](SYSTEM-DESIGN.md#6a7-backup-dan-pemulihan), siapa yang menjalankan restart dan pembaruan kredensial, lokasi salinan backup di luar mesin utama, serta siapa yang dapat mengakses akun `root`, `migrator`, dan backup. Jangan mencatat kata sandi di dokumen ini.

**Rekomendasi (bukan keputusan):** Tetapkan satu penanggung jawab utama dan satu pengganti secara eksplisit agar backup, uji-pulih, dan pemulihan setelah restart tidak bergantung pada satu orang.

**Keputusan:** Satu penanggung jawab utama, namun dibantu dengan tanggung jawab sebagai tim dengan anggota lain yang saling memegang backup, uji-pulih, restart, dan kredensial. Alasan: operasi server tidak boleh bergantung pada satu orang, dan dua nama yang jelas lebih mudah dimintai pertanggungjawaban daripada giliran.

## 3. Mesin Penempatan MySQL

**Pertanyaan:** Di mesin mana MySQL (dan, bila satu mesin, aplikasi) akan dipasang untuk operasional kantor?

**Opsi:** (A) satu PC kantor khusus yang selalu menyala; (B) mesin server lain yang dikelola tim; (C) mesin lain yang ditetapkan tim, dengan aplikasi dan MySQL berada pada host terpisah.

**Akibat pada skema/kode/data:** Tidak mengubah skema relasional, tetapi menentukan alamat koneksi, konfigurasi layanan otomatis setelah restart, lokasi backup, pemantauan, dan risiko ketersediaan. [SYSTEM-DESIGN.md bagian 10](SYSTEM-DESIGN.md#10-kebutuhan-non-fungsional) mengasumsikan MySQL lokal, tidak menerima koneksi komputer lain, dan aplikasi/MySQL tersedia setelah PC dinyalakan ulang. Jika dipisah host, aturan jaringan, firewall, kredensial, dan asumsi `localhost` harus ditinjau ulang; jangan membuka port 3306 ke jaringan tanpa desain keamanan yang disetujui.

**Rekomendasi (bukan keputusan):** Pilih dan beri nama satu host yang selalu menyala selama jam operasional serta punya pemilik backup dan restart; tetapkan apakah aplikasi berada di host yang sama sebelum mengubah konfigurasi.

**Keputusan:** Opsi A. Satu PC kantor khusus yang selalu menyala selama jam operasional, dengan aplikasi dan MySQL di mesin yang sama dan MySQL hanya menerima koneksi lokal. Alasan: sesuai asumsi SYSTEM-DESIGN bagian 10 dan paling sederhana dirawat tim kecil.

## 4. Q-3: Printer Kiosk

**Pertanyaan:** Apakah kiosk memiliki printer untuk mencetak struk/bukti, atau bukti cukup ditampilkan di layar?

**Opsi:** (A) printer fisik tersedia di kiosk; (B) tanpa printer, bukti hanya tampil di layar; (C) bukti tetap punya tata letak cetak, tetapi pencetakan opsional lewat printer yang tersedia.

**Akibat pada skema/kode/data:** Tidak mengubah skema atau data. Opsi A memerlukan perangkat, driver, stylesheet cetak, dan alur cetak pada FR-K-03/FR-K-06. Opsi B memerlukan perubahan asumsi A-7 dan kebutuhan struk pada FR-K-03/FR-K-06. Opsi C mempertahankan tampilan bukti dan jalur cetak sebagai kemampuan opsional.

**Rekomendasi (bukan keputusan):** Konfirmasikan perangkat yang benar-benar tersedia; pertahankan bukti di layar sebagai cadangan karena PRD sudah mensyaratkannya.

**Keputusan:** Opsi C. Bukti selalu tampil di layar dan memiliki tata letak cetak; pencetakan opsional lewat printer yang tersedia di kiosk. Alasan: jawaban awal tim "printer ya" menunjukkan printer ada, tetapi perangkatnya belum dikonfirmasi dan bukti di layar tetap berfungsi bila printer mati.

## 5. Q-6: Pengecualian Perpanjangan per Barang

**Pertanyaan:** Apakah barang tertentu boleh dikecualikan dari perpanjangan mandiri peminjam?

**Opsi:** (A) Ya, pengecualian per barang; (B) tidak, semua barang yang memenuhi syarat mengikuti aturan perpanjangan yang sama.

**Akibat pada skema/kode/data:** Draf D-12, BR-11, FR-A-03, dan SYSTEM-DESIGN sudah mengasumsikan opsi A: `items.boleh_diperpanjang` dengan default ya, kontrol admin, dan validasi server saat perpanjangan. Opsi B dapat menghilangkan flag dan validasi per barang, tetapi memerlukan perubahan skema, form admin, aturan perpanjangan, tes, serta pemetaan migrasi/default yang sudah dirancang. Nilai lama belum membuktikan kebijakan pengecualian.

**Rekomendasi (bukan keputusan):** Pertahankan flag per barang dengan default ya jika memang ada barang yang dikecualikan; keputusan ini harus mengikuti kebijakan inventaris tim, bukan asumsi draf.

**Keputusan:** Opsi A. Pengecualian per barang lewat `items.boleh_diperpanjang` (default ya). Alasan: sesuai jawaban awal tim bahwa barang boleh dikecualikan, sehingga admin dapat mengunci barang tertentu tanpa mengubah aturan umum.

## 6. Q-7: Pemesanan yang Tidak Diambil

**Pertanyaan:** Jika barang yang dipesan tidak diambil, apakah pembatalan tetap dilakukan admin secara manual, atau stok dilepas otomatis setelah satu hari melewati tanggal pinjam? Jika otomatis, bagaimana sistem memastikan barang memang tidak diambil?

**Opsi:** (A) Admin memeriksa barang dan membatalkan manual dengan alasan, sesuai SOP PRD saat ini; (B) pelepasan otomatis setelah tenggat, disertai status/konfirmasi pengambilan; (C) tunda pelepasan otomatis ke tahap lanjutan.

**Akibat pada skema/kode/data:** Opsi A memakai alur pembatalan admin yang sudah dijelaskan pada BR-25 dan SOP PRD 9.4. Opsi B memerlukan cara mencatat konfirmasi pengambilan, batas waktu yang tegas, proses terjadwal yang idempoten, status dan riwayat baru, serta transaksi ledger yang mengembalikan `tersedia`; D-10, BR-25, dan roadmap berubah. Opsi C membatasi scope v5 awal tetapi mempertahankan pekerjaan manual.

**Rekomendasi (bukan keputusan):** Gunakan pembatalan manual untuk v5 awal kecuali tim sudah menetapkan proses konfirmasi pengambilan; otomatisasi tanpa bukti pengambilan berisiko melepas stok yang sudah diserahkan.

**Keputusan:** Opsi A. Admin membatalkan pemesanan yang tidak diambil secara manual dengan alasan (BR-25, SOP PRD 9.4). Alasan: belum ada cara tepercaya mencatat bahwa barang memang tidak diambil, sehingga pelepasan otomatis berisiko melepas stok yang sudah diserahkan; ditinjau ulang setelah uji penerimaan.

## 7. Kategori Barang: Daftar Tetap atau Dikelola Admin?

**Pertanyaan a:** Apakah kategori berupa daftar tetap yang ditetapkan di kode, atau dikelola admin seperti divisi?

**Opsi:** (A) daftar tetap; (B) admin dapat menambah, mengubah nama, dan menonaktifkan kategori.

**Akibat pada skema/kode/data:** Draf PRD 5.3.1, BR-28/31/33, FR-A-18, dan SYSTEM-DESIGN saat ini memilih opsi B: tabel `categories`, FK `items.kategori_id`, soft-deactivate, UI admin, serta filter kiosk/laporan. Instruksi task menyebut usulan `items.kategori`; itu berbeda dari rancangan relasional saat ini dan perlu dipastikan di S04. Opsi A bisa memakai ENUM/konfigurasi tetap tanpa CRUD, tetapi nilai baru memerlukan perubahan kode/skema. Migrasi perlu memetakan nilai `category` lama; audit mengusulkan baris kategori bagi nilai unik dan kategori sementara “Tanpa Kategori” untuk kosong/NULL. Laporan FR-A-11 mengelompokkan stok menurut kategori.

**Rekomendasi (bukan keputusan):** Opsi B cocok bila kategori memang berubah mengikuti kebutuhan operasional; ia sejalan dengan draf saat ini, tetapi keputusan Anda tetap diperlukan sebelum draf dianggap final.

**Keputusan:** Opsi B. Admin menambah, mengubah nama, dan menonaktifkan kategori (tabel `categories`, `items.kategori_id`), dengan baris awal "Tanpa Kategori" dari seed; daftar kategori awal ditentukan pengguna saat S14. Alasan: kategori barang IT bertambah seiring pembelian, dan daftar tetap di kode memaksa perubahan kode setiap ada kategori baru.

## 8. Kondisi Barang: Keputusan Sudah Diberikan

**Pertanyaan b:** Bagaimana kondisi per jenis barang direpresentasikan?

**Opsi:** Tidak dibuka kembali di S03.

**Akibat pada skema/kode/data:** Kondisi adalah tampilan turunan dari angka stok rusak: Baik, Sebagian rusak, atau Semua rusak. Tidak ada kolom teks kondisi yang dapat diedit admin. Migrasi tidak boleh menebak jumlah unit dari nilai lama `perlu_perbaikan`; item tersebut masuk daftar periksa hitung fisik task 6.3. Ini sesuai arah PRD 5.3.2/BR-29 dan temuan [AUDIT-0.2.md bagian 8](AUDIT-0.2.md#8-tabel-pemetaan-data-lama-ke-skema-v5-system-design-bagian-6).

**Rekomendasi (bukan keputusan):** Pertahankan keputusan ini dan pastikan angka stok hasil hitung fisik menjadi sumber tunggal kondisi tampilan.

**Keputusan:** Kondisi per jenis barang ditampilkan sebagai turunan jumlah unit rusak (Baik, Sebagian rusak, Semua rusak), bukan kolom ketikan admin. `perlu_perbaikan` masuk daftar periksa hitung fisik task 6.3 dan tidak ditebak.

## 9. Tipe Peminjam: Aturan atau Klasifikasi?

**Pertanyaan c:** Apakah tipe Karyawan/Magang mengubah kuota, durasi, atau aturan lain, atau hanya klasifikasi pada form, filter, dan laporan?

**Opsi:** (A) klasifikasi saja, wajib pada form kiosk; (B) tipe peminjam mengubah kebijakan peminjaman dan parameter terkait.

**Akibat pada skema/kode/data:** Draf PRD 5.3.3, BR-30, FR-K-02, FR-A-05/06/11 mengusulkan opsi A dan kolom `loans.tipe_peminjam ENUM('karyawan','magang') NOT NULL`. Migrasi memetakan nilai lama bila tersedia; audit menyarankan default `'karyawan'` bila kosong/tidak dapat dipetakan dan mencatatnya untuk koreksi. Opsi B membutuhkan aturan/parameter tambahan, validasi server, UI, laporan, dan tes per tipe.

**Rekomendasi (bukan keputusan):** Gunakan opsi A sampai tim memiliki aturan berbeda yang nyata; kewajiban memilih tipe tetap menghasilkan data untuk filter dan laporan.

**Keputusan:** Opsi A. Klasifikasi saja: `loans.tipe_peminjam` ENUM huruf kecil ('karyawan','magang'), label tampilan Karyawan dan Magang, wajib dipilih di form kiosk. Alasan: belum ada kuota atau durasi yang berbeda per tipe, jadi tipe hanya dibutuhkan untuk filter dan laporan.

## 10. Operasi Stok `TANDAI_RUSAK`

**Pertanyaan:** Apakah admin memerlukan operasi eksplisit untuk memindahkan unit tersedia menjadi rusak saat hitung fisik awal?

**Opsi:** (A) tambah jenis mutasi `TANDAI_RUSAK`; (B) gunakan penyesuaian umum dengan alasan dan delta yang sama; (C) prosedur lain yang disetujui tim.

**Akibat pada skema/kode/data:** SYSTEM-DESIGN 2.3 dan skema `stock_movements.jenis` saat ini mencakup `PERBAIKAN_SELESAI` dan `AFKIR`, tetapi tidak `TANDAI_RUSAK`; FR-A-09 hanya menyebut penyelesaian perbaikan/afkir dan FR-A-10 penyesuaian stok. Untuk opsi A, usulan mutasi atomik per barang: `delta_total = 0`, `delta_tersedia = -n`, `delta_rusak = +n`, alasan wajib, `0 < n <= tersedia`, kunci baris, dan transaksi InnoDB yang menjaga BR-01. Tambahkan `TANDAI_RUSAK` ke ENUM, aksi admin, izin/validasi server, audit log, dan tes. PRD dapat menambah BR-34 untuk pemindahan unit dan memperjelas FR-A-09/10 serta T-5.36. Opsi B menghindari jenis baru tetapi membuat buku besar kurang spesifik dan perlu memastikan aturan KURANG_STOK memperbolehkan delta rusak positif.

**Rekomendasi (bukan keputusan):** Opsi A membuat perpindahan tersedia-ke-rusak dapat diaudit dengan makna yang tegas, khususnya untuk hitung fisik 6.3.

**Keputusan:** Opsi A. Tambah jenis mutasi `TANDAI_RUSAK` (tersedia -n, rusak +n, total tetap, alasan wajib, 0 < n <= tersedia). Alasan: perpindahan dari tersedia ke rusak saat hitung fisik dan temuan kerusakan harus tercatat bermakna jelas di buku besar, bukan tersamar sebagai penyesuaian umum.

## 11. Format Kode Klaim

**Pertanyaan:** Apakah format kode klaim yang sudah tertulis di PRD BR-17 dan SYSTEM-DESIGN dipertahankan, atau ingin format lain?

**Temuan dokumen:** Premis task menyebut BR-17 hanya mengatur kode pinjam, tetapi PRD saat ini juga secara eksplisit menetapkan kode klaim `KMB-XXXXXX`, dengan format/alfabet yang sama seperti kode pinjam. SYSTEM-DESIGN juga memiliki `return_claims.kode_klaim VARCHAR(12)` unik dan catatan implementasi memakai `crypto.randomInt`. Ini dicatat sebagai selisih yang perlu diputuskan, bukan diubah di S03.

**Opsi:** (A) pertahankan `KMB-XXXXXX` seperti BR-17 saat ini; (B) ubah prefix/panjang/alfabet; (C) gunakan identitas lain dan revisi alur bukti/lookup.

**Akibat pada skema/kode/data:** Opsi A sesuai kolom `kode_klaim VARCHAR(12)` dan uniqueness saat ini. Opsi B/C dapat memerlukan perubahan validasi, indeks unik/ukuran kolom, generator, endpoint lookup, bukti cetak, tes, dan migrasi jika pernah ada kode tersimpan. Kode pinjam `PJM-XXXXXX` adalah identitas terpisah.

**Rekomendasi (bukan keputusan):** Pertahankan format yang sudah tercatat kecuali ada kebutuhan operasional khusus; ini menghindari perubahan API dan bukti tanpa manfaat yang teridentifikasi.

**Keputusan:** Opsi A. Pertahankan `KMB-XXXXXX` dengan alfabet dan panjang yang sama seperti kode pinjam. Alasan: sesuai BR-17 dan `return_claims.kode_klaim VARCHAR(12)`, dan tidak ada kebutuhan operasional untuk format lain.

## 12. Bahasa Server v5

**Pertanyaan:** Apakah backend v5 ditulis dalam TypeScript (dijalankan saat pengembangan dengan `tsx`) atau JavaScript ESM?

**Opsi:** (A) TypeScript + `tsx`; (B) JavaScript ESM.

**Akibat pada skema/kode/data:** Tidak mengubah skema atau data. Opsi A memakai konsistensi tipe dengan frontend TypeScript dan membutuhkan konfigurasi skrip/build/backend yang tepat. Opsi B lebih dekat dengan prototipe `server.js` dan mengurangi konfigurasi kompilasi, tetapi kontrak tipe perlu dijaga dengan cara lain. `package.json` saat ini sudah memiliki TypeScript, `tsx`, dan skrip server JavaScript; pilihan backend v5 tetap terbuka.

**Rekomendasi (bukan keputusan):** Opsi A memberi pemeriksaan tipe lintas kontrak API dan frontend; jaga prototipe JavaScript tetap terpisah sesuai strategi berdampingan.

**Keputusan:** Opsi A. Backend TypeScript, dijalankan dengan `tsx` saat pengembangan; cara menjalankan di produksi (tsx atau kompilasi) diputuskan pada Task 6.6. Alasan: frontend sudah TypeScript, sehingga tipe kontrak API dapat dibagi dan kesalahan tipe tertangkap sebelum berjalan.

## 13. Strategi Dua Sistem Berdampingan

**Pertanyaan:** Apakah strategi Lampiran A di [PANDUAN-EKSEKUSI.md](PANDUAN-EKSEKUSI.md) disetujui, atau apa yang perlu diubah sebelum diterapkan pada SYSTEM-DESIGN?

**Opsi:** (A) setuju dengan prinsip pemisahan, port dev, flag UI, migrasi sekali, dan peralihan setelah UAT; (B) setuju dengan perubahan terdaftar; (C) ganti strategi dengan usulan tim.

**Akibat pada skema/kode/data:** Strategi draf menambah v5 berdampingan, tidak menulis ke sumber lama atau melakukan dual-write, memisahkan kode lama/v5, memakai server dev 3001/3002 dan flag `VITE_UI=v5`, memisahkan data uji dari data nyata, lalu migrasi final satu kali dan mempertahankan kode lama sementara. Perlu direkonsiliasi dengan SYSTEM-DESIGN bagian 13 yang saat ini masih menggambarkan prototipe SQLite serta menyebut jalur `server/db/`, sedangkan Lampiran A memakai `server/`, `src/v5/`, dan `src/api/`. Sumber database lama juga harus menjadi PostgreSQL JSONB berdasarkan audit. Perubahan berimbas pada layout proyek, proxy Vite, alur pengembangan, task migrasi, risiko dua sistem menerima input, dan waktu penghapusan kode lama.

**Rekomendasi (bukan keputusan):** Pertahankan prinsip tidak mengubah prototipe dan tidak melakukan dual-write; setujui atau koreksi jalur direktori, port, flag, serta gerbang migrasi secara eksplisit bersama pengembang lain karena menyentuh berkas bersama dan batas arsitektur.

**Keputusan:** Opsi A (prinsip): v5 dibangun berdampingan tanpa mengubah prototipe, tanpa dual-write, dengan satu migrasi akhir dan peralihan setelah UAT. Jalur direktori (`server/`, `src/v5/`, `src/api/`), port dev 3001 dan 3002, serta flag `VITE_UI=v5` disetujui pengembang lain lewat PR dokumen. Alasan: strategi ini menyentuh berkas bersama milik rekan, jadi persetujuannya diminta sebelum kode dimulai; Lampiran A disinkronkan ke SYSTEM-DESIGN bagian 13 dengan sumber lama PostgreSQL JSONB.

## 14. Daftar Pertanyaan PRD Bagian 14

Daftar ini menjaga seluruh ID pertanyaan PRD tetap terlacak. Q-1, Q-2, Q-4, dan Q-5 sudah dijawab di PRD dan tidak diajukan ulang. Q-3, Q-6, Q-7, serta tanggung jawab operasional Q-8 dirinci pada bagian 2–6 di atas. D-13 pada Q-8 dicatat selesai di bagian 1.

| ID PRD | Status yang tercatat di PRD | Tindak lanjut S03 |
|---|---|---|
| Q-1 | Dijawab: peminjam dari semua divisi | Tidak dibuka ulang |
| Q-2 | Dijawab: pakai nilai rekomendasi PRD bagian 8 | Tidak dibuka ulang |
| Q-3 | Jawaban “ya” masih ambigu antara printer fisik dan struk cukup di layar | Minta konfirmasi, bagian 4 |
| Q-4 | Dijawab: kiosk memiliki keyboard fisik | Tidak dibuka ulang |
| Q-5 | Dijawab: satu admin aktif | Tidak dibuka ulang |
| Q-6 | “Ya boleh” ditafsirkan sebagai ada barang yang dikecualikan, tetapi perlu konfirmasi | Minta konfirmasi, bagian 5 |
| Q-7 | Terbuka: manual atau otomatis setelah satu hari, dengan konfirmasi pengambilan | Minta keputusan, bagian 6 |
| Q-8 | D-13 sudah diputuskan; penanggung jawab backup/restart/kata sandi masih terbuka | Bagian 1 dan 2 |
| Tambahan tim | Mesin tempat MySQL dipasang belum ditetapkan | Minta keputusan, bagian 3 |

## 15. Bahan Perbaikan Dokumen untuk S04

Tidak ada perbaikan PRD/SYSTEM-DESIGN yang diterapkan sekarang. Daftar ini adalah tindak lanjut berdasarkan [AUDIT-0.2.md bagian 8](AUDIT-0.2.md#8-tabel-pemetaan-data-lama-ke-skema-v5-system-design-bagian-6) dan [bagian 9](AUDIT-0.2.md#9-daftar-selisih-lain-antara-kode-prototipe-dan-system-design):

1. **Sumber migrasi:** PostgreSQL `app_state.data` JSONB, bukan SQLite. Rekonsiliasi TODO 6.1, SYSTEM-DESIGN bagian 11, PRD FR-S-03/D-13, README, dan instruksi migrasi pada S04.
2. **Pemetaan data lama:** `category` ke kategori relasional; kategori kosong/NULL perlu kebijakan kategori sementara. `condition` tidak menjadi kolom; `perlu_perbaikan`/nilai tak dikenal masuk daftar hitung fisik. `borrower_type` dipetakan bila dapat dikenali, nilai kosong/ambigu perlu default dan log migrasi. `division` perlu pemetaan ejaan sebelum FK. `returned_date`/`status` tidak punya padanan kolom langsung; `notes` mencampur catatan dan audit; `return_condition` dipindah ke klaim/verifikasi. Pertahankan mapping ID lama ke ID baru dan verifikasi semua pemetaan.
3. **Selisih arsitektur dari audit bagian 9:** prototipe langsung mengembalikan stok, pencarian kiosk memakai nama/divisi, belum mendukung pengembalian parsial, tidak mempunyai ledger stok, belum memiliki perpanjangan, koreksi menulis ke notes, dan divisi/kategori masih memiliki data hardcoded. Selisih ini perlu tetap menjadi batas migrasi/pemisahan; jangan menulis ulang prototipe secara insidental.
4. **T-5.6 tidak cocok:** PRD bagian 11 mendefinisikan T-5.6 sebagai privasi kiosk (kode salah tidak membocorkan data dan kunci muncul setelah ambang gagal), sedangkan `src/services/tests.ts` menjalankan tes `clearLoans` yang mengosongkan riwayat dan memulihkan stok. Tentukan di S04 apakah PRD atau kode/ID tes yang perlu diselaraskan; jangan menyatakan keduanya menguji perilaku yang sama.
5. **TANDAI_RUSAK dan kondisi lama:** pastikan usulan bagian 10 masuk ke revisi PRD/SYSTEM-DESIGN hanya setelah keputusan; perlakukan `perlu_perbaikan` sebagai daftar hitung fisik, bukan konversi otomatis.

## 16. Catatan Proses

- S03 hanya menyiapkan bahan keputusan. Tidak ada perubahan pada PRD atau SYSTEM-DESIGN.
- Setelah kolom **Keputusan** untuk seluruh butir terbuka diisi, diskusikan D-13 dan strategi dua sistem dengan pengembang lain sebelum S04, sesuai alur Panduan Eksekusi.
- S04 baru menerapkan keputusan yang disetujui dan memperbaiki dokumen yang disebut di atas; keputusan terbuka tidak boleh diasumsikan dari rekomendasi.