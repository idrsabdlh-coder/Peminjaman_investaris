# PRD: Sistem Peminjaman & Inventaris Barang Tim IT

| | |
|---|---|
| **Versi** | 5.3 (draf, menunggu persetujuan tim) |
| **Tanggal** | 12 Oktober 2026 |
| **Pengganti** | Ringkasan "PRD v4.0" yang tertulis di README |
| **Dokumen pendamping** | [`SYSTEM-DESIGN.md`](SYSTEM-DESIGN.md): alur kerja, flowchart, ERD, skema SQL, kontrak API |
| **Basis data** | MySQL (InnoDB) via Laragon. Lihat D-13 dan bagian 10 |
| **Pembaca utama** | Tim pengembang, petugas inventaris IT, kepala tim IT |

> **Cara membaca dokumen ini.** PRD menjawab *apa* yang dibangun dan *mengapa*, termasuk aturan bisnis dan kriteria lulus uji. *Bagaimana* cara membangunnya (diagram, skema, API) ada di `SYSTEM-DESIGN.md`. Setiap aturan hanya didefinisikan sekali di sini (kode `BR-xx`), dan dokumen desain merujuknya.

---

## 1. Ringkasan

Aplikasi web untuk mencatat peminjaman dan pengembalian barang inventaris **tim IT**, menggantikan buku catatan. Aplikasi berjalan di jaringan lokal kantor dan punya dua mode:

- **Kiosk** (layar sentuh, tanpa login): karyawan dari divisi mana pun mencari barang, meminjam atau memesan untuk beberapa hari ke depan, mengecek batas waktu, memperpanjang, dan mengklaim pengembalian.
- **Panel Admin** (wajib login): petugas IT mengelola barang, **memverifikasi pengembalian**, memantau peminjaman, menangani barang rusak, dan mencetak laporan.

Prinsip utama versi 5.0: **stok hanya berubah lewat transaksi yang divalidasi server**, dan **stok kembali hanya setelah petugas memeriksa barang fisiknya**.

## 2. Latar belakang dan masalah

| Masalah pada buku catatan / versi prototipe | Dampak |
|---|---|
| Tidak ada verifikasi saat barang kembali | Barang rusak atau kurang bisa tercatat "baik" |
| Peminjam tidak tahu kapan harus mengembalikan | Keterlambatan sulit ditagih |
| Pengembalian harus sekaligus | Tidak realistis; peminjaman 3 unit sering dikembalikan bertahap |
| Barang rusak langsung bisa dipinjam lagi | Peminjam berikutnya menerima barang yang tidak layak |
| Login hanya dicek di browser (prototipe) | Data bisa diubah siapa saja di jaringan |
| Stok dihitung di sisi klien (dugaan) | Dua kiosk bisa menimpa data satu sama lain |

## 3. Tujuan

1. Seluruh peminjaman barang IT tercatat di sistem, dan buku catatan dihentikan.
2. Angka stok dapat dipercaya: selalu cocok dengan barang fisik setelah verifikasi.
3. Peminjam dapat mandiri: meminjam, melihat batas waktu, memperpanjang, dan mengklaim pengembalian tanpa bertanya ke petugas.
4. Petugas punya jejak lengkap: siapa meminjam, kapan jatuh tempo, apa catatan pengembalian, apa hasil verifikasinya.

**Usulan target keberhasilan** (dapat disesuaikan setelah sebulan pemakaian):

| Metrik | Target |
|---|---|
| Median waktu menyelesaikan form peminjaman di kiosk | ≤ 2 menit |
| Median waktu klaim menunggu verifikasi | ≤ 1 hari kerja |
| Kejadian stok negatif atau invarian stok rusak | 0 |
| Selisih stok sistem vs hitung fisik pada opname pertama | ≤ 2% dari total unit |
| Peminjaman yang masih dicatat di luar sistem | 0 setelah bulan pertama |

## 4. Pengguna

| Peran | Deskripsi | Kebutuhan utama |
|---|---|---|
| **Peminjam** | Karyawan yang meminjam barang IT. Memakai kiosk, tanpa akun. | Proses cepat, tahu batas waktu, bisa memperpanjang, bisa mengembalikan bertahap |
| **Admin / Petugas inventaris** | Anggota tim IT. Login ke panel admin. | Memverifikasi barang yang kembali, memantau keterlambatan, mengelola stok |
| **Pembaca laporan** | Kepala tim IT atau pihak yang meminta rekap. | Laporan PDF yang akurat dan mudah dibaca |

## 5. Ruang lingkup

### 5.1 Dalam cakupan v5.0

- Katalog barang, form peminjaman (tanggal pinjam dapat dipilih, termasuk **pemesanan** beberapa hari ke depan), struk dengan kode pinjam
- **Pembatalan pemesanan** oleh peminjam (sebelum tanggal pinjam) dan pembatalan peminjaman oleh admin
- **Daftar divisi** yang dikelola admin (pilihan di form, bukan teks bebas)
- Cek peminjaman dengan kode pinjam, termasuk **batas waktu pengembalian**
- **Pengembalian parsial** dengan klaim di kiosk dan **verifikasi admin**
- **Catatan per transaksi pengembalian**, terlihat di panel admin
- **Perpanjangan peminjaman** oleh peminjam (dengan aturan) dan oleh admin
- Penanganan barang rusak: stok terpisah, perbaikan atau afkir oleh admin
- Kelola barang, pemantauan peminjaman, koreksi, laporan PDF
- Autentikasi server-side, jejak audit, backup otomatis

### 5.2 Di luar cakupan v5.0 (lihat roadmap, bagian 13)

Notifikasi WhatsApp/email, barcode/QR per barang, nomor seri per unit, kalender ketersediaan per tanggal (pemesanan di v5.1 menahan stok sejak dipesan), konfirmasi pengambilan dan pelepasan otomatis pemesanan yang tidak diambil, master data karyawan, banyak level peran admin, foto barang, denda, persetujuan peminjaman sebelum barang diambil.

### 5.3 Kebutuhan Tambahan (diputuskan di Task 0.1)

#### 5.3.1 Kategori barang

Kategori dikelola admin (tambah, ubah nama, nonaktifkan) dan menjadi atribut wajib setiap barang. Fungsinya: filter di katalog kiosk dan filter laporan admin. Implementasinya sejajar dengan divisi: nonaktifkan, tidak hapus, agar riwayat tetap terbaca.

#### 5.3.2 Kondisi barang

Kondisi barang **tidak lagi disimpan sebagai teks bebas per jenis barang**. Kondisi diturunkan secara otomatis dari angka stok:

| Kondisi (turunan) | Syarat |
|---|---|
| **Baik** | `tersedia = total` (tidak ada unit rusak maupun dipinjam) |
| **Sebagian rusak** | `0 < rusak < total` |
| **Semua rusak** | `rusak = total` (dan `tersedia = 0`, tidak ada yang dipinjam) |

Kondisi ini hanya untuk tampilan ringkasan (katalog, laporan stok). Kondisi unit per transaksi (baik/rusak/hilang pada klaim) tetap disimpan di `return_claim_lines.kondisi_dilaporkan`.

> [!NOTE] Nilai lama `perlu_perbaikan` dari prototipe tidak punya padanan angka unit. Nilai itu tidak ditebak saat migrasi, melainkan masuk **daftar periksa hitung fisik** (bagian 11, langkah 5).

#### 5.3.3 Tipe peminjam

Setiap form peminjaman di kiosk wajib memilih **tipe peminjam**: **Karyawan** atau **Magang** (nilai ENUM basis data huruf kecil `'karyawan'` atau `'magang'`, label antarmuka tetap Karyawan dan Magang). Nilai ini disimpan di `loans.tipe_peminjam` dan dipakai untuk:

- Filter di panel pemantauan peminjaman admin (FR-A-05).
- Filter dan pengelompokan di laporan PDF dan ekspor (FR-A-11).
- Klasifikasi di form kiosk (FR-K-02).

Tipe peminjam **tidak mengubah kuota, durasi, atau aturan bisnis apa pun**. Ini murni klasifikasi untuk filter dan laporan.

### 5.4 Asumsi (mohon dikonfirmasi)

| ID | Asumsi |
|---|---|
| A-1 | Sistem khusus untuk inventaris divisi IT kantor. Peminjam adalah karyawan dari semua divisi (terkonfirmasi). |
| A-2 | Skala: ≤ 300 jenis barang, ≤ 30 peminjaman per hari, ≤ 5 klien bersamaan. |
| A-3 | Satu PC kantor menjadi server aplikasi **dan** basis data (MySQL). Klien berada di jaringan lokal yang sama. MySQL hanya menerima koneksi dari PC itu sendiri. |
| A-4 | Ada petugas IT yang hadir pada jam kerja untuk memverifikasi pengembalian. |
| A-5 | Barang fisik yang dikembalikan diserahkan ke meja/petugas IT (lihat bagian 9.4). |
| A-6 | Ada **1 admin aktif** (terkonfirmasi). |
| A-7 | Kiosk punya keyboard fisik (terkonfirmasi) dan printer (diasumsikan, mohon konfirmasi, lihat bagian 14). |

## 6. Keputusan produk

| ID | Keputusan | Sumber |
|---|---|---|
| **D-1** | Klaim pengembalian **tidak langsung mengubah stok**. Stok berubah setelah admin memverifikasi. | Diputuskan pemilik produk |
| **D-2** | Barang rusak **tidak masuk `tersedia`**. Masuk stok `rusak`, dan admin yang memindahkannya ke `tersedia` setelah diperbaiki (atau mengafkirnya). | Diputuskan pemilik produk |
| **D-3** | Catatan/keterangan berlaku **per transaksi pengembalian** (satu catatan untuk satu klaim). | Diputuskan pemilik produk |
| **D-4** | Peminjam dapat melihat **batas waktu pengembalian**, sisa hari, dan hari terlambat lewat kode pinjam. | Usulan pemilik produk, dirinci di dokumen ini |
| **D-5** | **Perpanjangan self-service otomatis disetujui** dalam batas aturan (BR-11). Di luar aturan, hanya admin yang dapat memperpanjang. | Usulan, perlu konfirmasi |
| **D-6** | **Tanggal pinjam dapat dipilih**, mulai hari ini sampai `maks_booking_hari` ke depan (pemesanan). Tanggal masa lalu tidak diizinkan di kiosk. Admin dapat mengoreksi dengan alasan. | Diputuskan pemilik produk |
| **D-7** | Pengembalian dan cek peminjaman memakai **kode pinjam** sebagai kunci identitas. | Usulan, perlu konfirmasi |
| **D-8** | **Keterlambatan berhenti dihitung saat klaim dikirim**, bukan saat admin memverifikasi. Jika klaim ditolak, hitungan pulih. | Usulan, perlu konfirmasi |
| **D-9** | Admin boleh **mengubah kondisi** yang dilaporkan peminjam, dengan catatan admin wajib bila berbeda atau menolak. | Usulan, perlu konfirmasi |
| **D-10** | **Pemesanan menahan stok sejak dibuat.** Unit yang dipesan langsung keluar dari `tersedia` dan tampil sebagai "Dipesan" sampai tanggal pinjam. Peminjam dapat membatalkan sebelum tanggal pinjam. | Usulan, perlu konfirmasi |
| **D-11** | **Divisi dipilih dari daftar** yang dikelola admin, bukan diketik. | Usulan, perlu konfirmasi |
| **D-12** | Setiap barang punya penanda **boleh diperpanjang** (default ya). Peminjaman yang memuat barang bertanda "tidak boleh diperpanjang" tidak dapat diperpanjang sendiri oleh peminjam. Admin tetap dapat memperpanjang. | Usulan, perlu konfirmasi |
| **D-13** | **Basis data: MySQL (InnoDB)** menggantikan SQLite. Hanya satu mesin basis data yang didukung, tanpa mode ganda. Berkas SQLite prototipe hanya menjadi sumber migrasi dan arsip. | Rencana pemilik produk, konfirmasi akhir di task 0.4 |

**Mengapa D-5 otomatis dan bukan antrean persetujuan.** Admin sudah memikul verifikasi pengembalian. Menambah antrean persetujuan perpanjangan menggandakan beban yang sama untuk keputusan berisiko rendah. Batas kuota dan durasi sudah membatasi penyalahgunaan, dan semua perpanjangan tercatat. Jika dalam praktik perpanjangan sering disalahgunakan, ubah ke antrean persetujuan (parameter `perpanjangan_butuh_persetujuan`, lihat roadmap).

**Mengapa D-10 menahan stok sejak dipesan.** Alternatifnya adalah kalender ketersediaan per tanggal (stok baru berkurang pada tanggal pinjam), yang jauh lebih rumit karena setiap permintaan harus memeriksa tumpang-tindih tanggal. Pada skala asumsi A-2, menahan stok dengan rentang pendek (7 hari) sudah cukup. Harganya satu: unit yang dipesan tampak tidak tersedia bagi orang lain selama masa tunggu. Bila itu mulai mengganggu, naik ke kalender ketersediaan (roadmap).

**Mengapa MySQL.** Pada skala asumsi A-2 (≤ 30 peminjaman per hari, ≤ 5 klien), SQLite sebenarnya sudah cukup secara teknis, sehingga pindah ke MySQL perlu alasan yang sungguh dimiliki tim. Alasan yang sah: (1) alat bawaan Laragon (HeidiSQL, phpMyAdmin) memudahkan tim memeriksa data, dan (2) penguncian per baris pada InnoDB lebih nyaman untuk beberapa klien yang menulis bersamaan. Harganya: satu layanan tambahan yang harus menyala, dicadangkan, dan diamankan sendiri. *[Hapus butir alasan yang bukan alasan tim sebenarnya.]*

## 7. Istilah dan status

### 7.1 Kondisi unit barang

Setiap unit barang selalu berada di tepat satu keadaan:

| Keadaan | Arti |
|---|---|
| **Tersedia** | Di tempat penyimpanan dan boleh dipinjam |
| **Dipesan** | Dipesan untuk tanggal pinjam di masa depan. Masih di tempat penyimpanan tetapi ditahan, tidak boleh dipinjam orang lain. Dihitung sebagai bagian dari Dipinjam pada BR-01. |
| **Dipinjam** | Dibawa peminjam dan belum diklaim kembali |
| **Menunggu Verifikasi** | Sudah diklaim kembali oleh peminjam, belum diperiksa admin |
| **Rusak** | Sudah diperiksa dan rusak, belum diperbaiki. Tidak boleh dipinjam. |
| **Hilang / Afkir** | Keluar permanen dari inventaris (mengurangi total) |

### 7.2 Status peminjaman (diturunkan, tidak disimpan)

| Status utama | Syarat |
|---|---|
| **Dipesan** | Tanggal pinjam masih di masa depan dan belum dibatalkan |
| **Dipinjam** | Tanggal pinjam ≤ hari ini, ada unit belum diklaim, dan hari ini ≤ batas kembali |
| **Terlambat** | Ada unit belum diklaim dan hari ini > batas kembali |
| **Menunggu Verifikasi** | Semua unit sudah diklaim, sebagian masih menunggu admin |
| **Selesai** | Semua unit sudah diverifikasi, tidak ada yang tersisa |
| **Dibatalkan** | Pemesanan atau peminjaman dibatalkan sebelum ada klaim. Stok sudah dikembalikan |

Penanda tambahan (lencana) yang dapat tampil bersamaan: **Sebagian** (sudah ada unit yang diklaim/diverifikasi), **Ada klaim menunggu**, **Diperpanjang n×**, **Ada catatan**.

## 8. Aturan bisnis

| ID | Aturan |
|---|---|
| **BR-01** | **Invarian stok.** Untuk setiap barang: `tersedia + rusak + dipinjam + menunggu_verifikasi = total`, dengan semua nilai ≥ 0 dan `dipinjam` sudah termasuk unit yang dipesan. Dilanggar berarti ada bug. |
| **BR-02** | Peminjaman atau pemesanan mengurangi `tersedia` saat transaksi dibuat (bukan saat tanggal pinjam tiba, D-10). Jumlah tidak boleh melebihi `tersedia`. Divalidasi server. |
| **BR-03** | Klaim pengembalian **tidak mengubah** `total`, `tersedia`, maupun `rusak`. Unit berpindah dari "Dipinjam" ke "Menunggu Verifikasi". |
| **BR-04** | Pada klaim, jumlah per barang tidak boleh melebihi **sisa** = `qty_dipinjam − menunggu − terverifikasi (baik+rusak+hilang)`. Divalidasi server pada saat transaksi, bukan hanya di layar. Klaim hanya dapat dibuat bila tanggal pinjam ≤ hari ini: pemesanan yang belum dimulai tidak dapat diklaim, hanya dapat dibatalkan. |
| **BR-05** | Verifikasi admin membagi tiap baris klaim ke empat hasil: **baik** (`tersedia` +), **rusak** (`rusak` +), **hilang** (`total` −), **ditolak** (kembali ke "Dipinjam"). Jumlah keempatnya harus sama dengan jumlah baris klaim. |
| **BR-06** | Admin dapat berbeda dari laporan peminjam. Jika hasil berbeda dari kondisi yang dilaporkan, atau ada unit ditolak, **catatan admin wajib**. |
| **BR-07** | Klaim yang sudah diverifikasi tidak dapat diverifikasi lagi (respons konflik 409). |
| **BR-08** | Kondisi "hilang" baru mengurangi `total` **setelah verifikasi**, bukan saat klaim. |
| **BR-09** | Perbaikan oleh admin: `rusak −n, tersedia +n`. Afkir: `rusak −n, total −n` dengan alasan wajib. `n` tidak boleh melebihi `rusak`. |
| **BR-10** | **Keterlambatan.** Peminjaman terlambat bila masih ada unit belum diklaim dan hari ini > batas kembali. Hari terlambat adalah selisih hari kalender (zona Asia/Jakarta). Saat klaim dikirim, hari terlambat saat itu **dibekukan** pada klaim. Bila klaim ditolak, unit kembali ke "Dipinjam" dan hitungan terlambat berjalan lagi dari batas kembali. |
| **BR-11** | **Perpanjangan oleh peminjam** diizinkan hanya bila: (a) masih ada unit belum diklaim, (b) hari ini ≤ batas kembali (belum terlambat), (c) jumlah perpanjangan sebelumnya < `maks_perpanjangan`, (d) tambahan 1 sampai `maks_hari_per_perpanjangan` hari, (e) tanggal pinjam ≤ hari ini, dan (f) semua barang yang belum diklaim bertanda **boleh diperpanjang** (D-12). |
| **BR-12** | Batas kembali baru = **batas kembali saat ini + tambahan hari** (bukan dari hari ini), agar memperpanjang lebih awal tidak merugikan peminjam dan memperpanjang di hari terakhir tidak menguntungkan. Berlaku untuk seluruh unit yang belum diklaim. |
| **BR-13** | **Perpanjangan oleh admin** tidak dibatasi kuota dan boleh untuk peminjaman terlambat, tetapi **alasan wajib** dan tercatat sebagai perpanjangan dengan pelaku admin. |
| **BR-14** | Barang tidak dapat dihapus (soft-delete) selama ada unit Dipinjam atau Menunggu Verifikasi. Bila `rusak > 0`, selesaikan dulu lewat perbaikan atau afkir. |
| **BR-15** | Penyesuaian total oleh admin (tambah/kurang) wajib beralasan dan tidak boleh membuat `tersedia` negatif. |
| **BR-16** | Koreksi peminjaman oleh admin (nama, divisi, telepon, batas kembali, tanggal pinjam, jumlah item) wajib beralasan dan tercatat sebagai riwayat. Jumlah item hanya dapat dikoreksi bila belum ada klaim pada barang itu, dan efeknya ke stok dicatat. |
| **BR-17** | **Kode pinjam** dibuat server, acak, berformat `PJM-XXXXXX` dari 31 karakter yang tidak ambigu (huruf kecuali I, L, O, dan angka 2–9), sehingga ada sekitar 887 juta kombinasi. **Kode klaim** memakai format dan alfabet yang sama, berformat `KMB-XXXXXX`. |
| **BR-18** | Kiosk hanya menampilkan data peminjaman milik kode yang dimasukkan. Telepon peminjam tidak pernah tampil di kiosk. Percobaan kode gagal dibatasi (lihat bagian 10). |
| **BR-19** | Sesi admin berakhir otomatis setelah 15 menit tanpa aktivitas, ditegakkan di server. Tidak ada registrasi publik. |
| **BR-20** | Setiap transaksi tulis dari kiosk membawa **kunci idempotensi**. Permintaan ulang dengan kunci sama (misalnya klik ganda) tidak membuat transaksi kedua. |
| **BR-21** | Tanggal disimpan sebagai `YYYY-MM-DD` zona Asia/Jakarta, dan waktu kejadian sebagai waktu UTC. |
| **BR-22** | Item yang sama tidak boleh muncul dua kali dalam satu form peminjaman. Minimal satu barang per peminjaman. |
| **BR-23** | Tanggal pinjam ≥ hari ini dan ≤ hari ini + `maks_booking_hari`. Batas kembali ≥ tanggal pinjam dan ≤ tanggal pinjam + `maks_durasi_awal_hari`. |
| **BR-24** | **Pembatalan pemesanan oleh peminjam**: hanya bila hari ini < tanggal pinjam dan belum dibatalkan. Efek: `tersedia +n`, peminjaman berstatus Dibatalkan, tercatat di buku besar. |
| **BR-25** | **Pembatalan peminjaman oleh admin**: boleh selama belum ada klaim pada peminjaman itu (misalnya peminjam tidak pernah mengambil barang). Alasan wajib. Efeknya sama dengan BR-24. |
| **BR-26** | Pemesanan tidak dapat diperpanjang. Untuk mengganti tanggal, batalkan lalu pesan ulang. |
| **BR-27** | **Divisi** dipilih dari daftar divisi aktif. Divisi tidak dihapus, hanya dinonaktifkan, agar riwayat tetap utuh. |
| **BR-28** | **Kategori** dipilih dari daftar kategori aktif. Setiap barang harus memiliki kategori. Kategori tidak dihapus, hanya dinonaktifkan, agar riwayat tetap terbaca. |
| **BR-29** | **Kondisi barang** diturunkan dari angka stok: Baik (`rusak = 0`), Sebagian rusak (`0 < rusak < total`), Semua rusak (`rusak = total` dan `tersedia = 0`). Kondisi bukan kolom tersimpan, melainkan kalkulasi tampilan. |
| **BR-30** | **Tipe peminjam** wajib diisi di form kiosk: label tampilan `Karyawan` atau `Magang`, disimpan di `loans.tipe_peminjam` sebagai ENUM huruf kecil `'karyawan'` atau `'magang'`. Nilai ini tidak memengaruhi kuota, durasi, atau aturan bisnis lain. |
| **BR-31** | Katalog kiosk dapat difilter berdasarkan kategori. Filter kategori menggunakan daftar kategori aktif yang sama dengan yang dipakai admin. |
| **BR-32** | Laporan admin (FR-A-11) dapat difilter atau dikelompokkan berdasarkan kategori barang dan tipe peminjam. |
| **BR-33** | Barang tidak dapat dihapus bila kategorinya dinonaktifkan. Untuk menonaktifkan kategori, semua barang aktif di kategori itu harus dipindah ke kategori lain terlebih dahulu. |

### Parameter yang dapat diatur admin

| Kunci | Nilai rekomendasi | Alasan |
|---|---|---|
| `maks_durasi_awal_hari` | 7 | Rentang maksimal batas kembali dari tanggal pinjam. Dibuat pendek agar ada titik periksa berkala |
| `maks_perpanjangan` | 2 | Cukup untuk kebutuhan wajar. Lebih dari itu berarti kebutuhannya jangka panjang dan sebaiknya lewat admin |
| `maks_hari_per_perpanjangan` | 7 | Sama dengan durasi awal, mudah diingat peminjam |
| `maks_booking_hari` | 7 | Seberapa jauh ke depan boleh memesan. Makin jauh, makin lama stok ditahan |
| `sesi_idle_menit` | 15 | Idle admin sebelum sesi berakhir |
| `kiosk_idle_detik` | 60 | Idle kiosk sebelum layar kembali ke beranda |
| `kiosk_lookup_maks_gagal` | 5 | Kode salah berturut-turut sebelum dikunci |
| `kiosk_lookup_kunci_menit` | 5 | Lama penguncian lookup |

Dengan nilai di atas, batas pinjam maksimal tanpa campur tangan admin adalah 7 + (2 × 7) = **21 hari**. Tinjau setelah sebulan pemakaian: bila lebih dari sepertiga peminjaman selalu memakai kuota perpanjangan penuh, naikkan `maks_durasi_awal_hari`.

## 9. Kebutuhan fungsional

Prioritas: **M** = Must (wajib v5.0), **S** = Should (sangat disarankan), **C** = Could (jika sempat).

### 9.1 Mode Kiosk

| ID | Kebutuhan | P |
|---|---|---|
| **FR-K-01** | **Katalog dan cek stok.** Daftar barang dengan nama dan jumlah `tersedia`. Barang `tersedia = 0` tidak dapat dipilih. Pencarian instan berdasarkan nama. Filter berdasarkan **kategori** (BR-31). Jumlah rusak/menunggu tidak ditampilkan ke karyawan. | M |
| **FR-K-02** | **Form peminjaman.** Isian: nama peminjam (2–100 karakter), divisi (**pilihan dari daftar**, wajib), **tipe peminjam** (`Karyawan` atau `Magang`, wajib, BR-30), telepon (opsional, 8–15 digit), **tanggal pinjam** (default hari ini, dapat dipilih sampai `maks_booking_hari` ke depan, D-6), batas kembali, dan daftar barang beserta jumlah. Bila tanggal pinjam di masa depan, layar menegaskan bahwa stok **ditahan mulai sekarang** (D-10). Validasi sesuai BR-02, BR-22, BR-23, BR-30, dilakukan di klien dan di server. | M |
| **FR-K-03** | **Struk peminjaman siap cetak.** Memuat kode pinjam (huruf besar), nama, divisi, tanggal pinjam (dengan penanda **PEMESANAN** bila di masa depan), **batas kembali**, daftar barang dan jumlah, serta petunjuk singkat cara mengembalikan. | M |
| **FR-K-04** | **Cek peminjaman.** Input kode pinjam menampilkan kartu peminjaman: per barang `dipinjam / menunggu verifikasi / sudah terverifikasi / sisa`, **batas kembali**, **penghitung mundur** ("Sisa 3 hari" atau "Terlambat 2 hari"), jumlah perpanjangan terpakai dan sisa kuota, serta riwayat klaim beserta statusnya. Untuk pemesanan, kartu menampilkan "Dipesan, mulai [tanggal]" dan tombol **Batalkan pemesanan** sebagai ganti Kembalikan dan Perpanjang. | M |
| **FR-K-05** | **Klaim pengembalian parsial.** Dari kartu peminjaman: per barang, peminjam mengisi jumlah **Baik / Rusak / Hilang**, dengan total per barang ≤ sisa (BR-04). Satu kolom **catatan pengembalian** per klaim (opsional, ≤ 500 karakter, D-3). Tombol dinonaktifkan bila sisa 0. | M |
| **FR-K-06** | **Bukti klaim.** Setelah berhasil: kode klaim, isi klaim, status "Menunggu Verifikasi", dan pengingat untuk menyerahkan barang fisik ke petugas. Dapat dicetak. | M |
| **FR-K-07** | **Perpanjangan.** Dari kartu peminjaman: pilih tambahan hari (1 sampai batas), alasan opsional. Layar menampilkan batas kembali lama dan baru sebelum konfirmasi. Bila tidak memenuhi BR-11, tombol tidak aktif disertai alasan yang jelas ("Sudah terlambat, hubungi petugas IT"). | M |
| **FR-K-08** | **Bukti perpanjangan** yang menampilkan batas kembali baru, dapat dicetak. | S |
| **FR-K-09** | **Hasil klaim terlihat peminjam.** Pada kartu peminjaman, klaim yang sudah diverifikasi menampilkan hasilnya (baik/rusak/hilang/ditolak) dan **catatan admin**. Admin diberi petunjuk di formnya bahwa catatan itu terlihat peminjam. | S |
| **FR-K-10** | **Auto-reset kiosk.** Setelah `kiosk_idle_detik` tanpa interaksi, layar memberi hitung mundur lalu kembali ke beranda dan menghapus isian. Tidak ada data peminjam yang disimpan di penyimpanan browser. | M |
| **FR-K-11** | Elemen sentuh minimal 44×44 px, dan teks utama terbaca dari jarak lengan. | S |
| **FR-K-12** | **Batalkan pemesanan.** Selama hari ini < tanggal pinjam, peminjam dapat membatalkan lewat kartu peminjaman dengan konfirmasi. Stok kembali ke `tersedia` (BR-24). | M |

### 9.2 Panel Admin

| ID | Kebutuhan | P |
|---|---|---|
| **FR-A-01** | **Login dan sesi** (BR-19). Email dan password. Password disimpan sebagai hash. Percobaan login gagal dibatasi. Halaman login **tidak menampilkan** akun atau password apa pun. Tombol logout. | M |
| **FR-A-02** | **Akun admin.** Admin dapat mengganti password sendiri, menambah admin baru, dan menonaktifkan admin lain (tanpa registrasi publik). Akun awal dibuat lewat skrip seed yang meminta password saat dijalankan. | M |
| **FR-A-03** | **Kelola barang.** Tambah, ubah, hapus (soft-delete, BR-14). Saat ditambah, `tersedia = total`, `rusak = 0`. Setiap barang wajib memiliki **kategori** (BR-28, BR-33) dan penanda **boleh diperpanjang** (default ya, D-12). Pencarian dan pagination. Kondisi barang ditampilkan sebagai turunan stok (BR-29). | M |
| **FR-A-04** | **Antrean verifikasi.** Daftar klaim berstatus menunggu, terlama di atas, dengan lencana jumlah di menu. Detail klaim menampilkan: peminjam, batas kembali, **hari terlambat saat klaim**, **catatan peminjam (disorot)**, isi klaim per barang. Per baris admin membagi jumlah ke Baik/Rusak/Hilang/Ditolak (BR-05). Tersedia aksi cepat **"Setujui sesuai laporan"** untuk kasus tanpa perbedaan. Catatan admin wajib sesuai BR-06. | M |
| **FR-A-05** | **Pemantauan peminjaman.** Ringkasan: Dipinjam, Terlambat, Menunggu Verifikasi, Selesai. Filter: status (termasuk **Dipesan** dan **Dibatalkan**), barang, **kategori barang**, divisi, **tipe peminjam**, rentang tanggal, pencarian teks, **Ada catatan**, **Ada kerusakan/kehilangan**. Tombol cepat **Belum Dikembalikan**. Lencana status sesuai bagian 7.2, termasuk "Sisa n dari m" dan "Diperpanjang n×". | M |
| **FR-A-06** | **Detail peminjaman** berupa lini masa kronologis: peminjaman dibuat (menampilkan tipe peminjam), perpanjangan, klaim (dengan catatan peminjam), verifikasi (dengan catatan admin), koreksi. | M |
| **FR-A-07** | **Koreksi peminjaman** sesuai BR-16, dengan alasan wajib. | M |
| **FR-A-08** | **Perpanjangan oleh admin** sesuai BR-13. | M |
| **FR-A-09** | **Stok rusak.** Halaman daftar barang dengan `rusak > 0`. Aksi "Selesai diperbaiki" dan "Afkir" sesuai BR-09, dengan jumlah dan catatan. | M |
| **FR-A-10** | **Penyesuaian stok** (tambah/kurang) sesuai BR-15. | M |
| **FR-A-11** | **Laporan PDF**: (1) rekap peminjaman mengikuti filter (termasuk filter kategori dan tipe peminjam, BR-32), (2) barang belum dikembalikan dengan batas kembali dan sisa, serta daftar pemesanan yang belum dimulai, (3) stok dan kondisi: total, tersedia, dipinjam, menunggu, rusak, **dikelompokkan per kategori** (BR-32), (4) riwayat pengembalian dan verifikasi termasuk catatan. Tabel sederhana berisi judul, periode, dan waktu cetak. | M |
| **FR-A-12** | **Pengaturan parameter** (bagian 8). | S |
| **FR-A-13** | **Jejak audit** yang dapat dibaca admin: siapa, aksi apa, kapan, pada entitas mana. | S |
| **FR-A-14** | **Ekspor Excel/CSV** untuk laporan 1–4. | C |
| **FR-A-15** | Lencana jumlah antrean verifikasi diperbarui otomatis (polling berkala) tanpa memuat ulang halaman. | S |
| **FR-A-16** | **Kelola divisi.** Tambah, ubah nama, dan nonaktifkan divisi (BR-27). Daftar aktif menjadi pilihan di form kiosk. | M |
| **FR-A-17** | **Batalkan peminjaman** (BR-25) dengan alasan wajib, selama belum ada klaim. | M |
| **FR-A-18** | **Kelola kategori.** Tambah, ubah nama, dan nonaktifkan kategori (BR-28, BR-33). Daftar aktif menjadi pilihan saat menambah/mengubah barang dan menjadi filter di katalog kiosk serta laporan admin. | M |

### 9.3 Sistem

| ID | Kebutuhan | P |
|---|---|---|
| **FR-S-01** | Semua logika peminjaman, klaim, verifikasi, perpanjangan, dan stok berada di **server** dan berjalan dalam transaksi atomik. Klien hanya menampilkan data dan mengirim niat. | M |
| **FR-S-02** | Setiap perubahan stok tercatat di buku besar `stock_movements`, sehingga jumlah seluruh perubahan sama dengan nilai stok sekarang. | M |
| **FR-S-03** | Migrasi data dari prototipe (SQLite) ke skema baru di MySQL tanpa kehilangan data. Dilatih dulu pada basis data percobaan sebelum dijalankan sungguhan (lihat `SYSTEM-DESIGN.md`, bagian 11). | M |
| **FR-S-04** | Backup otomatis harian dengan `mysqldump --single-transaction`, tanpa mematikan server, dengan salinan di perangkat lain (lihat `SYSTEM-DESIGN.md`, bagian 6A.7). | M |
| **FR-S-05** | Server menyajikan hasil build frontend pada **satu port** dan berjalan sebagai layanan yang menyala otomatis. | S |
| **FR-S-06** | **Skrip reset password admin** yang dijalankan dari konsol server. Dengan satu admin aktif, tidak ada admin lain yang dapat mereset. | M |

### 9.4 Prosedur operasional (SOP singkat)

1. **Meminjam.** Karyawan mengisi form di kiosk, mengambil struk, dan menyimpan kode pinjam. Barang diambil dari lokasi penyimpanan. Untuk pemesanan, barang baru diambil pada tanggal pinjam, dan pemesanan dapat dibatalkan lewat kiosk sebelum tanggal itu.
2. **Mengembalikan.** Karyawan membuka *Cek Peminjaman*, memasukkan kode, mengisi klaim (jumlah dan kondisi per barang, catatan), lalu **menyerahkan barang fisik ke petugas IT**.
3. **Verifikasi.** Petugas membuka antrean, memeriksa barang fisik, mencocokkan dengan klaim, lalu mengonfirmasi hasil. Klaim tanpa barang fisik di meja ditolak dengan catatan.
4. **Kode hilang.** Peminjam menghubungi petugas. Petugas mencari peminjaman berdasarkan nama atau tanggal di panel admin dan membacakan kode (tidak dikirim lewat kiosk).
5. **Barang rusak.** Barang berstatus rusak disimpan terpisah dan diberi tanda. Setelah diperbaiki, petugas menandainya selesai di panel admin.
6. **Pemesanan tidak diambil.** Bila barang pemesanan masih ada di tempat penyimpanan setelah tanggal pinjam tiba, petugas membatalkan peminjaman di panel admin (alasan wajib) agar stok kembali tersedia.

## 10. Kebutuhan non-fungsional

| Area | Kebutuhan |
|---|---|
| **Keamanan** | Password di-hash (`argon2id` atau `bcrypt`). Sesi dengan cookie `httpOnly` dan `SameSite=Strict`. Seluruh rute `/api/admin/*` ditolak 401 tanpa sesi. Rate limit login (5 gagal per 15 menit per IP dan email) dan rate limit lookup kode di kiosk (BR-18). Validasi input di server dengan skema tegas. Kueri berparameter. CORS dibatasi ke origin aplikasi. Tidak ada kredensial di kode, README, atau bundle.  Kata sandi basis data dan konfigurasi rahasia berada di `.env` yang tidak masuk Git (disediakan `.env.example`). Akun basis data aplikasi hanya punya hak yang dibutuhkan. MySQL tidak menerima koneksi dari komputer lain, dan port 3306 tidak dibuka di firewall.|
| **Integritas** | Setiap penulisan memakai transaksi InnoDB dengan penguncian baris (`SELECT ... FOR UPDATE`) dalam urutan tetap, dan deadlock diulang otomatis. `CHECK` di database menegakkan BR-01 (membutuhkan MySQL ≥ 8.0.16 atau MariaDB ≥ 10.2.1). Mode `STRICT_TRANS_TABLES` aktif. Kunci idempotensi (BR-20). Server menolak menyala bila versi, mode SQL, atau charset tidak sesuai. |
| **Kinerja** | Respons ≤ 500 ms untuk operasi umum pada skala asumsi A-2. |
| **Ketersediaan** | Dipakai pada jam kerja. MySQL dan aplikasi menyala otomatis setelah PC dihidupkan ulang (diuji dengan restart sungguhan). Backup harian memakai `mysqldump --single-transaction` tanpa mematikan server, disimpan 14 salinan terakhir, dan satu salinan di perangkat lain. Pemulihan diuji sekali sebelum go-live dan tiap kuartal. |
| **Keterlacakan** | Buku besar stok, jejak audit, dan riwayat koreksi tidak dapat diubah dari antarmuka. |
| **Kegunaan** | Bahasa Indonesia. Kiosk dapat dipakai dengan layar sentuh maupun keyboard fisik. Struk dicetak lewat printer kiosk dengan stylesheet cetak, dan bukti tetap tampil di layar sebagai cadangan. Pesan galat spesifik dan tidak menyalahkan. |
| **Privasi** | Telepon opsional, hanya tampil untuk admin. Kiosk tidak menampilkan data peminjam lain. |
| **Pemeliharaan** | Tes otomatis untuk BR-01, BR-04, konkurensi, dan idempotensi dijalankan sebelum setiap rilis. |
| **Pengelolaan basis data** | Tiga lingkungan terpisah (pengembangan, tes, produksi). Skema hanya berubah lewat berkas migrasi bernomor. Data produksi tidak diubah lewat alat SQL manual, karena itu melewati buku besar stok. Rincian di `SYSTEM-DESIGN.md` bagian 6A. |

## 11. Kriteria penerimaan (pengujian)

Skenario lama T-5.1 sampai T-5.6 diperbarui, dan T-5.7 dan seterusnya baru. Tes bertanda ⚙ **wajib otomatis**.

| ID | Skenario | Lulus jika |
|---|---|---|
| T-5.1 ⚙ | Akses admin tanpa sesi | Halaman dialihkan ke login **dan** API admin membalas 401 |
| T-5.2 ⚙ | Peminjaman | `tersedia` berkurang. Jumlah melebihi `tersedia` ditolak **oleh server** |
| T-5.3 ⚙ | Klaim lalu verifikasi | Klaim tidak mengubah stok. Verifikasi baik/rusak/hilang menghasilkan efek sesuai BR-05. Verifikasi ulang → 409 |
| T-5.4 | Status dan hari terlambat | Dihitung dinamis dan sesuai bagian 7.2 dan BR-10 |
| T-5.5 ⚙ | Hapus barang | Ditolak bila ada unit Dipinjam/Menunggu. Soft-delete berfungsi bila bersih |
| T-5.6 ⚙ | Privasi kiosk | Kode salah tidak menampilkan data apa pun. Kunci muncul setelah batas gagal |
| T-5.7 ⚙ | Pengembalian bertahap | Pinjam 3, klaim 2 dan terverifikasi, sisa tetap 1 |
| T-5.8 ⚙ | Klaim melebihi sisa | Ditolak server, termasuk bila unit sedang menunggu verifikasi |
| T-5.9 ⚙ | Kondisi campuran | Satu klaim berisi baik/rusak/hilang pada beberapa barang diproses benar |
| T-5.10 ⚙ | Invarian stok | BR-01 tetap benar setelah rangkaian operasi acak |
| T-5.11 ⚙ | Klik ganda | Dua permintaan dengan kunci sama menghasilkan satu klaim |
| T-5.12 ⚙ | Terlambat dan klaim | Klaim membekukan hari terlambat. Penolakan memulihkan hitungan |
| T-5.13 | Catatan peminjam | Catatan klaim tampil di antrean, detail, penanda "Ada catatan", dan filter |
| T-5.14 ⚙ | Override admin | Hasil berbeda dari laporan tanpa catatan admin ditolak. Dengan catatan, tercatat di buku besar dan audit |
| T-5.15 ⚙ | Stok rusak | Rusak tidak menambah `tersedia`. Perbaikan memindahkan. Afkir mengurangi `total` |
| T-5.16 | Cek batas waktu | Kode valid menampilkan batas kembali serta sisa hari/hari terlambat yang benar |
| T-5.17 ⚙ | Perpanjangan sah | Batas baru = batas lama + n hari. Riwayat tercatat |
| T-5.18 ⚙ | Perpanjangan ditolak | Ditolak bila terlambat, kuota habis, n melebihi batas, atau tak ada sisa |
| T-5.19 | Perpanjangan admin | Peminjaman terlambat dapat diperpanjang dengan alasan. Pelaku tercatat sebagai admin |
| T-5.20 ⚙ | Keamanan dasar | `password123` dan email default tidak ditemukan di repo maupun hasil build. Rate limit login berfungsi. Sesi idle 15 menit berakhir di server |
| T-5.21 ⚙ | Konkurensi | Dua peminjaman bersamaan untuk stok 1: tepat satu berhasil |
| T-5.22 | Migrasi SQLite → MySQL | Jumlah peminjaman, total stok, dan status sebelum dan sesudah migrasi cocok, dan BR-01 benar untuk semua barang |
| T-5.23 | Backup dan pulih | Backup `mysqldump` dibuat saat server hidup, dipulihkan ke basis data terpisah, dan pemeriksaan invarian lolos di hasil pemulihan |
| T-5.24 ⚙ | Pemesanan | Tanggal masa depan dalam batas membuat stok langsung berkurang dan status Dipesan. Tanggal lampau atau melebihi `maks_booking_hari` ditolak server |
| T-5.25 ⚙ | Batalkan pemesanan | Sebelum tanggal pinjam: stok kembali dan status Dibatalkan. Pada atau sesudah tanggal pinjam: ditolak di kiosk |
| T-5.26 ⚙ | Klaim dan perpanjangan atas pemesanan | Keduanya ditolak (BR-04, BR-26) |
| T-5.27 ⚙ | Batalkan oleh admin | Berhasil dengan alasan bila belum ada klaim. Ditolak bila sudah ada klaim |
| T-5.28 ⚙ | Barang tidak boleh diperpanjang | Perpanjangan peminjam ditolak dengan pesan yang menyebut barangnya. Admin tetap dapat memperpanjang |
| T-5.29 | Divisi | Form hanya menerima divisi aktif. Divisi nonaktif tidak muncul tetapi riwayatnya tetap tampil |
| T-5.30 ⚙ | Reset password | Skrip konsol mengganti hash dan mengakhiri semua sesi lama |
| T-5.31 | Hak akses dan jaringan MySQL | Akun aplikasi tidak dapat `DROP` atau `ALTER`. Port 3306 tidak dapat dijangkau dari komputer lain di jaringan |
| T-5.32 ⚙ | Pemeriksaan saat start | Server menolak menyala bila versi MySQL terlalu rendah, `sql_mode` tidak strict, atau charset bukan `utf8mb4` |
| T-5.33 ⚙ | Kategori barang | Form barang menolak tanpa kategori. Kategori aktif muncul sebagai filter di katalog kiosk dan laporan admin. Kategori nonaktif tidak muncul di filter tetapi barang yang sudah berelasi tetap terbaca di riwayat (BR-28, BR-31, BR-33). |
| T-5.34 | Kondisi barang turunan | Barang dengan `rusak = 0` ditampilkan "Baik". Setelah verifikasi rusak, kondisi berubah menjadi "Sebagian rusak" atau "Semua rusak" sesuai angka. Nilai lama `perlu_perbaikan` tidak dimunculkan otomatis (BR-29). |
| T-5.35 ⚙ | Tipe peminjam | Form kiosk menolak peminjaman tanpa tipe peminjam. Nilai ENUM yang diterima `'karyawan'` atau `'magang'` (label antarmuka Karyawan atau Magang). Filter tipe peminjam di panel admin menghasilkan data yang tepat. Tipe peminjam tampil di detail peminjaman (BR-30, FR-A-05, FR-A-06). |

## 12. Risiko

| Risiko | Kemungkinan | Dampak | Mitigasi |
|---|---|---|---|
| Admin lambat memverifikasi sehingga stok `tersedia` tampak lebih sedikit dari kenyataan | Sedang | Tinggi | Aksi cepat "Setujui sesuai laporan", lencana antrean, metrik waktu tunggu, dan SOP serah barang langsung |
| Kode pinjam hilang | Tinggi | Rendah | Admin dapat mencari dan membacakan kode (bagian 9.4) |
| Lalu lintas jaringan lokal tidak terenkripsi (HTTP) | Sedang | Sedang | Batasi akses ke jaringan kantor. Pertimbangkan HTTPS dengan sertifikat lokal pada tahap lanjut |
| Satu PC server menjadi titik kegagalan | Sedang | Tinggi | Backup harian ke lokasi kedua, dan prosedur pemulihan teruji |
| Data lama berkondisi "rusak" sudah tercampur ke `tersedia` (aturan v4) | Pasti | Sedang | Hitung fisik sekali setelah migrasi untuk menetapkan `rusak` awal |
| Peminjam sengaja melaporkan kondisi keliru | Sedang | Sedang | Verifikasi fisik oleh admin (D-1, D-9) dan catatan terekam |
| Pemesanan tidak diambil sehingga stok tertahan | Sedang | Sedang | Rentang pemesanan hanya 7 hari. Peminjam dapat membatalkan sendiri, admin dapat membatalkan. Pelepasan otomatis ada di roadmap bila sering terjadi |
| Satu admin: antrean verifikasi macet saat admin berhalangan, atau password terlupa | Sedang | Tinggi | Siapkan satu akun cadangan (misalnya kepala tim IT) yang jarang dipakai, dan skrip reset password (FR-S-06) |
| Laragon adalah lingkungan pengembangan, bukan layanan server | Sedang | Sedang | Pastikan MySQL menyala otomatis tanpa jendela Laragon terbuka, atau pasang MySQL Server resmi sebagai layanan Windows untuk PC server kantor. Uji dengan restart PC |
| Akun `root` bawaan Laragon tanpa kata sandi | Tinggi | Tinggi | Setel kata sandi root di task 0.5. Aplikasi memakai akun terpisah dengan hak terbatas |
| Data diubah lewat HeidiSQL/phpMyAdmin sehingga melewati buku besar stok | Sedang | Tinggi | Aturan operasional di `SYSTEM-DESIGN.md` bagian 6A.3, dan pemeriksaan invarian saat server menyala |

## 13. Roadmap (setelah v5.0)

| Tahap | Isi |
|---|---|
| **Berikutnya** | Master data karyawan. Lokasi simpan. Tipe barang *dipinjamkan* vs *habis pakai* dengan batas stok minimum. Dasbor admin. Ekspor Excel/CSV. Parameter `perpanjangan_butuh_persetujuan`. |
| **Lanjutan** | Nomor seri atau asset tag per unit untuk aset bernilai tinggi (hibrida dengan jumlah). Barcode/QR dan pemindai USB. Alur perawatan berkala. Stock opname (hitung fisik dan rekonsiliasi selisih). |
| **Opsional** | Kalender ketersediaan per tanggal (agar unit tidak ditahan sebelum dipakai). Konfirmasi pengambilan dan pelepasan otomatis pemesanan yang tidak diambil. Pengingat jatuh tempo lewat WhatsApp/email. Foto kondisi saat pengembalian rusak. Kebijakan keterlambatan (batas hari, pemblokiran peminjam menunggak). Beberapa level peran admin. |

## 14. Pertanyaan terbuka dan jawabannya

| ID | Pertanyaan | Jawaban | Dampak |
|---|---|---|---|
| Q-1 | Peminjam dari semua divisi atau hanya internal IT? | Semua divisi. Sistem khusus untuk inventaris divisi IT. | A-1, D-11, FR-A-16 |
| Q-2 | Nilai kebijakan kuota dan durasi | Memakai nilai rekomendasi di bagian 8 | Parameter |
| Q-3 | Printer di kiosk, atau struk cukup di layar? | Dijawab "ya". **Diasumsikan kiosk punya printer.** | FR-K-03, FR-K-06, A-7 |
| Q-4 | Keyboard fisik di kiosk? | Ada | NFR Kegunaan |
| Q-5 | Jumlah admin aktif | 1 | A-6, FR-S-06, risiko di bagian 12 |
| Q-6 | Perlukah barang tertentu dilarang diperpanjang? | Dijawab "ya boleh". **Diartikan: boleh ada barang yang dikecualikan.** | D-12 |

Dua jawaban (Q-3 dan Q-6) bisa dibaca lebih dari satu arah, jadi mohon dikonfirmasi. Desainnya aman untuk kedua tafsiran: penanda "boleh diperpanjang" bernilai ya secara default, sehingga bila semua barang boleh diperpanjang, penanda itu tidak perlu diubah.

**Masih terbuka:**

| ID | Pertanyaan | Mempengaruhi |
|---|---|---|
| Q-7 | Bila peminjam tidak mengambil barang pemesanan, apakah cukup admin yang membatalkan secara manual (v5.1), atau perlu pelepasan otomatis setelah satu hari melewati tanggal pinjam? Yang kedua memerlukan konfirmasi pengambilan. | D-10, BR-25, roadmap |
| Q-8 | Apakah keputusan MySQL sudah final, dan siapa yang bertanggung jawab atas server (backup, restart, kata sandi)? | D-13, bagian 10 |

## 15. Riwayat revisi

| Versi | Tanggal | Perubahan |
|---|---|---|
| 5.3 | 12 Okt 2026 | Task 0.1: tambah bagian 5.3 Kebutuhan Tambahan (kategori barang, kondisi turunan, tipe peminjam). Perbarui BR-17 (format kode klaim KMB-XXXXXX). Tambah BR-28 s.d. BR-33. Perbarui FR-K-01, FR-K-02, FR-A-03, FR-A-05, FR-A-06, FR-A-11. Tambah FR-A-18. Tambah T-5.33 s.d. T-5.35. Geser 5.3 Asumsi menjadi 5.4. |
| 5.2 | 9 Okt 2026 | Basis data berpindah ke MySQL (D-13). Penegasan pengelolaan basis data, akun, backup, dan migrasi. Perbaikan kalimat D-12 dan tag `<tanggal>`. |
| 5.1 | 8 Okt 2026 | Tanggal pinjam dapat dipilih (pemesanan) dengan penahanan stok dan pembatalan. Daftar divisi. Penanda boleh diperpanjang. Skrip reset password. Nilai kebijakan direkomendasikan. Jawaban pertanyaan terbuka. |
| 5.0 | 8 Okt 2026 | PRD lengkap pertama. Menambah verifikasi pengembalian, stok rusak terpisah, pengembalian parsial, catatan per klaim, kode pinjam, cek batas waktu, perpanjangan, autentikasi server-side, buku besar stok, dan jejak audit. Mengubah tanggal pinjam menjadi otomatis. |
| 4.0 | — | Ringkasan di README (pengembalian langsung mengubah stok, barang rusak masuk `tersedia`, login di sisi browser). |

## 16. Peta dokumen

| Dokumen | Isi | Perubahannya |
|---|---|---|
| `PRD.md` (ini) | Tujuan, aturan bisnis, kebutuhan, kriteria uji | Jarang, hanya saat kebijakan berubah |
| `SYSTEM-DESIGN.md` | Alur kerja, flowchart, ERD, skema SQL, kontrak API, migrasi | Sering, mengikuti implementasi |
| `README.md` | Cara menjalankan, struktur proyek. Aturan bisnis cukup menautkan ke PRD | Saat cara menjalankan berubah |
| `AGENTS.md` | Aturan kerja dan pointer ke dokumen untuk AI agent | Jarang |
| `TODO.md` | Urutan kerja per phase dan task | Tiap task selesai |