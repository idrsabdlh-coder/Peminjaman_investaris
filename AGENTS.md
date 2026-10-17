# AGENTS.md

Proyek: Sistem Peminjaman & Inventaris Barang Tim IT.
Teknologi: React + TypeScript (Vite), Node.js + Express, MySQL (InnoDB).

Repositori ini dikerjakan **bersama** oleh beberapa pengembang. Rancangan awalnya (kode prototipe, model data awal) berasal dari anggota tim lain. Kode yang sudah ada adalah pekerjaan orang lain, jadi diperlakukan hati-hati.

## Dokumen acuan (baca sebelum mengerjakan apa pun)

| Dokumen | Dipakai untuk |
|---|---|
| `docs/PRD.md` | Aturan bisnis (BR-xx), kebutuhan (FR-xx), keputusan (D-x), tes (T-5.x). Untuk "apa yang benar", PRD yang menang |
| `docs/SYSTEM-DESIGN.md` | Alur, ERD, skema SQL, resep transaksi, pengelolaan basis data, API, dan cara beralih dari prototipe (bagian 13). Untuk soal teknis, dokumen ini yang menang |
| `docs/PANDUAN-LARAGON.md` | Menjalankan dan mengelola MySQL di Laragon |
| `TODO.md` | Urutan kerja. Kerjakan satu task per sesi, sesuai ID |

**Status dokumen.** PRD dan SYSTEM-DESIGN berstatus **draf** sampai kedua pengembang menyetujuinya lewat pull request. Selama masih draf, bila isinya bertentangan dengan kode yang sudah berjalan atau dengan keinginan pemilik proyek, **tanyakan dulu**. Jangan menganggap draf sebagai perintah yang mengalahkan kode rekan.

## Aturan keras

1. Logika peminjaman, pemesanan, klaim, verifikasi, perpanjangan, dan stok hanya ada di server, di dalam transaksi. Frontend tidak menghitung stok.
2. Setiap perubahan `items.total`, `tersedia`, atau `rusak` menulis satu baris `stock_movements` dalam transaksi yang sama.
3. Tidak ada SQL di rute atau komponen. Semua akses data lewat `server/db/`.
4. Validasi dilakukan di server, bukan hanya di klien.
5. Jangan commit `.env`, berkas dump `.sql`, atau `database.sqlite`. Jangan menulis kata sandi di kode atau README. Repositori ini publik.
6. Jangan mengubah `docs/PRD.md` tanpa persetujuan eksplisit dari pemilik proyek. Bila perubahan kode mengubah desain, perbarui `docs/SYSTEM-DESIGN.md` di commit yang sama.
7. Bila dokumen ambigu, bertentangan dengan kode, atau bertentangan satu sama lain: **berhenti dan tanyakan**. Jangan menebak.
8. Task bertanda ⚙ di `TODO.md`: tulis tesnya dulu, baru kodenya.
9. Jangan menjalankan tes atau eksperimen pada basis data produksi. Tes hanya boleh berjalan pada basis data yang namanya berakhiran `_test`.
10. Agent tidak menjalankan perintah git yang menulis (seperti `git add`, `git commit`, `git push`, `git checkout`, `git merge`, dll.). Agent hanya boleh menjalankan perintah baca-saja: `git status`, `git diff`, `git log`, `git show`, `git grep`, `git ls-files`, `git check-ignore`.

## Aturan kolaborasi (mengurangi konflik dengan kode rekan)

1. **Tambah dulu, ubah belakangan.** Bangun kode baru berdampingan dengan kode lama (lihat `docs/SYSTEM-DESIGN.md` bagian 13). Jangan menghapus atau menulis ulang kode prototipe kecuali task menyebutnya secara tegas.
2. **Satu paket satu branch, digabung ke v5 setelah diperiksa, satu commit per task dengan ID task, PR ke main per phase.** Nama branch: `feat/<id-task>-<nama-singkat>`. Jangan menggabungkan beberapa task dalam satu perubahan.
3. **Berkas besar** (`server.js`, `src/services/db.ts`) tidak diedit besar-besaran tanpa pemberitahuan kepada pemilik proyek, karena rekan bisa sedang mengeditnya.
4. **Sebelum membuka pull request:** gabungkan `main` terbaru ke branch dan selesaikan konflik di branch sendiri. Bila konflik menyangkut kode rekan, jangan memilih salah satu sisi: laporkan konfliknya dan tanyakan.
5. **Berkas bersama** (`src/types.ts`, `package.json`, `package-lock.json`) diubah dalam pull request kecil tersendiri.
6. **Layar baru** mengikuti gaya komponen di src/components.
7. **Perbedaan dengan rancangan rekan** (misalnya skema, nama rute, struktur komponen) dilaporkan dan dibicarakan sebelum dikodekan, bukan diselesaikan sepihak.

## Cara menyelesaikan task

1. Baca kriteria "Selesai jika" pada task di `TODO.md`.
2. Kerjakan di branch yang memuat ID task.
3. Jalankan tes, dan pastikan pemeriksaan invarian BR-01 lolos.
4. Centang task di `TODO.md` dan ringkas apa yang berubah dalam beberapa baris, termasuk bila ada perbedaan dengan kode atau rancangan yang ada.

## Perintah

Isi bagian ini setelah tahap fondasi selesai (menjalankan aplikasi, menjalankan migrasi, menjalankan tes).
