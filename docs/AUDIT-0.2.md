# Laporan Audit Kode terhadap Dokumen Acuan (Task 0.2 & 0.3)

**Dokumen Acuan:** [`docs/PRD.md`](PRD.md) (v5.3) dan [`docs/SYSTEM-DESIGN.md`](SYSTEM-DESIGN.md) (v1.3).  
**Tanggal Audit:** 15 Oktober 2026  
**Auditor:** Engineer Senior (AI Pairing Agent)  
**Lingkup Analisis:** [`server.js`](../server.js), [`src/services/db.ts`](../src/services/db.ts), [`src/services/auth.ts`](../src/services/auth.ts), [`src/services/tests.ts`](../src/services/tests.ts), [`src/types.ts`](../src/types.ts), [`vite.config.ts`](../vite.config.ts), komponen Kiosk dan Admin, serta basis data SQLite lokal.

---

## 1. Basis Data yang Sebenarnya Dipakai & Dependensi Tak Terpakai

### 1.1 Basis Data yang Benar-Benar Berjalan
Meskipun [`README.md:13`](../README.md#L13) dan [`README.md:71`](../README.md#L71) menyebutkan sistem menggunakan SQLite (`better-sqlite3`, `database.sqlite`), kode backend yang aktif saat ini justru menggunakan **PostgreSQL**:
- **Driver & Koneksi:** [`server.js:4`](../server.js#L4) mengimpor `pg` dan [`server.js:7`](../server.js#L7) menginisialisasi `new pg.Pool({ connectionString: process.env.DATABASE_URL })`.
- **Skema Backend:** [`server.js:9-14`](../server.js#L9-L14) membuat tabel tunggal `app_state` berbasis NoSQL/JSONB:
  ```sql
  CREATE TABLE IF NOT EXISTS app_state (
    key TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '[]'::jsonb
  );
  ```
- **Peralihan Sejarah Git:** Pada commit `d385bce` ("Tambah backend PostgreSQL..."), rekan pengembang mengalihkan `server.js` dari SQLite ke PostgreSQL, namun dokumentasi `README.md` belum diperbarui.

### 1.2 Status Berkas `database.sqlite` Lokal
Di direktori akar proyek ditemukan berkas `database.sqlite` (12 KB) dan `database.sqlite-wal` (4,1 MB) bertanggal 7 Oktober 2026.
- Hasil inspeksi tabel `store`:
  - `items`: 3 baris (bernama `"Barang Uji Stok Pengurangan"`, `"Barang Uji Kembali Baik"`, `"Barang Uji Kembali Hilang"`).
  - `loans`: 0 baris.
  - `loanItems`: 0 baris.
- **Peringatan Penting:** Berkas `database.sqlite` lokal ini **hanya sisa uji coba** dari eksekusi test runner prototipe ([`src/services/tests.ts:43-79`](../src/services/tests.ts#L43-L79)). Jumlah 0 baris peminjaman di dalamnya **TIDAK membuktikan bahwa data asli kantor kosong**.
- **Pertanyaan Terbuka untuk Pemilik Proyek:**
  > **Di mesin/server mana basis data PostgreSQL asli yang memuat data produksi/operasional kantor saat ini berada? Apakah terdapat koneksi server PostgreSQL kantor atau backup snapshot data yang belum dibagikan ke lingkungan lokal ini?**

### 1.3 Dependensi yang Tidak Terpakai di `package.json`
| Dependensi | Lokasi | Status & Analisis |
|---|---|---|
| `@google/genai` | [`package.json:15`](../package.json#L15) | **Tidak terpakai.** Sama sekali tidak diimpor di berkas mana pun di seluruh proyek. |
| `better-sqlite3` | [`package.json:19`](../package.json#L19) | **Tidak terpakai di runtime.** Ditinggalkan setelah `server.js` beralih ke `pg`. |
| `jsonwebtoken` | [`package.json:23`](../package.json#L23) | **Tidak terpakai.** Belum ada implementasi token JWT di backend. |
| `motion` | [`package.json:27`](../package.json#L27) | **Tidak terpakai.** Tidak diimpor di `src/`. |
| `bcryptjs` | [`package.json:18`](../package.json#L18) | **Belum terpakai di kode.** Dipersiapkan untuk hashing password v5 Phase 1. |
| `tsx` & `esbuild` | [`package.json:39,41`](../package.json#L39) | **Tidak terpakai di scripts.** Skrip npm hanya memakai `node` dan `vite`. |

---

## 2. Lokasi Perhitungan Logika Stok, Status, dan Validasi

### 2.1 Perhitungan Stok & Status
Seluruh logika bisnis vital saat ini dihitung **di memori peramban klien (frontend)**:
- **Pengurangan Stok:** [`src/services/db.ts:574-580`](../src/services/db.ts#L574-L580) langsung memotong `available_qty` di memori sebelum mengirim array baru via `push()`.
- **Pengembalian & Kondisi:** [`src/services/db.ts:632-647`](../src/services/db.ts#L632-L647) mengembalikan `available_qty` jika baik/rusak, atau memotong `total_qty` jika hilang.
- **Perhitungan Status Dinamis:** [`src/services/db.ts:421-437`](../src/services/db.ts#L421-L437) (`computeLoanAccessors`) menghitung status (`Dipinjam`, `Terlambat`, `Dikembalikan`) dan `days_late` menggunakan perbandingan tanggal berbasis zona waktu lokal klien.

### 2.2 Validasi yang Hanya Ada di Klien
Di backend ([`server.js:32-47`](../server.js#L32-L47)), server **hanya memeriksa** apakah `key` valid dan body berupa array. Server tidak melakukan validasi aturan bisnis sama sekali. Seluruh validasi berikut hanya ada di klien:
1. Validasi ketersediaan stok (`available_qty >= qty`): [`src/services/db.ts:546-555`](../src/services/db.ts#L546-L555).
2. Validasi tanggal kembali tidak boleh mendahului tanggal pinjam: [`src/services/db.ts:533-535`](../src/services/db.ts#L533-L535) & [`src/services/db.ts:687-689`](../src/services/db.ts#L687-L689).
3. Larangan menghapus barang yang memiliki peminjaman aktif: [`src/services/db.ts:397-410`](../src/services/db.ts#L397-L410).
4. Pencegahan kuantitas pecahan atau negatif: [`src/services/db.ts:76-80`](../src/services/db.ts#L76-L80).
5. Formulir validasi antarmuka Kiosk: [`src/components/kiosk/BorrowModal.tsx:125-175`](../src/components/kiosk/BorrowModal.tsx#L125-L175).

---

## 3. Endpoint Tanpa Autentikasi & Pola Sinkronisasi

### 3.1 Endpoint Backend
[`server.js`](../server.js) hanya mengekspos dua endpoint:
1. `GET /api/state` ([`server.js:20`](../server.js#L20)): Mengembalikan seluruh isi data inventaris (`items`, `loans`, `loanItems`).
2. `PUT /api/state/:key` ([`server.js:32`](../server.js#L32)): Menimpa seluruh larik data untuk kunci tertentu (`items`, `loans`, `loanItems`).

**Temuan Kritis:** Kedua endpoint di atas **100% tanpa autentikasi, tanpa otorisasi, dan tanpa validasi skema isi**. Siapa pun yang memiliki akses ke port 3001 dapat menghapus atau memanipulasi seluruh data kantor dengan satu permintaan HTTP PUT.

### 3.2 Pola Sinkronisasi (*Full-Array Blind Overwrite*)
- Frontend mengirim seluruh larik data yang ada di memorinya ke server: [`src/services/db.ts:144-162`](../src/services/db.ts#L144-L162).
- Frontend menarik data secara berkala (*polling*) setiap 3 detik: [`src/services/db.ts:183`](../src/services/db.ts#L183).
- **Risiko Tabrakan Data (*Lost Update / Race Condition*):** Jika Petugas A di Admin menambah barang baru sementara Karyawan B di Kiosk meminjam barang dalam interval 3 detik, salah satu aksi akan menimpa seluruh larik aksi lainnya. Tidak ada *concurrency control*, *optimistic locking*, atau transaksi ACID antar baris.

---

## 4. Kredensial, Rahasia, dan Penyimpanan di LocalStorage

1. **Kata Sandi Plaintext di Kode:**
   - [`src/services/db.ts:38`](../src/services/db.ts#L38) menyimpan akun seed: username `admin`, email `admin@kantor.id`, password `password123`.
   - [`src/services/auth.ts:60`](../src/services/auth.ts#L60) memeriksa kata sandi secara plaintext: `user.passwordHash !== password`.
2. **Kredensial Terekspos di Antarmuka UI:**
   - [`src/components/admin/LoginModal.tsx:16-17`](../src/components/admin/LoginModal.tsx#L16-L17) mengisi otomatis kolom login dengan username `admin` dan password `password123`.
   - [`src/components/admin/LoginModal.tsx:107-111`](../src/components/admin/LoginModal.tsx#L107-L111) menampilkan kotak bantuan di antarmuka yang mencetak kredensial default secara terang-terangan.
3. **Kredensial di Dokumentasi Publik:**
   - [`README.md:61-62`](../README.md#L61-L62) mencantumkan akun dan kata sandi admin secara terbuka.
4. **Penyimpanan Sensitif di LocalStorage:**
   - Data akun disimpan di `localStorage.getItem('kantor_db_users')` ([`src/services/db.ts:251`](../src/services/db.ts#L251)).
   - Sesi admin disimpan tanpa masa kedaluwarsa di `localStorage.getItem('kantor_admin_session')` ([`src/services/auth.ts:4,21`](../src/services/auth.ts#L4)). Hal ini rentan terhadap pencurian token via skrip injeksi (XSS) dan tidak memenuhi standar keamanan sesi perbankan/kantor.

---

## 5. Konfigurasi yang Membuka Server ke Jaringan Luar

1. **Backend Mendengarkan di Semua Interface:**
   - [`server.js:50`](../server.js#L50): `app.listen(PORT, '0.0.0.0')`. Port 3001 terbuka untuk seluruh perangkat di jaringan lokal (LAN/WiFi).
2. **CORS Terbuka Bebas:**
   - [`server.js:17`](../server.js#L17): `app.use(cors())` mengizinkan akses dari semua origin (`*`).
3. **Frontend Vite Mendengarkan di Semua Interface:**
   - [`vite.config.ts:15`](../vite.config.ts#L15): `server.host: true` (ekivalen dengan `0.0.0.0`).
4. **Vite Mengizinkan Sembarang Host Header:**
   - [`vite.config.ts:17`](../vite.config.ts#L17): `allowedHosts: true` mengabaikan proteksi DNS rebinding dan secara sengaja mengizinkan domain tunnel publik (seperti ngrok/localtunnel).

---

## 6. Uji Bundle Produksi: `tests.ts` dan `TestRunnerModal`

- [`src/App.tsx:13`](../src/App.tsx#L13) mengimpor komponen secara langsung:
  ```ts
  import { TestRunnerModal } from './components/admin/TestRunnerModal';
  ```
- [`src/components/admin/TestRunnerModal.tsx:10`](../src/components/admin/TestRunnerModal.tsx#L10) mengimpor:
  ```ts
  import { AppTestSuite, TestResult } from '../../services/tests';
  ```
- **Kesimpulan:** Karena diimpor secara statis tanpa *lazy loading* / *dynamic import*, berkas [`src/services/tests.ts`](../src/services/tests.ts) (508 baris) dan seluruh antarmuka pengujian **PASTI ikut masuk ke dalam bundle JavaScript produksi (`dist/`)** saat `vite build` dijalankan. Pengguna publik yang menginspeksi file JavaScript hasil build dapat melihat seluruh logika pengujian dan data seed.

---

## 7. Analisis Gejala: Tombol Login Admin Macet di "Memverifikasi..."

Gejala tombol masuk admin macet dan terus menampilkan teks *"Memverifikasi..."* terjadi karena kegagalan asinkron pada alur submit modal login:

### Lokasi Kode
[`src/components/admin/LoginModal.tsx:23-38`](../src/components/admin/LoginModal.tsx#L23-L38):
```tsx
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setErrorMessage(null);
  setIsLoading(true);

  setTimeout(() => {
    const res = Auth.login(username, password);
    setIsLoading(false);
    if (res.success) {
      onLoginSuccess();
      onClose();
    } else {
      setErrorMessage(res.message || 'Login gagal. Periksa kembali username dan password.');
    }
  }, 200);
};
```

### Hipotesis Penyebab

- **Tingkat Keyakinan:** **Sedang**.
- **Diperlukan untuk Memastikan:** Isi konsol browser (*DevTools Console* dan riwayat tab *Network*) saat gejala muncul di layar pengguna.

1. **Ketiadaan Blok `try...catch...finally` di `setTimeout`:**
   Pemanggilan `setIsLoading(false)` diletakkan tepat setelah baris `const res = Auth.login(...)`. Jika pemanggilan fungsi tersebut melemparkan *uncaught exception*, eksekusi terputus sebelum `setIsLoading(false)` dipanggil, sehingga state `isLoading` terkunci permanen pada nilai `true`.
2. **Penyebab Exception di `Auth.login`:**
   - Di [`src/services/auth.ts:59`](../src/services/auth.ts#L59), `Auth.login` memanggil `DB.findUserByUsername(username)`.
   - Di [`src/services/db.ts:251-255`](../src/services/db.ts#L251-L255), `readUsers()` mengurai `localStorage.getItem(KEYS.users)`. Apabila nilai yang tersimpan di localStorage korup atau bukan sebuah larik (misalnya objek `{}` atau teks biasa akibat eksperimen sebelumnya), pemanggilan `.find(...)` di baris 259 akan menghasilkan galat fatal: `TypeError: this.readUsers().find is not a function`.
   - Di [`src/services/auth.ts:65`](../src/services/auth.ts#L65), penyimpanan `localStorage.setItem(SESSION_KEY, ...)` tidak dibungkus pelindung. Pada peramban dengan mode *Strict Privacy / Incognito* atau saat kuota storage habis, baris ini melempar `DOMException: SecurityError / QuotaExceededError`.
3. **Penyebab Render Crash pada Komponen Admin:**
   Bila login berhasil, `onLoginSuccess()` memanggil `setAppMode('admin')` di [`src/App.tsx:136`](../src/App.tsx#L136). React langsung me-render `AdminLayout` dan `LoansTable`. Jika terjadi galat saat merender data awal yang belum terinisialisasi, komponen meledak dan modal login tertinggal dalam status memverifikasi.

---

## 8. Tabel Pemetaan Data Lama ke Skema v5 (`SYSTEM-DESIGN.md` Bagian 6)

> [!NOTE]
> **Catatan Sumber Data Lama & Rencana Revisi:** Sumber data lama yang aktif di backend sebenarnya adalah **PostgreSQL JSONB** (tabel `app_state` dengan kolom `data` JSONB), **bukan SQLite** (lihat Bagian 1.1). Oleh karena itu, judul Task 6.1 serta isi [`docs/SYSTEM-DESIGN.md`](SYSTEM-DESIGN.md) Bagian 11 perlu direvisi pada Sesi S04 untuk mencerminkan ekstraksi dari PostgreSQL JSONB ke MySQL v5. *(Catatan: Dokumen SYSTEM-DESIGN tidak diubah sekarang sesuai instruksi).*

| Entitas Lama | Field Lama | Padanan di Skema v5 | Status / Keterangan |
|---|---|---|---|
| **Item** | `id` (string: `item_...`) | `items.id` (INT AUTO_INCREMENT) | Diberi ID numerik baru saat migrasi; ID lama disimpan sementara di mapping log. |
| | `name` (string) | `items.nama` (VARCHAR(150)) | Padanan langsung. |
| | `total_qty` (number) | `items.total` (INT) | Padanan langsung. |
| | `available_qty` (number) | `items.tersedia` (INT) | Padanan langsung. |
| | `category` (string) | `items.kategori_id` (FK `categories.id`) | Nilai string lama dipetakan ke baris `categories.nama`. Jika kosong/NULL, masuk ke kategori default *"Tanpa Kategori"*. |
| | `condition` (`baik` \| `rusak` \| `perlu_perbaikan`) | **TIDAK ADA PADANAN LANGSUNG** | **Ditandai.** Pada v5, kondisi barang adalah **status turunan** dari angka stok (`tersedia`, `rusak`). Nilai `perlu_perbaikan` tidak memiliki padanan angka unit otomatis dan wajib masuk daftar hitung fisik manual (BR-29, SYSTEM-DESIGN 11.5). |
| | `notes` (string \| null) | `items.deskripsi` (TEXT) | Padanan langsung. |
| | `deleted_at` (ISO \| null) | `items.dihapus_pada` (DATETIME) | Padanan langsung (*soft-delete*). |
| | `created_at` (ISO) | `items.dibuat_pada` (DATETIME) | Dikonversi ke DATETIME UTC. |
| | `updated_at` (ISO) | `items.diubah_pada` (DATETIME) | Dikonversi ke DATETIME UTC. |
| | *(tidak ada di lama)* | `items.rusak` (INT) | Diisi default `0` saat migrasi awal; disesuaikan via hitung fisik. |
| | *(tidak ada di lama)* | `items.boleh_diperpanjang` (TINYINT) | Diisi default `1` (D-12). |
| **Loan** | `id` (string: `loan_...`) | `loans.id` (INT AUTO_INCREMENT) | Diberi ID numerik baru saat migrasi. |
| | *(tidak ada di lama)* | `loans.kode_pinjam` (VARCHAR(12)) | **TIDAK ADA DI LAMA.** Dibuatkan kode unik acak kriptografis baru (`PJM-XXXXXX`) saat migrasi. |
| | `borrower_name` (string) | `loans.nama_peminjam` (VARCHAR(100)) | Padanan langsung. |
| | `borrower_type` (`karyawan` \| `magang`) | `loans.tipe_peminjam` (ENUM) | Padanan langsung. Jika data lama kosong, diberi default `'karyawan'`. |
| | `division` (string bebas) | `loans.division_id` (FK `divisions.id`) | String bebas lama disatukan ejaannya (Task 6.2) lalu direlasikan ke ID divisi. |
| | `phone` (string \| null) | `loans.telepon` (VARCHAR(20)) | Padanan langsung. |
| | `loan_date` (YYYY-MM-DD) | `loans.tanggal_pinjam` (DATE) | Padanan langsung. |
| | `due_date` (YYYY-MM-DD) | `loans.batas_kembali` & `batas_kembali_awal` | Padanan langsung. `batas_kembali_awal` diisi sama dengan `due_date`. |
| | `returned_date` (YYYY-MM-DD) | **TIDAK ADA DI TABEL LOANS v5** | **Ditandai.** Pada v5, status pengembalian dicatat di baris transaksi `return_claims` yang diverifikasi, bukan kolom tanggal di `loans`. |
| | `status` (`dipinjam` \| `dikembalikan`) | **TIDAK DISIMPAN SEBAGAI KOLOM ENUM** | **Ditandai.** Pada v5, status peminjaman adalah status turunan dari perhitungan sisa unit, tanggal jatuh tempo, dan baris pembatalan (`dibatalkan_pada`). |
| | `notes` (string \| null) | **TIDAK ADA PADANAN LANGSUNG (Tercampur Audit)** | **Ditandai.** Di kode lama, field ini mencampur catatan peminjam dengan teks audit (mis. `"[2026-10-14] Dikembalikan..."`). Di v5 dipisah ke `return_claims.catatan_peminjam` dan `audit_logs`. |
| | `created_at` (ISO) | `loans.dibuat_pada` (DATETIME) | Dikonversi ke DATETIME UTC. |
| | `updated_at` (ISO) | *(tidak ada)* | Di v5 perubahan riwayat tercatat di tabel log khusus. |
| | *(tidak ada di lama)* | `loans.dibatalkan_pada` | Kolom baru untuk alur pembatalan (BR-24, BR-25). |
| | *(tidak ada di lama)* | `loans.idempotency_key` | Kolom baru pencegah duplikasi pemesanan kiosk (BR-20). |
| **LoanItem** | `id` (string: `li_...`) | `loan_items.id` (INT AUTO_INCREMENT) | Diberi ID numerik baru. |
| | `loan_id` (string) | `loan_items.loan_id` (FK `loans.id`) | Terhubung ke ID pinjaman baru. |
| | `item_id` (string) | `loan_items.item_id` (FK `items.id`) | Terhubung ke ID barang baru. |
| | `qty` (number) | `loan_items.qty_dipinjam` (INT) | Padanan langsung. |
| | `return_condition` (`baik` \| `rusak` \| `hilang`) | **TIDAK ADA DI TABEL LOAN_ITEMS v5** | **Ditandai.** Pada v5 dipindahkan ke tabel anak `return_claim_lines.kondisi_dilaporkan` dan hasil verifikasi admin. |
| **User** | `id`, `name`, `username`, `email`, `passwordHash` | `users` (tabel MySQL v5) | Dipindahkan dari localStorage ke tabel `users` dengan password yang di-hash menggunakan bcrypt. |

---

## 9. Daftar Selisih Lain antara Kode Prototipe dan SYSTEM-DESIGN

1. **Alur Klaim & Verifikasi:** Prototipe langsung mengembalikan barang ke stok saat form disubmit di Kiosk (`ReturnView.tsx`). Di SYSTEM-DESIGN bagian 4.3 & 4.4, peminjam hanya mengajukan *klaim pengembalian* (`return_claims`), stok fisik tidak berubah sampai petugas admin memverifikasi fisik barang di Antrean Verifikasi.
2. **Pencarian Peminjaman & Privasi Kiosk:** Di prototipe ([`src/components/kiosk/ReturnView.tsx:58-64`](../src/components/kiosk/ReturnView.tsx#L58-L64)), peminjam mencari data dengan mengetik nama atau divisi, sehingga peminjaman milik orang lain dapat terlihat. Di SYSTEM-DESIGN bagian 4.2 dan PRD BR-18, pencarian hanya melalui **kode pinjam acak rahasia** (`PJM-XXXXXX`) dengan batas percobaan gagal untuk melindungi privasi.
3. **Pengembalian Parsial per Unit:** Prototipe mengembalikan seluruh unit barang dalam satu kondisi. Skema v5 mendukung pengembalian bertahap/parsial (misal pinjam 5 unit: 2 dikembalikan hari ini, 3 masih dipinjam).
4. **Buku Besar Mutasi Stok (`stock_movements`):** Prototipe langsung meng-overwrite angka stok di tabel. Skema v5 mewajibkan setiap perubahan stok (`tersedia`, `rusak`, `total`) menulis satu baris buku besar transaksi (`stock_movements`) untuk menjamin kepatuhan invarian BR-01.
5. **Perpanjangan Peminjaman:** Prototipe belum memiliki fitur perpanjangan peminjaman (baik mandiri di Kiosk maupun via Admin).
6. **Koreksi Data Peminjaman:** Prototipe mengedit field catatan secara langsung (`correctLoan`). Di skema v5, setiap koreksi data pinjaman dicatat di tabel relasional `loan_corrections` dengan alasan wajib.
7. **Master Data Divisi & Kategori:** Prototipe memakai array string hardcoded di kode ([`src/components/kiosk/BorrowModal.tsx:28-36`](../src/components/kiosk/BorrowModal.tsx#L28-L36)). Skema v5 memakai tabel master relasional `divisions` dan `categories` dengan soft-deactivate (tidak dihapus).

---

## 10. TABEL PETA KESIAPAN TASK (TODO.md 0.x sampai 6.x)

Status Kesiapan:
- **A. SUDAH MEMENUHI:** Jangan diubah, tambahkan hanya tes yang kurang.
- **B. SEBAGIAN:** Kerjakan hanya selisihnya.
- **C. ADA TAPI BERBEDA RANCANGAN:** Berhenti dan tanyakan, jangan menimpa sembarangan.
- **D. BELUM ADA:** Kerjakan seluruhnya.

| ID Task | Judul Task di TODO.md | Status | Bukti `file:baris` | Keterangan & Tindakan Lanjutan |
|---|---|---|---|---|
| **0.1** | Susun repo, PRD & SYSTEM-DESIGN di docs/ | **A** | [`TODO.md:37-39`](../TODO.md#L37-L39), [`docs/PRD.md`](PRD.md), [`docs/SYSTEM-DESIGN.md`](SYSTEM-DESIGN.md) | Selesai pada commit `74bf077` dan `c80373b`. |
| **0.2** | Audit kode terhadap dokumen | **A** | [`docs/AUDIT-0.2.md`](AUDIT-0.2.md) | Selesai lewat dokumen audit ini. |
| **0.3** | Amankan titik awal (tag & backup) | **B** | [`docs/AUDIT-0.2.md#bagian-11`](AUDIT-0.2.md) (instruksi siap) | Menunggu eksekusi tag & backup oleh pengguna. |
| **0.4** | Putuskan hal yang masih terbuka | **D** | [`TODO.md:43`](../TODO.md#L43) | Dijadwalkan pada Sesi S03 (`docs/KEPUTUSAN-0.4.md`). |
| **0.5** | Siapkan MySQL di Laragon | **D** | [`docs/PANDUAN-LARAGON.md`](PANDUAN-LARAGON.md) | Menunggu penyiapan MySQL lokal pada Sesi S04. |
| **0.6** | Rapikan konfigurasi (.env.example & gitignore) | **A** | [`.env.example:1-30`](../.env.example#L1-L30), [`.gitignore:1-12`](../.gitignore#L1-L12) | Selesai pada commit `be8da4d`. |
| **0.7** | Catat baseline uji manual T-5.1 s.d. T-5.6 | **D** | [`docs/PRD.md:144-245`](PRD.md#L144-L245) | Dikerjakan pada Task 0.7. |
| **1.1** | Lapisan akses data MySQL (`server/db/`) | **D** | `server/db/` (belum ada di direktori) | Dikerjakan di Phase 1. |
| **1.2** | Runner migrasi dan skema awal v5 | **D** | `db/migrations/0001_init.sql` (belum ada) | Dikerjakan di Phase 1. |
| **1.9** | Kerangka tes Vitest & Supertest | **D** | [`package.json:14-43`](../package.json#L14) (vitest belum terpasang) | Dikerjakan di Phase 1. |
| **1.3** | Pemeriksaan saat start & invarian BR-01 | **D** | [`server.js:1-50`](../server.js#L1-L50) (belum ada pengecekan) | Dikerjakan di Phase 1. |
| **1.4** | Seed dan skrip admin console | **D** | `scripts/` (belum ada skrip admin) | Dikerjakan di Phase 1. |
| **1.5** | Autentikasi server-side (session & cookie) | **D** | [`server.js:16-47`](../server.js#L16-L47) (tanpa auth backend) | Dikerjakan di Phase 1. |
| **1.6** | Bersihkan kredensial & hubungkan login ke API | **C** | [`src/services/auth.ts:58-68`](../src/services/auth.ts#L58-L68), [`src/components/admin/LoginModal.tsx:16-17`](../src/components/admin/LoginModal.tsx#L16-L17) | Login ada tapi di sisi browser dengan plaintext. Perlu disambungkan ke API backend baru. |
| **1.7** | Utilitas inti (kode acak, tanggal, idempotensi) | **B** | [`src/services/db.ts:46-66`](../src/services/db.ts#L46-L66) | Ada pembangkit ID dan selisih hari sederhana, tapi belum kriptografis dan belum menangani idempotensi. |
| **1.8** | Buku besar stok (`applyMovement` & BR-01) | **D** | [`src/services/db.ts:574-580`](../src/services/db.ts#L574-L580) (mutasi langsung tanpa ledger) | Dikerjakan di Phase 1. |
| **2.1** | API Katalog & divisi publik Kiosk | **C** | [`server.js:20`](../server.js#L20), [`src/components/kiosk/ItemList.tsx:1-50`](../src/components/kiosk/ItemList.tsx#L1-L50) | Ada endpoint `/api/state`, tapi mengirim seluruh data alih-alih endpoint spesifik publik. |
| **2.2** | API Buat peminjaman (`POST /api/kiosk/loans`) | **C** | [`src/services/db.ts:525-598`](../src/services/db.ts#L525-L598) | Logika ada di frontend `DB.createLoan`, belum ada endpoint transaksional di server. |
| **2.3** | Formulir peminjaman Kiosk | **B** | [`src/components/kiosk/BorrowModal.tsx:1-406`](../src/components/kiosk/BorrowModal.tsx#L1-L406) | Komponen UI sudah lengkap dan bagus; tinggal disesuaikan dengan API v5 dan master divisi. |
| **2.4** | Struk cetak peminjaman | **B** | [`src/components/kiosk/BorrowModal.tsx:327-395`](../src/components/kiosk/BorrowModal.tsx#L327-L395) | Tampilan struk sukses sudah ada di modal, perlu penyesuaian kode pinjam huruf besar & pemesanan. |
| **2.5** | Batalkan pemesanan oleh peminjam (API) | **D** | [`server.js:1-50`](../server.js#L1-L50) (belum ada alur pembatalan) | Dikerjakan di Phase 2. |
| **2.6** | Kelola barang, penyesuaian stok, divisi (Admin) | **B** | [`src/components/admin/ItemsCrud.tsx:1-350`](../src/components/admin/ItemsCrud.tsx#L1-L350), [`src/services/db.ts:307-417`](../src/services/db.ts#L307-L417) | UI CRUD barang sudah ada di admin; selisihnya: penyesuaian stok formal (BR-15), penanda `boleh_diperpanjang`, dan master divisi. |
| **3.1** | Cek peminjaman & status turunan (API) | **C** | [`src/services/db.ts:421-453`](../src/services/db.ts#L421-L453) | Status dihitung di klien; v5 mewajibkan endpoint lookup server dengan fungsi `deriveStatus()`. |
| **3.2** | Halaman Cek Peminjaman Kiosk | **C** | [`src/components/kiosk/ReturnView.tsx:1-467`](../src/components/kiosk/ReturnView.tsx#L1-L467) | Layar ada tapi mencari via nama/divisi bebas. Harus diubah menjadi kartu peminjaman via kode pinjam. |
| **3.2a**| Tombol batal pemesanan di Kiosk | **D** | [`src/components/kiosk/ReturnView.tsx`](../src/components/kiosk/ReturnView.tsx) (belum ada) | Dikerjakan di Phase 3. |
| **3.3** | API Klaim pengembalian parsial | **D** | [`server.js:1-50`](../server.js#L1-L50) (tidak ada konsep klaim) | Dikerjakan di Phase 3. |
| **3.4** | Form klaim & bukti klaim Kiosk | **C** | [`src/components/kiosk/ReturnView.tsx:280-350`](../src/components/kiosk/ReturnView.tsx#L280-L350) | Form pengembalian ada tapi mengembalikan seluruh unit; perlu diubah ke input Baik/Rusak/Hilang parsial. |
| **3.5** | API Antrean & verifikasi klaim | **D** | [`server.js:1-50`](../server.js#L1-L50) (tidak ada verifikasi backend) | Dikerjakan di Phase 3. |
| **3.6** | Antrean verifikasi admin UI | **D** | `src/components/admin/` (belum ada tab verifikasi klaim) | Dikerjakan di Phase 3. |
| **3.7** | Manajemen stok rusak (perbaikan & afkir) | **D** | [`src/components/admin/ItemsCrud.tsx`](../src/components/admin/ItemsCrud.tsx) (belum ada alur rusak) | Dikerjakan di Phase 3. |
| **3.8** | Hasil klaim terlihat oleh peminjam | **D** | [`src/components/kiosk/ReturnView.tsx`](../src/components/kiosk/ReturnView.tsx) | Dikerjakan di Phase 3. |
| **3.9** | Tes invarian acak (BR-01 stress test) | **D** | `tests/` | Dikerjakan di Phase 3. |
| **4.1** | API Perpanjangan oleh peminjam | **D** | [`server.js:1-50`](../server.js#L1-L50) | Dikerjakan di Phase 4. |
| **4.2** | UI Perpanjang & bukti di Kiosk | **D** | `src/components/kiosk/` (belum ada UI perpanjang) | Dikerjakan di Phase 4. |
| **4.3** | API Perpanjangan oleh admin | **D** | [`server.js:1-50`](../server.js#L1-L50) | Dikerjakan di Phase 4. |
| **4.4** | API Batalkan peminjaman oleh admin | **D** | [`server.js:1-50`](../server.js#L1-L50) | Dikerjakan di Phase 4. |
| **4.5** | Koreksi peminjaman admin (API & log) | **C** | [`src/services/db.ts:672-709`](../src/services/db.ts#L672-L709) | Ada fungsi `correctLoan` di klien yang menambahkan teks ke string `notes`. Skema v5 mewajibkan tabel `loan_corrections`. |
| **5.1** | Daftar peminjaman & filter admin | **B** | [`src/components/admin/LoansTable.tsx:1-420`](../src/components/admin/LoansTable.tsx#L1-L420) | Tabel pinjaman sudah sangat rapi; tinggal menyambungkan filter status baru (Dipesan, Dibatalkan, Antrean Klaim) ke API. |
| **5.2** | Detail peminjaman & lini masa admin | **C** | [`src/components/admin/LoansTable.tsx:210-310`](../src/components/admin/LoansTable.tsx#L210-L310) | Modal detail peminjaman sudah ada, namun belum memiliki lini masa bertingkat (riwayat klaim, verifikasi, koreksi). |
| **5.2a**| Tombol aksi admin di halaman detail | **B** | [`src/components/admin/LoansTable.tsx:320-380`](../src/components/admin/LoansTable.tsx#L320-L380) | Ada tombol modal edit/koreksi; tinggal menambah aksi perpanjang dan batalkan. |
| **5.3** | Dasbor & polling antrean | **B** | [`src/services/db.ts:712-729`](../src/services/db.ts#L712-L729), [`src/components/admin/AdminLayout.tsx:1-231`](../src/components/admin/AdminLayout.tsx#L1-L231) | Ada statistik ringkasan di memori; perlu disambungkan ke endpoint `/api/admin/summary` dengan interval polling 30 detik. |
| **5.4** | Laporan PDF | **B** | [`src/services/pdf.ts:1-260`](../src/services/pdf.ts#L1-L260), [`src/components/admin/ReportsView.tsx:1-210`](../src/components/admin/ReportsView.tsx#L1-L210) | Ekspor PDF klien via `jspdf` sudah berjalan; v5 meminta penyesuaian format laporan dan endpoint backend. |
| **5.5** | Pengaturan parameter sistem | **D** | `src/components/admin/` (belum ada menu pengaturan parameter) | Dikerjakan di Phase 5. |
| **5.6** | Penampil jejak audit admin | **D** | `src/components/admin/` (belum ada penampil audit_logs) | Dikerjakan di Phase 5. |
| **5.7** | Kelola akun admin | **D** | `src/components/admin/` (hanya ada seed tunggal) | Dikerjakan di Phase 5. |
| **5.8** | Perilaku Kiosk (idle reset, target sentuh) | **B** | [`src/components/kiosk/`](../src/components/kiosk/) | Desain UI ramah sentuh sudah ada; sisa: auto reset ke beranda saat idle. |
| **5.9** | Ekspor Excel/CSV | **D** | `src/components/admin/` (opsional) | Dikerjakan di Phase 5. |
| **6.1** | Skrip migrasi SQLite ke MySQL | **D** | `scripts/` (belum ada skrip migrasi) | Dikerjakan di Phase 6. **Catatan:** Sumber data lama adalah PostgreSQL JSONB (`app_state`), bukan SQLite, sehingga judul task dan [`docs/SYSTEM-DESIGN.md`](SYSTEM-DESIGN.md) bagian 11 perlu direvisi di S04 (jangan mengubah SYSTEM-DESIGN sekarang). |
| **6.2** | Bahan penyatuan divisi lama | **B** | [`src/components/kiosk/BorrowModal.tsx:28-36`](../src/components/kiosk/BorrowModal.tsx#L28-L36) | Daftar awal ada di kode; dokumen pemetaan dan skrip ekstraksi disediakan pada sesi S02. |
| **6.3** | Hitung fisik sekali | **D** | Prosedur manual PM saat migrasi go-live. | Dikerjakan di Phase 6. |
| **6.4** | Backup terjadwal & uji pulih | **D** | Penjadwalan task runner Laragon. | Dikerjakan di Phase 6. |
| **6.5** | Hardening MySQL | **D** | Konfigurasi bind-address & firewall. | Dikerjakan di Phase 6. |
| **6.6** | Satu port & layanan otomatis Windows | **D** | Konfigurasi Express production build. | Dikerjakan di Phase 6. |
| **6.7** | Uji penerimaan pengguna | **D** | Prosedur QA. | Dikerjakan di Phase 6. |
| **6.8** | Runbook operasional | **D** | `docs/RUNBOOK.md` (belum dibuat). | Dikerjakan di Phase 6. |
| **6.9** | Go-live dan pemantauan | **D** | Milestone rilis akhir. | Dikerjakan di Phase 6. |

---

## 11. TASK 0.3: Titik Awal (Instruksi Pengguna)

Sesuai aturan kerja, **agent TIDAK menjalankan perintah Git yang menulis dan TIDAK menjalankan backup secara mandiri**. Langkah-langkah berikut disediakan untuk dijalankan sendiri oleh pengguna di terminal:

### 11.1 Perintah Membuat Tag Git `prototipe-v4`
Gunakan commit `origin/main` (titik stabil prototipe sebelum pekerjaan v5 dimulai):
```bash
# Ambil referensi remote terbaru
git fetch origin

# Periksa log untuk memastikan target commit origin/main
git log -1 origin/main --oneline

# Buat tag Git prototipe-v4 pada origin/main (jangan di-push sebelum Anda memutuskan)
git tag prototipe-v4 origin/main

# Verifikasi bahwa tag telah terbentuk
git tag -l -n1 prototipe-v4
```

### 11.2 Perintah Backup Basis Data Tanpa Kata Sandi di Argumen
Pilih prosedur backup sesuai basis data yang digunakan:

#### Opsi A: Backup Berkas `database.sqlite` (Jika Data Nyata Ada di SQLite)
Salin berkas ke direktori aman di luar repositori proyek (misal ke `C:\backup_inventaris\`):
```powershell
# Jalankan di PowerShell
$backupDir = "C:\backup_inventaris_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force

# Salin berkas database beserta file journal WAL
Copy-Item "database.sqlite*" -Destination $backupDir

# Langkah Verifikasi Backup:
Get-ChildItem -Path $backupDir
```

#### Opsi B: Backup PostgreSQL `pg_dump` (Jika Data Nyata Berada di PostgreSQL)
Gunakan variabel lingkungan sesi sementara (`PGPASSWORD`) agar kata sandi **TIDAK tercatat** dalam argumen perintah atau riwayat konsol.

> **Penting:** Parameter host (`-h`), port (`-p`), user (`-U`), dan nama basis data (`-d`) **harus diisi sesuai nilai `DATABASE_URL` pada mesin yang menyimpan data asli (jangan menebak)**. Ekstensi berkas menggunakan `.dump` karena parameter `-F c` menghasilkan format arsip kustom PostgreSQL (bukan teks SQL biasa).

```powershell
# Jalankan di PowerShell

# 1. Baca kata sandi ke SecureString (JANGAN tugaskan langsung ke $env:PGPASSWORD)
$securePass = Read-Host -Prompt "Masukkan kata sandi PostgreSQL" -AsSecureString
$passBSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)

try {
    # 2. Dekripsi sementara ke $env:PGPASSWORD untuk sesi proses pg_dump
    $env:PGPASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($passBSTR)

    # 3. Buat folder backup bila belum ada
    $backupDir = "C:\backup_inventaris"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    $backupFile = "$backupDir\inventaris_pg_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump"

    # 4. Jalankan pg_dump (host, port, user, nama basis data harus sesuai DATABASE_URL mesin penyimpan data asli, jangan menebak)
    & "pg_dump" -h <HOST_DATABASE_URL> -p <PORT_DATABASE_URL> -U <USER_DATABASE_URL> -d <DBNAME_DATABASE_URL> -F c -b -v -f $backupFile

    # 5. Langkah Verifikasi Backup:
    & "pg_restore" --list $backupFile | Select-Object -First 10
} finally {
    # 6. Bersihkan memori BSTR dan hapus variabel lingkungan dari sesi
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passBSTR)
    $env:PGPASSWORD = $null
}
```
