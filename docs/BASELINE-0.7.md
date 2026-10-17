# Baseline Prototipe: T-5.1 sampai T-5.6

**PERINGATAN: TestRunnerModal menjalankan operasi data uji pada cache/state aplikasi yang juga dipakai data asli. Sinkronisasi normal mengirim seluruh larik dan server mengganti isi larik, bukan menggabungkan perubahan. Jalankan HANYA dengan basis data lokal sekali pakai, tidak pernah pada server yang berisi data kantor.**

Kode suite saat ini mengaktifkan `testMode`, yang menahan push ke server selama suite berjalan ([`tests.ts`](../src/services/tests.ts#L44-L79), [`db.ts`](../src/services/db.ts#L126-L150)). Ini bukan pengaman untuk target koneksi yang salah: penulisan normal mengirim seluruh larik dan `server.js` mengganti nilai `data` ([`db.ts`](../src/services/db.ts#L145-L151), [`server.js`](../server.js#L29-L40)). Tombol reset di TestRunnerModal juga memanggil `DB.resetToSeed()` di luar suite ([`TestRunnerModal.tsx`](../src/components/admin/TestRunnerModal.tsx#L90-L102)).

## Cakupan dan perbedaan sumber

- TODO 0.7 menyebut pelaksanaan manual ([`TODO.md`](../TODO.md#L47)).
- PRD bagian 11 menandai T-5.1, T-5.2, T-5.3, T-5.5, dan T-5.6 sebagai otomatis; T-5.4 tidak bertanda otomatis ([`PRD.md`](PRD.md#L311-L316)).
- Kode `AppTestSuite` justru memuat keenam ID, dan TestRunnerModal menjalankan suite otomatis saat modal dibuka ([`tests.ts`](../src/services/tests.ts#L35-L70), [`TestRunnerModal.tsx`](../src/components/admin/TestRunnerModal.tsx#L26-L39)). Jadi, keenam baris di bawah berlabel **otomatis lewat TestRunnerModal** menurut kode; T-5.4 tetap **manual menurut klasifikasi PRD**.
- Hasil yang diharapkan di bawah menjelaskan pemeriksaan yang benar-benar ada pada prototipe, bukan menyatakan bahwa seluruh kriteria PRD sudah dipenuhi.

## Menyiapkan basis data lokal sekali pakai

Langkah berikut adalah petunjuk untuk pelaksana baseline; tidak dijalankan dalam sesi penyusunan lembar ini.

1. Siapkan PostgreSQL lokal yang hanya menerima koneksi lokal. Buat role dan basis data khusus untuk sekali pakai; jangan gunakan kredensial atau salinan basis data kantor.

   ```sql
   CREATE ROLE baseline_0_7_user LOGIN PASSWORD '<KATA_SANDI_LOKAL_SEKALI_PAKAI>';
   CREATE DATABASE inventaris_it_baseline_0_7 OWNER baseline_0_7_user;
   ```

2. Arahkan proses prototipe hanya ke basis data itu melalui `DATABASE_URL`. Ganti placeholder secara lokal; jangan masukkan nilai rahasia ke lembar ini atau Git. Jika kata sandi memiliki karakter khusus URI, gunakan percent-encoding.

   ```text
   DATABASE_URL=postgresql://baseline_0_7_user:<KATA_SANDI_URL_ENCODED>@127.0.0.1:5432/inventaris_it_baseline_0_7
   ```

3. Sebelum membuka aplikasi, periksa konfigurasi lokal secara visual: host harus `127.0.0.1` dan nama basis data harus `inventaris_it_baseline_0_7`. Jangan lanjutkan bila target meragukan. `server.js` memakai PostgreSQL dari `DATABASE_URL` dan membuat tabel `app_state` saat mulai ([`server.js`](../server.js#L1-L16)).
4. Saat pelaksana memilih menjalankan baseline, jalankan frontend dan server prototipe lokal saja, lalu masuk ke TestRunnerModal. Modal langsung menjalankan suite saat dibuka. Jangan arahkan `DATABASE_URL` ke server kantor.

## Lembar hasil

Untuk setiap ID, catat kartu hasil yang sesuai di TestRunnerModal. Suite menjalankan semua ID dalam satu kali eksekusi. T-5.4 turut diuji oleh kode walaupun PRD mengklasifikasikannya manual.

| ID / pelaksanaan | Langkah | Hasil diharapkan menurut prototipe | Hasil sebenarnya (kosong) | Lulus/gagal (kosong) | Catatan |
|---|---|---|---|---|---|
| T-5.1 — otomatis (TestRunnerModal); PRD: otomatis | Buka TestRunnerModal dan lihat kartu T-5.1. | Tes lokal mengharapkan logout menghapus sesi, kredensial salah ditolak, dan login seed yang valid diterima lalu logout berhasil. |  |  | **Pasti tidak memenuhi seluruh kriteria PRD:** tes hanya memeriksa `Auth` lokal; server hanya menyediakan `/api/state`, bukan endpoint admin yang membalas 401. Rujukan: [`tests.ts`](../src/services/tests.ts#L85-L128), [`server.js`](../server.js#L19-L42). |
| T-5.2 — otomatis (TestRunnerModal); PRD: otomatis | Lihat kartu T-5.2. | Tes membuat barang dengan 5 unit, meminjam 2 sehingga sisa 3, lalu memastikan permintaan 4 ditolak. |  |  | **Pasti tidak memenuhi syarat validasi oleh server:** validasi stok ada di `DB.createLoan` pada klien; endpoint server hanya menerima/menyimpan larik. Rujukan: [`tests.ts`](../src/services/tests.ts#L131-L199), [`db.ts`](../src/services/db.ts#L525-L578), [`server.js`](../server.js#L29-L40). |
| T-5.3 — otomatis (TestRunnerModal); PRD: otomatis | Lihat kartu T-5.3. | Tes mengharapkan pengembalian baik memulihkan stok; barang hilang mengurangi total tanpa menambah tersedia; pengembalian ganda ditolak. |  |  | **Pasti berbeda dari alur PRD:** prototipe langsung memproses pengembalian dan mengubah stok, bukan membuat klaim tanpa perubahan stok lalu menunggu verifikasi admin. Rujukan: [`tests.ts`](../src/services/tests.ts#L201-L292), [`db.ts`](../src/services/db.ts#L600-L668). |
| T-5.4 — otomatis (TestRunnerModal); PRD: manual | Lihat kartu T-5.4. | Tes mengharapkan status Dikembalikan untuk pinjaman selesai, Dipinjam dengan 0 hari terlambat sebelum jatuh tempo, dan Terlambat dengan 3 hari saat batas terlewati 3 hari. |  |  | Kode menguji accessor secara langsung; PRD tidak memberi tanda ⚙. Rujukan: [`tests.ts`](../src/services/tests.ts#L294-L369). |
| T-5.5 — otomatis (TestRunnerModal); PRD: otomatis | Lihat kartu T-5.5. | Tes mengharapkan barang dengan pinjaman aktif tidak dapat dihapus; setelah dikembalikan, soft-delete berhasil dan barang hilang dari daftar biasa. |  |  | Cakupan PRD untuk status Menunggu Verifikasi tidak dapat dijalankan pada prototipe ini; kode penghapusan hanya memeriksa pinjaman berstatus `dipinjam`. Rujukan: [`tests.ts`](../src/services/tests.ts#L371-L441), [`db.ts`](../src/services/db.ts#L392-L416). |
| T-5.6 — otomatis (TestRunnerModal); PRD: otomatis | Lihat kartu T-5.6. | Tes mengharapkan `clearLoans` mengosongkan riwayat dan ringkasan, serta memulihkan stok tersedia menjadi total. |  |  | **Pasti berbeda dari T-5.6 PRD:** PRD menguji privasi kode salah dan penguncian setelah batas gagal, sedangkan tes prototipe hanya menguji reset riwayat. UI kiosk mencari berdasarkan nama/divisi. Rujukan: [`tests.ts`](../src/services/tests.ts#L443-L507), [`ReturnView.tsx`](../src/components/kiosk/ReturnView.tsx#L40-L70), [`PRD.md`](PRD.md#L311-L316). |

**Catatan pengisian:** kolom hasil sebenarnya dan lulus/gagal sengaja dibiarkan kosong untuk diisi pelaksana setelah pengujian. Lembar ini tidak menyatakan skenario telah dijalankan.