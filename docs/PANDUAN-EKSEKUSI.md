# Panduan Eksekusi: dari Langkah 0 sampai Semua Task Selesai

Dokumen ini untuk **Anda (manusia)**, bukan untuk agent. Isinya urutan kerja lengkap: persiapan Git, prompt yang ditempel ke agent AI (Antigravity), titik periksa, dan cara menggabungkan hasil ke repo bersama.

Dasar: `PRD.md` v5.2, `SYSTEM-DESIGN.md` v1.2, `AGENTS.md`, `README.md`, `TODO.md`. Simpan berkas ini di `docs/PANDUAN-EKSEKUSI.md`.

> **Soal fakta repo.** Beberapa temuan di bawah (server memakai PostgreSQL, tanpa autentikasi, kredensial tertulis di kode) berasal dari pembacaan repo pada diskusi sebelumnya dan **belum saya verifikasi sendiri** (GitHub menolak pembacaan otomatis). Bagian B.4 memberi tiga perintah agar Anda memeriksanya dalam dua menit, dan sesi S02 (audit) memutuskan secara tertulis. Bila folder lokal Anda berbeda dari GitHub, hasil audit yang menang.

## Isi

- A. Cara memakai panduan ini
- B. Langkah 0 (dikerjakan Anda, sebelum prompt pertama)
- C. Prompt induk (PEMBUKA)
- D. Peta sesi
- E. Prompt per sesi
- F. Gerbang phase dan pull request ke `main`
- G. Ritual tiap sesi dan penanganan masalah
- Lampiran A: draf `SYSTEM-DESIGN.md` bagian 13

---

## A. Cara memakai panduan ini

### A.1 Gambaran alur

```
Langkah 0 (Anda): Git, branch v5, tutup eksposur, backup, atur Antigravity
        │
        ▼
  ┌── SESI (diulang 34 kali, urut menurut peta di bagian D) ────────────────┐
  │ 1. Anda: ritual awal (G.1): fetch, merge origin/main, buat branch sesi  │
  │ 2. Anda: percakapan baru di Antigravity, tempel PEMBUKA + prompt sesi   │
  │ 3. Agent: periksa "sudah ada?" → tulis rencana → Anda setujui           │
  │ 4. Agent: kerjakan task 1 → laporan → BERHENTI                          │
  │ 5. Anda: tes, baca diff, commit, jawab "lanjut" → task berikutnya       │
  │ 6. Anda: merge branch sesi ke v5, push v5 (G.2)                         │
  └─────────────────────────────────────────────────────────────────────────┘
        │  tiap akhir phase
        ▼
  Gerbang phase (F) → Pull Request v5 → main → teman Anda meninjau → digabung
```

### A.2 Prinsip

1. **Satu sesi = satu percakapan agent baru.** Tiap giliran, agent membaca ulang seluruh percakapan. Percakapan panjang makin boros dan agent makin mudah lupa aturan.
2. **PEMBUKA ditempel sekali di awal percakapan**, lalu prompt sesi. Aturan lengkap tetap ada di `AGENTS.md`, jadi prompt sesi hanya memuat hal yang tidak ada di dokumen.
3. **Agent tidak menjalankan git yang menulis.** Anda yang commit, merge, dan push. Perintah git menulis ke riwayat bersama dan sebagian sulit dibatalkan.
4. **Laporan agent adalah klaim, bukan bukti.** Jalankan sendiri `npm test` dan baca diff sebelum commit.
5. **Hemat kuota.** Agent membaca hanya bagian dokumen yang dirujuk task, bukan PRD dan SYSTEM-DESIGN utuh. Pakai model terkuat hanya pada sesi bertanda **K** di bagian D.

### A.3 Aturan merapel task (paket)

Beberapa task digabung dalam satu sesi (satu percakapan, satu branch, satu commit per task). Aturan gabungnya:

1. Satu lapisan atau satu layar yang sama.
2. Task kedua memakai hasil task pertama.
3. Tidak ada langkah manual Anda di tengah.
4. Gabungannya bisa direview dalam satu duduk, kira-kira tiga task atau kurang.

**Tidak pernah digabung dengan task lain:** task server yang menyangkut konkurensi stok (2.2, 3.1, 3.3, 3.5), autentikasi (1.5 dan 5.7; 1.5 hanya boleh ditemani 1.4 karena memakai hasilnya), dan migrasi data nyata (6.1). Alasannya: bila agent salah di satu, ia meniru kesalahan yang sama di task berikutnya dan Anda sulit tahu mana yang salah.

Di dalam sesi, agent **berhenti setelah tiap task** dan menunggu kata "lanjut". Itu titik Anda memeriksa, commit, lalu melepas agent ke task berikutnya.

### A.4 Bila task ternyata sudah ada di proyek

Kode di folder ini dirancang oleh teman Anda lebih dulu, dan ia masih menambah commit ke `main`. Karena itu **setiap sesi dimulai dengan pemeriksaan "sudah ada?"** (diwajibkan oleh PEMBUKA). Untuk tiap task, agent menetapkan salah satu status berikut, dengan bukti `file:baris`:

| Status | Arti | Tindakan agent |
|---|---|---|
| **A. Sudah memenuhi** | Fungsi ada dan sesuai kriteria "Selesai jika" | Tidak mengubah apa pun. Menambah tes yang kurang |
| **B. Sebagian** | Ada, tetapi ada selisih | Mengerjakan hanya selisihnya |
| **C. Ada tapi berbeda rancangan** | Ada, tetapi bertentangan dengan PRD atau SYSTEM-DESIGN | **Berhenti dan bertanya.** Tidak menimpa |
| **D. Belum ada** | Tidak ditemukan | Mengerjakan seluruhnya |

Dua hal membantu:

- Sesi **S02** (audit) menghasilkan tabel **Peta kesiapan task** di `docs/AUDIT-0.2.md`: status A sampai D untuk setiap task di TODO. Sesi-sesi berikutnya membacanya lebih dulu, jadi tidak mencari dari nol.
- Ritual awal sesi (G.1) memasukkan commit terbaru teman Anda ke `v5` **sebelum** agent mulai, sehingga agent melihat pekerjaan terbarunya.

Jawab agent pada status **C** dengan tegas: apakah rancangan teman yang dipertahankan, atau PRD yang berlaku. Bila keputusannya perlu teman Anda, jawab "tunda, catat sebagai keputusan menunggu" dan minta agent melanjutkan bagian lain.

---

## B. Langkah 0 (dikerjakan Anda, sebelum prompt pertama)

### B.1 Prasyarat

| ✓ | Hal | Cara memeriksa |
|---|---|---|
| ☐ | Git terpasang dan identitas terisi | `git --version`, `git config user.name`, `git config user.email` |
| ☐ | Node.js terpasang | `node -v` |
| ☐ | Antigravity terpasang dan folder proyek terbuka di dalamnya | Buka folder proyek, bukan folder induknya |
| ☐ | Folder lokal adalah clone repo teman Anda | `git remote -v` menunjukkan `origin` ke repo `Peminjaman_investaris` milik teman Anda |
| ☐ | Tidak ada perubahan tertunda | `git status` bersih. Bila tidak, commit atau `git stash` dulu |
| ☐ | Anda tahu apakah akun GitHub Anda boleh menulis ke repo itu | Lihat B.2, bagian "hak akses" |

### B.2 Cara kerja Git di proyek ini (jawaban untuk "commit, push, lalu `main`")

Ringkasnya, **ya**: pekerjaan Anda masuk ke `main` hanya lewat Pull Request yang ditinjau teman Anda. Tetapi ada tiga hal yang sering tertukar.

**1. Commit dan push itu berbeda.**

| Perintah | Efek | Terlihat teman Anda? |
|---|---|---|
| `git commit` | Menyimpan perubahan di **laptop Anda saja** | Tidak |
| `git push origin v5` | Mengunggah branch `v5` ke GitHub | Ya, sebagai **branch** bernama `v5`. `main` tidak berubah |
| Pull Request `v5` → `main` | Mengajukan penggabungan | Ya, ia bisa membaca, mengomentari, menyetujui |
| Tombol **Merge** di PR | Memasukkan isi `v5` ke `main` | `main` baru berubah di titik ini |

Jadi saat Anda commit tidak ada yang muncul di repo teman Anda. Saat push `v5`, yang muncul hanya sebuah branch baru, dan sistem yang ia pakai (di `main`) tidak terpengaruh.

**2. Hak akses menentukan caranya.**

- Repo ini milik akun `idrsabdlh-coder`. Bila akun Anda **collaborator** di repo itu, `git push -u origin v5` langsung berhasil.
- Bila push ditolak (galat 403): akun Anda belum collaborator. Ada dua jalan: minta teman Anda menambahkan Anda (Settings → Collaborators), atau **fork** repo ke akun Anda, push ke fork, lalu buka PR dari fork ke repo teman Anda:
  ```bash
  git remote add fork https://github.com/<akun-anda>/Peminjaman_investaris.git
  git push -u fork v5
  ```

**3. "Disetujui" hanya benar-benar ditegakkan bila `main` dilindungi.**

Secara bawaan, siapa pun yang punya akses tulis boleh meng-klik Merge pada PR-nya sendiri, bahkan push langsung ke `main`. Persetujuan teman Anda menjadi aturan yang **dipaksa GitHub** hanya bila pemilik repo mengaktifkan proteksi branch (Settings → Branches → aturan untuk `main` → *Require a pull request before merging*, dan minta minimal satu persetujuan). Sebelum itu, ia hanya kesepakatan antara Anda berdua. Karena teman Anda sekarang commit langsung ke `main`, proteksi itu akan menghentikan kebiasaan tersebut, jadi bicarakan dulu dengannya.

**Dua pengaturan PR yang perlu disepakati:**

- **Metode penggabungan: *Create a merge commit*, bukan *Squash and merge*.** `v5` akan digabung ke `main` berkali-kali (satu kali per phase). Bila memakai squash, riwayat `v5` dan `main` terpisah dan PR berikutnya memunculkan konflik berulang atas hal yang sudah digabung.
- **Buka PR sebagai *Draft* sejak awal** bila ingin teman Anda melihat arah pekerjaan sebelum siap ditinjau.

**Alur ringkas:**

```
laptop Anda                         GitHub (repo teman Anda)
───────────                         ────────────────────────
feat/s11-... ──merge──► v5 ──push──► branch v5
                                       │
                                       └─ Pull Request v5 → main ──► ia meninjau ──► Merge ──► main
```

### B.3 Menyiapkan branch v5

```bash
git fetch origin
git switch -c v5 origin/main          # branch panjang untuk seluruh pengembangan v5
git push -u origin v5                 # opsional sekarang; aman, tidak mengubah main
git log -1 --format="%h %s"           # catat hash; klaim awal: main di 60c52b5 (7 Okt 2026)
```

Bila hash berbeda dari 60c52b5, tidak masalah: hasil audit S02 yang menang.

Mulai sekarang, **jangan bekerja di `main` dan jangan push ke `main`.** Branch sesi dibuat dari `v5` (lihat G.1).

### B.4 Periksa tiga klaim dalam dua menit

Jalankan di PowerShell dari folder proyek. Hasilnya menentukan apakah sebagian dokumen perlu diperbaiki di S04.

```powershell
# 1. Basis data apa yang dipakai server? (klaim: PostgreSQL, bukan SQLite)
Select-String -Path server.js -Pattern "from 'pg'|require\('pg'\)|better-sqlite3|app_state" | Select-Object LineNumber, Line

# 2. Adakah autentikasi pada rute /api? (klaim: tidak ada)
Select-String -Path server.js -Pattern "app\.(get|put|post|delete)\(" | Select-Object LineNumber, Line

# 3. Adakah kata sandi bawaan di kode? (klaim: ada, termasuk README)
Get-ChildItem -Recurse -File -Exclude node_modules | Select-String -Pattern "password123" | Select-Object Path, LineNumber
```

Catat hasilnya. Bila no. 1 menunjukkan `pg` dan `app_state`, README dan sebagian SYSTEM-DESIGN (bagian 11) yang menyebut SQLite sebagai sumber migrasi salah, dan S04 memperbaikinya.

### B.5 Tutup eksposur server lama

Sistem lama tidak punya autentikasi pada `/api/state`, dan login di UI hanya hiasan: orang yang tahu alamatnya bisa membaca dan menimpa seluruh data tanpa membuka halaman login. Ada dua jalur terbuka: **tunnel** (internet) dan **bind `0.0.0.0`** (semua perangkat satu jaringan).

**A. Matikan tunnel.** Repo hanya menulis "tunnel" tanpa menyebut alatnya, jadi tanyakan ke teman Anda alat yang ia pakai.

| Alat | Cara mematikan |
|---|---|
| ngrok | `Ctrl+C` di terminalnya, atau `Get-Process ngrok \| Stop-Process`. Lalu hentikan endpoint yang masih aktif di dasbor ngrok |
| cloudflared | `Ctrl+C`, atau `Get-Process cloudflared \| Stop-Process`. Bila berupa layanan: `Stop-Service cloudflared` (nama bisa berbeda), dan hapus tunnel di dasbor Cloudflare |
| localtunnel (`lt`) | `Ctrl+C` di terminalnya |
| VS Code Ports, Dev Tunnels, Codespaces | Panel **Ports**, klik kanan, **Stop Forwarding** |
| Tailscale Funnel | `tailscale funnel status`, lalu `tailscale funnel reset` (cek `tailscale funnel --help` untuk versi Anda) |

Pencarian umum:

```powershell
Get-Process | Where-Object { $_.ProcessName -match '^(ngrok|cloudflared|lt|devtunnel|tailscale.*)$' }
```

**B. Buktikan sudah tertutup.** Dari HP dengan Wi-Fi mati (data seluler), buka alamat tunnel lama diikuti `/api/state`. Harus gagal. Bila masih mengembalikan JSON, belum tertutup.

**C. Cek apakah ada yang mengutak-atik.** Aplikasi tidak punya log akses, jadi satu-satunya jejak ada di tunnel (ngrok: Traffic Inspector, Cloudflare: log tunnel). Cari `PUT /api/state/...` dari IP yang tidak dikenal, dan bandingkan data sekarang dengan backup (B.6). Karena penulisan mengganti seluruh larik, data yang tertimpa tidak bisa dipulihkan dari aplikasi.

**D. Pengaman sementara untuk LAN.** Sistem lama dipakai laptop lain lewat `VITE_API_URL`, jadi tidak bisa ditutup sepenuhnya. Yang bisa dilakukan tanpa mengubah kode teman Anda:

- Jaringan Wi-Fi/Ethernet bertipe **Private**, bukan Public.
- Windows Firewall: batasi port 3000 dan 3001 hanya dari IP laptop teman Anda, dan hapus aturan lebar yang dibuat dialog "Allow access":
  ```powershell
  Get-NetFirewallRule -DisplayName "Node.js*" | Select DisplayName, Enabled, Profile
  New-NetFirewallRule -DisplayName "Inventaris LAN" -Direction Inbound -Protocol TCP `
    -LocalPort 3000,3001 -Action Allow -Profile Private -RemoteAddress <IP-laptop-teman>
  ```
- Bila memakai PostgreSQL: hanya mendengarkan localhost (`listen_addresses`), kata sandi bukan bawaan, port 5432 tidak ikut di-forward.
- Jangan masukkan data nyata ke sistem lama sampai v5 menggantikannya.

**E. Tuntas di rencana, bukan di tambalan.** Autentikasi (sesi S14 dan S15) melindungi jalur v5, tetapi `/api/state` lama **tetap terbuka sampai peralihan di Phase 6**. Tunnel publik untuk sistem lama tidak boleh dihidupkan lagi. Bila teman Anda butuh akses dari luar, jaringan privat seperti Tailscale (tanpa Funnel) jauh lebih aman daripada URL publik.

### B.6 Backup data nyata

Lakukan **sekarang**, sebelum apa pun, ke folder di luar proyek. Pilih sesuai hasil B.4 no. 1:

```powershell
# Bila PostgreSQL: kata sandi lewat variabel lingkungan sementara, bukan argumen perintah
$env:PGPASSWORD = Read-Host "Kata sandi Postgres"
pg_dump -h localhost -U <pengguna> -d <nama-db> -F c -f "D:\backup\inventaris_prototipe_$(Get-Date -Format yyyyMMdd_HHmm).dump"
Remove-Item Env:PGPASSWORD

# Bila SQLite: matikan server.js dulu, lalu salin berkas
Copy-Item database.sqlite "D:\backup\database_$(Get-Date -Format yyyyMMdd_HHmm).sqlite"
```

Periksa hasilnya: ukuran berkas tidak nol, dan (Postgres) `pg_restore -l <berkas>` menampilkan daftar isi.

### B.7 Atur Antigravity

Nama pengaturan bisa berbeda antar versi; tujuannya yang penting.

1. Kebijakan eksekusi terminal: **minta persetujuan** untuk setiap perintah (jangan otomatis). Anda menolak setiap perintah git yang menulis.
2. Mode **Planning** bila tersedia, supaya rencana tampil sebelum berkas diubah.
3. Buka **folder proyek** (yang berisi `AGENTS.md`) sebagai workspace.
4. Pilih model sesuai kolom **Model** di bagian D: **K** = terkuat yang tersedia, **B** = biasa, **R** = ringan.

### B.8 Daftar periksa sebelum sesi pertama

- [ ] B.1 semua tercentang
- [ ] Branch `v5` ada, dan Anda berada di `v5` (`git branch --show-current`)
- [ ] Hasil B.4 tercatat
- [ ] Tunnel mati dan terbukti (B.5 A dan B)
- [ ] Backup dibuat dan diperiksa (B.6)
- [ ] Antigravity diatur (B.7)
- [ ] Teman Anda tahu: Anda bekerja di `v5` dan tidak akan push ke `main`; ia sebaiknya `git pull` sebelum mulai bekerja dan tidak mengedit `server/`, `db/`, `scripts/`, `src/v5/`

---

## C. Prompt induk (PEMBUKA)

Tempel **sekali di awal setiap percakapan baru**, lalu tempel prompt sesi dari bagian E.

```text
Peran: engineer senior di proyek kolaboratif. Rancangan awal proyek dibuat anggota tim lain, jadi kode yang sudah ada adalah pekerjaan orang lain dan diperlakukan hati-hati.

BACA DULU (hemat konteks):
- AGENTS.md sampai habis.
- Bagian task ini di TODO.md.
- Dari docs/PRD.md dan docs/SYSTEM-DESIGN.md baca HANYA bagian yang dirujuk task (nomor BR, FR, D, T-5.x, dan bagian SYSTEM-DESIGN), ditambah BR-01. Jangan memuat dokumen utuh kecuali saya minta.
- docs/AUDIT-0.2.md, tabel "Peta kesiapan task", untuk baris task ini (bila berkas sudah ada).
Soal aturan bisnis, PRD menang. Soal teknis, SYSTEM-DESIGN menang. Bila dokumen ambigu, saling bertentangan, atau bertentangan dengan kode: berhenti dan tanyakan. Jangan menebak dan jangan mengarang isi berkas yang tidak ada.

LANGKAH 1: PERIKSA SUDAH-ADA (sebelum merencanakan)
Cari di repo (git grep, daftar berkas) apakah yang diminta tiap task sudah ada: di kode prototipe, di pekerjaan rekan, atau di sesi saya sebelumnya. Beri tiap task satu status, dengan bukti file:baris:
  A. SUDAH MEMENUHI: jangan diubah. Tambahkan hanya tes yang kurang.
  B. SEBAGIAN: kerjakan hanya selisihnya.
  C. ADA TAPI BERBEDA RANCANGAN: berhenti dan tanyakan. Jangan menimpa.
  D. BELUM ADA: kerjakan seluruhnya.
Jangan menulis ulang kode yang sudah memenuhi hanya karena gayanya berbeda.

LANGKAH 2: RENCANA
Tulis rencana singkat: berkas yang akan disentuh, urutan, risiko, dan titik berhenti. Tunggu persetujuan saya sebelum mengubah berkas.

LANGKAH 3: KERJAKAN
- Satu sesi, satu paket task yang saya sebut. Jangan menyentuh task lain.
- Task bertanda ⚙: tulis tes dulu, tunjukkan tes itu GAGAL, baru tulis kodenya.
- Setelah SETIAP task: jalankan tes, tempel keluarannya apa adanya, lalu BERHENTI dan tunggu kata "lanjut" dari saya.
- Bila task berikutnya memaksa mengubah hasil task sebelumnya, laporkan dulu sebelum mengubah.
- Bila berkas yang berubah melewati 25, atau percakapan sudah sangat panjang, usulkan memecah sesi.

LARANGAN
- Git: SAYA yang menjalankan perintah yang menulis. Anda hanya boleh git status, git diff, git log, git show. Jangan menjalankan add, commit, push, pull, merge, checkout, switch, rebase, reset, stash, tag, dan jangan membuat branch. Bila perlu, tulis perintahnya dan alasannya di laporan, jangan dijalankan.
- Jangan perintah destruktif (DROP, rm -rf, git reset --hard, force push, penghapusan data) dan jangan menyentuh basis data produksi.
- Jangan meminta, mencetak, atau menulis kata sandi ke berkas mana pun. Pakai placeholder.
- Jangan menambah dependensi tanpa menyebut alasannya di rencana.
- Jangan mengubah docs/PRD.md tanpa persetujuan eksplisit saya.

LAPORAN AKHIR (per task)
1. Status sudah-ada (A/B/C/D) dan buktinya.
2. Berkas yang berubah.
3. Tes yang dijalankan, keluaran apa adanya.
4. Selisih dengan dokumen atau kode rekan.
5. Keputusan yang menunggu saya.
6. Satu baris pesan commit yang disarankan, diawali ID task, misalnya "feat(2.2): buat peminjaman".
```

### C.1 Menjawab pertanyaan agent

- Jawab singkat dan tegas. Agent yang bertanya sedang berhenti di tempat yang benar.
- Bila jawabannya perlu teman Anda atau belum Anda putuskan: "tunda, catat di laporan sebagai keputusan menunggu, lanjutkan bagian lain".
- Jangan menjawab "terserah". Agent akan memilih, dan pilihannya belum tentu pilihan Anda.

### C.2 Tanda agent melenceng (hentikan dan koreksi)

- Mengubah berkas di luar daftar rencana yang Anda setujui.
- Menulis ulang kode teman Anda yang sudah memenuhi (status A) atau yang berbeda rancangan (status C).
- Menjalankan atau mengusulkan `git add`, `commit`, `push`, `reset`, atau `checkout`.
- Menambah dependensi yang tidak ada di rencana.
- Meminta atau menulis kata sandi, atau membuat berkas `.env` sungguhan.
- Tes yang langsung hijau pada task ⚙ sebelum kodenya ditulis.
- Laporan tanpa keluaran tes yang ditempel apa adanya.

---

## D. Peta sesi

**Pelaku:** AGENT = agent bekerja, Anda memeriksa. MANUSIA = Anda yang memutuskan atau mengerjakan, agent hanya menyiapkan bahan.
**Model:** K = terkuat yang tersedia, B = biasa, R = ringan.

| Sesi | Task di TODO | Isi | Pelaku | Model | Syarat sebelum mulai |
|---|---|---|---|---|---|
| **Phase 0** | | | | | |
| S01 | 0.1, 0.1b, 0.6 | Susun repo, perbaikan dokumen tahap 1, rapikan konfigurasi | AGENT | R | Langkah 0 selesai |
| S02 | 0.2, 0.3, 0.7, 6.2 | Audit kode, peta kesiapan task, perintah tag dan backup, lembar baseline, bahan penyatuan divisi | AGENT (baca-saja) | K | S01 digabung |
| S03 | 0.4 (bahan) | Bahan keputusan | AGENT → **MANUSIA memutuskan** | B | S02 |
| S04 | 0.4 (terapan) | Terapkan keputusan dan hasil audit ke dokumen | AGENT | B | Kolom keputusan di `KEPUTUSAN-0.4.md` terisi |
| S05 | 0.5 | MySQL di Laragon | **MANUSIA** (agent menyiapkan bahan) | R | S04, keputusan MySQL final |
| **Phase 1** | | | | | |
| S11 | 1.1, 1.2 | Lapisan akses data, runner migrasi, skema awal | AGENT | B | S05 |
| S12 | 1.9, 1.3 | Kerangka tes, pemeriksaan saat start | AGENT | B | S11 |
| S13 | 1.7, 1.8 | Utilitas inti, buku besar stok | AGENT | B | S12 |
| S14 | 1.4, 1.5 | Seed dan skrip admin, autentikasi server | AGENT | **K** | S13 |
| S15 | 1.6 | Bersihkan kredensial, sambungkan login | AGENT | B | S14 |
| **Phase 2** | | | | | |
| S21 | 2.1, 2.6 | Katalog publik, kelola barang, stok, divisi | AGENT | B | Gerbang Phase 1 |
| S22 | 2.2 | Buat peminjaman | AGENT | **K** | S21 |
| S23 | 2.3, 2.4 | Form peminjaman dan struk (FE) | AGENT | R | S22 |
| S24 | 2.5, 4.4 | Pembatalan peminjam dan admin (server) | AGENT | B | S22 |
| **Phase 3** | | | | | |
| S31 | 3.1 | Cek peminjaman dan status turunan | AGENT | **K** | Gerbang Phase 2 |
| S32 | 3.3 | Klaim pengembalian parsial (server) | AGENT | **K** | S31 |
| S33 | 3.2, 3.4, 3.2a | Cek Peminjaman, form klaim, tombol batal (FE) | AGENT | R | S32 |
| S34 | 3.5 | Antrean dan verifikasi (server) | AGENT | **K** | S32 |
| S35 | 3.6, 3.8 | Antrean verifikasi dan hasil klaim (FE) | AGENT | R | S34 |
| S36 | 3.7 | Stok rusak | AGENT | B | S34 |
| S37 | 3.9 | Tes invarian acak | AGENT | B | S36 |
| **Phase 4** | | | | | |
| S41 | 4.1, 4.2, 4.3 | Perpanjangan peminjam dan admin | AGENT | **K** | Gerbang Phase 3 |
| S42 | 4.5 | Koreksi peminjaman | AGENT | B | S41 |
| **Phase 5** | | | | | |
| S51 | 5.1, 5.2 | Daftar, filter, detail, lini masa | AGENT | B | Gerbang Phase 4 |
| S52 | 5.2a | Tombol aksi admin di halaman detail (FE: perpanjang, batal, koreksi) | AGENT | R | S51 |
| S53 | 5.3, 5.5, 5.6 | Dasbor, pengaturan, jejak audit | AGENT | R | S51 |
| S54 | 5.4, 5.9 | Laporan PDF dan CSV | AGENT | B | S51 |
| S55 | 5.7 | Akun admin | AGENT | **K** | S51 |
| S56 | 5.8 | Perilaku kiosk | AGENT | R | S53 |
| **Phase 6** | | | | | |
| S61 | 6.1 | Skrip migrasi data lama | AGENT | **K** | Gerbang Phase 5, CSV divisi disetujui |
| S62 | 6.3 | Bahan hitung fisik | **MANUSIA** (agent menyiapkan bahan) | B | S61 lulus di basis data percobaan |
| S63 | 6.4, 6.5 | Backup terjadwal, hardening MySQL | AGENT + tangan Anda | B | S61 |
| S64 | 6.6 | Satu port, layanan otomatis | AGENT + tangan Anda | B | S63 |
| S65 | 6.7, 6.8, 6.9 | UAT, runbook, bahan go-live | AGENT (dokumen) | R | S64 |
| **Phase 7** | 7.x | Backlog, satu butir per sesi | AGENT | B | Setelah go-live |

Total 34 sesi sebelum Phase 7 (sebelumnya 54 task).

### D.1 Perbedaan dari rancangan paket sebelumnya

1. **2.1 dipasangkan dengan 2.6** (sama-sama data induk), bukan dengan 2.2, supaya 2.2 berdiri sendiri sesuai aturan konkurensi (A.3).
2. **3.3 (server klaim) dikerjakan sebelum paket FE** 3.2 + 3.4, karena form klaim butuh API-nya.
3. **4.4 (server) digabung dengan 2.5** di S24: keduanya memakai fungsi pembatalan yang sama. T-5.27 ikut gerbang Phase 2. Sisi FE 4.4 tetap di S52.
4. **6.2 dimajukan ke S02**, karena hanya membaca data lama. Hasilnya, CSV pemetaan divisi, disetujui Anda sebelum S61.
5. **0.4 dipecah dua sesi**: S03 menyiapkan bahan, Anda memutuskan di berkas, S04 menerapkannya ke dokumen.
6. **Perbaikan dokumen dijalankan agent** (S01 dan S04), sesuai permintaan Anda.
7. **Peta paket tidak disalin ke `TODO.md`.** Dua tempat berarti dua sumber kebenaran yang bisa berbeda. `TODO.md` hanya merujuk ke bagian D berkas ini.
8. **Pemeriksaan "sudah ada?"** diwajibkan di PEMBUKA, dan S02 menghasilkan Peta kesiapan task.
9. **Butir baru 3.2a dan 5.2a** (dibuat S01) menampung sisi FE yang digeser: tombol batal pemesanan (butuh kartu peminjaman dari 3.2) dan tombol aksi admin (butuh halaman detail dari 5.2).

---

## E. Prompt per sesi

Cara pakai: buka percakapan baru → tempel **PEMBUKA** (bagian C) → tempel prompt sesi di bawah. Nama branch sesi dan perintah commit ada di bagian G. Teks dalam `<...>` diisi Anda.

### Phase 0

#### S01: susun repo, perbaikan dokumen tahap 1, rapikan konfigurasi (R)

Branch: `feat/s01-susun-repo`. Hanya dokumen dan konfigurasi, tanpa menyentuh kode di `src/` maupun `server.js`.

```text
SESI S01. Paket: 0.1, 0.1b, 0.6. Kerjakan berurutan, berhenti setelah tiap task.

TASK 0.1: susun repo (dokumen saja).
1. Pindahkan PRD.md dan SYSTEM-DESIGN.md ke docs/ bila belum. Pastikan AGENTS.md, README.md, TODO.md ada di akar. Simpan docs/PANDUAN-EKSEKUSI.md bila saya sudah menaruhnya. Perbaiki tautan relatif antar dokumen.
2. Proyek ini TIDAK memakai berkas desain terpisah (keputusan pemilik proyek). Hapus rujukan ke docs/DESIGN.md di AGENTS.md (tabel dokumen acuan dan aturan kolaborasi tentang layar baru), README (tabel dokumentasi), SYSTEM-DESIGN (header dan bagian 9 bila ada), dan PRD bagian 16. Ganti aturan layar baru menjadi: mengikuti gaya komponen yang sudah ada di src/components (Tailwind, lucide-react, motion).
3. docs/PANDUAN-LARAGON.md akan saya masukkan sendiri: biarkan rujukannya, jangan membuat berkasnya. Bila SYSTEM-DESIGN bagian 13 belum ada, jangan dibuat: laporkan dan tanyakan apakah saya punya drafnya.
4. TODO.md (task 0.1 dan 1.2) dan dokumen lain yang menyebut PERUBAHAN-DOKUMEN.md: berkas itu bukan bagian repo. Ganti rujukannya ke SYSTEM-DESIGN bagian 6.
5. Aturan git di AGENTS.md: tambahkan di "Aturan keras" bahwa agent tidak menjalankan perintah git yang menulis (add, commit, push, pull, merge, checkout, switch, rebase, reset, stash, tag), hanya status, diff, log, show; pengembang yang menjalankannya. Sesuaikan kalimat "Kerjakan di branch" di "Cara menyelesaikan task".

TASK 0.1b: perbaikan dokumen yang tidak butuh keputusan (saya menyetujui semuanya).
1. PRD: tabel header punya baris dengan kolom berlebih ("| | **Basis data** |"): jadikan dua kolom seperti baris lain. Versi header 5.1 menjadi 5.2 agar sama dengan riwayat revisi.
2. PRD bagian 6, kalimat D-12 yang ambigu ("tidak boleh tidak dapat"): ganti menjadi 'Peminjaman yang memuat barang bertanda "tidak boleh diperpanjang" tidak dapat diperpanjang sendiri oleh peminjam. Admin tetap dapat memperpanjang.'
3. PRD, FR-K-04: tulisan "Dipesan, mulai <tanggal>" hilang di GitHub karena dibaca sebagai tag HTML. Ganti menjadi "[tanggal]". Cari pola serupa lain (tag di luar blok kode) dan laporkan.
4. Kalimat "[Hapus butir alasan ...]" di paragraf "Mengapa MySQL" JANGAN dihapus: menunggu keputusan saya di S03.
5. AGENTS.md aturan kolaborasi "satu task satu branch satu pull request" dan TODO.md aturan kerja nomor 1: ubah menjadi "Satu sesi (paket task) satu branch (feat/<id-sesi>-<nama>), digabung ke v5 oleh pengembang setelah diperiksa (tanpa PR per sesi; PR ke main dibuat per phase), satu commit per task dengan ID task di pesan commit. Urutan sesi dan batas paket ada di docs/PANDUAN-EKSEKUSI.md bagian D." JANGAN menyalin peta paket ke TODO.md (satu sumber kebenaran).
6. TODO.md: pindahkan 1.9 (kerangka tes) sebelum 1.3. Pisahkan sisi FE yang bergantung layar lain menjadi butir baru: 3.2a (tombol batal pemesanan di kartu peminjaman, dari 2.5) dan 5.2a (tombol aksi admin di halaman detail: perpanjang 4.3, batalkan 4.4, koreksi 4.5). Bila saya sudah memperbaiki TODO.md sendiri, jangan menimpa: laporkan selisihnya saja.
7. TODO.md 0.4: tambahkan tiga butir persyaratan klien (kategori barang, kondisi barang, tipe peminjam), operasi TANDAI_RUSAK, dan format kode klaim.
8. Jangan mengubah makna aturan bisnis apa pun. Perubahan hanya redaksi, struktur, dan rujukan.

TASK 0.6: rapikan konfigurasi.
1. .env.example baru sesuai SYSTEM-DESIGN 6A.4 (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, PORT, plus variabel untuk runner migrasi dan jalur mysqldump). Variabel lama prototipe (DATABASE_URL, VITE_API_URL) tetap ada dengan tanda "prototipe, dihapus saat peralihan".
2. .gitignore: hapus entri ganda, pastikan .env, *.sql, database.sqlite* terabaikan, .env.example tetap dikomit.
3. Jalankan pencarian rahasia (git grep) untuk kata sandi, token, connection string. Laporkan. Jangan menghapus apa pun dari kode di sesi ini.
4. Jangan membuat berkas .env sungguhan.

Selesai jika: semua tautan dokumen terbuka di pratinjau GitHub, git status bersih dari berkas rahasia, dan laporan memuat daftar rujukan menggantung serta temuan pencarian rahasia.
```

#### S02: audit kode, peta kesiapan, titik awal, baseline, divisi (K)

Branch: `feat/s02-audit`. Baca-saja kecuali berkas dokumen baru di `docs/`.

```text
SESI S02. Paket: 0.2, 0.3, 0.7, 6.2. Tanpa mengubah kode. Hanya membuat berkas di docs/ dan scripts/ bahan. Berhenti setelah tiap task.

TASK 0.2: audit kode terhadap dokumen. Keluaran: docs/AUDIT-0.2.md.
Telusuri server.js, src/services/db.ts, auth.ts, tests.ts, types.ts, vite.config.ts, dan komponen kiosk/admin. Setiap temuan wajib berlokasi file:baris:
1. Basis data apa yang BENAR-BENAR dipakai (README menyebut SQLite, tetapi dugaan: server.js memakai pg dan tabel app_state JSONB)? Dependensi mana yang tidak terpakai?
2. Di mana logika stok dan status dihitung? Validasi mana yang hanya ada di klien?
3. Endpoint mana tanpa autentikasi? Pola sinkronisasi klien-server (penulisan seluruh larik, risiko saling menimpa)?
4. Kredensial dan rahasia di kode, README, bundle. Penyimpanan di localStorage.
5. Konfigurasi yang membuka server ke luar (host, CORS, allowedHosts).
6. Apakah tests.ts dan TestRunnerModal ikut di bundle produksi?
7. Gejala: tombol login admin macet di "Memverifikasi...". Cari penyebabnya saja, jangan diperbaiki.
8. Tabel "Pemetaan data lama ke skema v5": setiap field lama (termasuk category, condition, borrower_type, notes, returned_date, return_condition) dan padanannya di SYSTEM-DESIGN bagian 6. Tandai yang TIDAK punya padanan.
9. Daftar selisih lain antara kode dan SYSTEM-DESIGN.
10. TABEL "PETA KESIAPAN TASK": untuk SETIAP task di TODO.md (0.x sampai 6.x), status A/B/C/D (definisi di PEMBUKA) dengan bukti file:baris. Sesi-sesi berikutnya membaca tabel ini.
Format: tabel (temuan, lokasi, dampak ke v5, rekomendasi). Tulis "tidak terverifikasi" bila ragu.

TASK 0.3: titik awal. Tambahkan ke docs/AUDIT-0.2.md bagian akhir:
1. Perintah membuat tag Git prototipe-v4 pada commit prototipe. Saya yang menjalankan; tag tidak di-push sebelum saya memutuskan.
2. Perintah backup sesuai database sebenarnya hasil 0.2 (pg_dump atau salin berkas), ke folder di luar proyek, tanpa kata sandi di argumen (pakai variabel lingkungan sementara atau berkas konfigurasi di luar repo). Plus langkah verifikasi backup.

TASK 0.7: baseline. Keluaran: docs/BASELINE-0.7.md.
Lembar uji manual T-5.1 sampai T-5.6 (PRD bagian 11) untuk dijalankan orang non-teknis di prototipe: langkah persis, hasil diharapkan, kolom "hasil sebenarnya" (kosong, saya isi). Tandai skenario yang pasti gagal di prototipe dan alasannya (file:baris).

TASK 6.2: bahan penyatuan divisi lama (hanya baca).
Dari data lama (sumber hasil 0.2), daftar nilai divisi unik beserta jumlah peminjaman (abaikan huruf besar dan spasi). Usulkan pemetaan ejaan ganda dalam CSV (lama, baru) di docs/divisi-pemetaan.csv. Jangan mengubah data. Bila Anda tidak bisa membaca data nyata (hanya kode), tulis skrip baca-saja yang saya jalankan sendiri dan jelaskan cara pakainya.

Selesai jika: sumber data lama tertulis pasti, peta kesiapan lengkap, daftar field tanpa padanan ada.
```

#### S03: bahan keputusan (B), lalu **Anda** memutuskan

Branch: `feat/s03-keputusan`. Agent menyusun bahan dan mengajukan pertanyaan. Anda menjawab di percakapan **dan** mengisi kolom "Keputusan" di berkas.

```text
SESI S03. Task: 0.4 (bahan keputusan). Anda TIDAK memutuskan apa pun. Keluaran: docs/KEPUTUSAN-0.4.md, tiap butir berisi pertanyaan, opsi, akibat pada skema/kode/data, satu rekomendasi singkat beralasan, dan kolom "Keputusan" kosong untuk saya.

Butir:
1. MySQL final atau tetap di sistem lama (D-13, Q-8). Siapa bertanggung jawab atas server: backup, restart, kata sandi. Alasan MySQL yang sungguh dimiliki tim (PRD bagian 6 memintanya). Dasari pada hasil audit: bila server lama memakai PostgreSQL, bandingkan juga opsi bertahan di PostgreSQL.
2. Printer kiosk (Q-3), barang dikecualikan dari perpanjangan (Q-6), pelepasan otomatis pemesanan tak diambil (Q-7).
3. Tiga persyaratan klien (bukan opsi): kategori barang, kondisi barang, tipe peminjam (karyawan/magang). Rancang perubahannya untuk PRD revisi 5.3 dan SYSTEM-DESIGN: BR baru, FR kiosk dan admin, kolom skema (usulan items.kategori dan loans.tipe_peminjam), migrasi, laporan, pemetaan data lama. Ajukan pertanyaan a dan c kepada saya SEBELUM menulis (b sudah saya putuskan):
   a. Kategori: daftar tetap atau dikelola admin seperti divisi?
   b. "Kondisi barang": KEPUTUSAN saya: kondisi per jenis barang ditampilkan sebagai TURUNAN dari jumlah unit rusak (Baik, Sebagian rusak, Semua rusak), bukan kolom ketikan admin. Nilai lama perlu_perbaikan tidak punya jumlah unit: catat sebagai daftar periksa hitung fisik (6.3), jangan ditebak.
   c. Apakah tipe peminjam mengubah aturan (kuota, durasi) atau hanya klasifikasi untuk form, filter, laporan? Usulan bawaan: klasifikasi saja, wajib di form kiosk.
   Bila saya menjawab "ikuti usulan bawaan", terapkan usulan bawaan.
4. Operasi "tandai tersedia menjadi rusak" tidak ada di SYSTEM-DESIGN 2.3, padahal diperlukan untuk stok rusak awal (6.3). Usulkan jenis buku besar TANDAI_RUSAK (tersedia -n, rusak +n) beserta perubahan skema dan PRD.
5. Format kode klaim (PRD hanya mengatur kode pinjam, BR-17).
6. Server ditulis TypeScript (tsx) atau JavaScript.
7. Strategi dua sistem berdampingan (draf: Lampiran A di docs/PANDUAN-EKSEKUSI.md): setuju atau ada perubahan.
Jangan mengubah PRD atau SYSTEM-DESIGN di sesi ini.
```

Setelah agent selesai: isi kolom "Keputusan" tiap butir, bicarakan butir 1 dan 7 dengan teman Anda (keduanya memengaruhi dia), commit, merge.

#### S04: terapkan keputusan dan hasil audit ke dokumen (B)

Branch: `feat/s04-dokumen-5-3`. Syarat: kolom keputusan di `KEPUTUSAN-0.4.md` terisi semua.

```text
SESI S04. Task: 0.4 (terapan). Dua commit terpisah, berhenti di antaranya.

TASK A: PRD revisi 5.3 dan SYSTEM-DESIGN sesuai docs/KEPUTUSAN-0.4.md (kolom Keputusan yang menang; kolom kosong = tanyakan, jangan diisi sendiri).
- Kategori barang, kondisi barang (turunan), tipe peminjam: BR, FR, kolom skema, migrasi, laporan, pemetaan data lama. Ubah roadmap PRD (kategori tidak lagi "Berikutnya").
- TANDAI_RUSAK di SYSTEM-DESIGN 2.3 dan skema (jenis buku besar), PRD aturan terkait, dan sinkronkan tes.
- Format kode klaim di PRD BR-17.
- Keputusan MySQL: ubah D-13 dan paragraf "Mengapa MySQL" sesuai keputusan (hapus kalimat "[Hapus butir alasan ...]" setelah alasan final). Bila keputusannya BUKAN MySQL, berhenti dan tanyakan sebelum menyentuh bagian 6, 6A, 11.
- Naikkan versi PRD ke 5.3, tambah baris riwayat revisi.

TASK B: koreksi dari hasil audit docs/AUDIT-0.2.md.
- Perbaiki README dan SYSTEM-DESIGN bagian 11 bila sumber data lama bukan SQLite (nama skrip 6.1, pemetaan).
- SYSTEM-DESIGN 6A.3: tambahkan hak untuk inventaris_it_dev dan inventaris_it_test, termasuk DROP/CREATE bagi migrator pada _test (tes membuat ulang basis data tiap suite).
- SYSTEM-DESIGN bagian 6: hapus CREATE DATABASE dan USE dari skema (migrasi jalan di _dev, _test, produksi).
- SYSTEM-DESIGN bagian 13: ganti dengan teks yang saya setujui (Lampiran A di PANDUAN-EKSEKUSI.md) bila saya menempelkannya; bila tidak, tanyakan.
- TODO.md: sesuaikan 6.1 (nama dan keterangan) bila sumber data berbeda, dan perbarui butir sesuai keputusan.
Jangan mengubah makna aturan di luar yang diputuskan. Laporkan setiap perubahan bagian dalam daftar rapi (bagian, sebelum, sesudah).
```

#### S05: MySQL di Laragon (R), **Anda** yang menjalankan

Branch: `feat/s05-mysql-setup`. Agent hanya menyiapkan bahan. Baca dulu `docs/PANDUAN-LARAGON.md`.

```text
SESI S05. Task: 0.5. Anda TIDAK menjalankan perintah berhak istimewa dan tidak pernah menerima kata sandi root. Anda menyiapkan bahan, saya yang menjalankan.

Hasil:
1. Baca docs/PANDUAN-LARAGON.md dan ikuti isinya (jangan menulis panduan baru). Buat docs/CHECKLIST-0.5.md yang hanya memuat SELISIH antara panduan itu dan SYSTEM-DESIGN 6A, plus langkah Windows yang belum tertutup: SELECT VERSION() (syarat MySQL >= 8.0.16 atau MariaDB >= 10.2.1), kata sandi root, my.ini (bind-address, charset, collation, default-time-zone sesuai 6A.4), SELECT @@sql_mode memuat STRICT_TRANS_TABLES.
2. db/setup/0.5-akun.sql dengan placeholder <kata sandi kuat> untuk akun app_inventaris, migrator, backup. Berikan blok serupa untuk inventaris_it_dev dan inventaris_it_test. migrator pada _test harus boleh DROP dan CREATE database. Jelaskan selisih dari 6A.3 bila ada.
3. db/setup/verifikasi.sql: kueri baca-saja (SHOW GRANTS tiap akun).
4. Cara memastikan MySQL hanya mendengarkan 127.0.0.1 (netstat -ano | findstr :3306) dan menguji dari PC lain bahwa 3306 tertutup (Test-NetConnection).
Selesai jika: saya bisa mengikuti dokumen dari nol dan semua pemeriksaan langkah 3 dan 4 lulus.
```

Pemeriksaan Anda sendiri (bukan agent): versi MySQL memenuhi syarat, `root` berkata sandi, dua basis data dan tiga akun ada, port 3306 tidak terjangkau dari PC lain.

### Phase 1

#### S11: akses data, runner migrasi, skema awal (B)

Branch: `feat/s11-akses-data`.

```text
SESI S11. Paket: 1.1, 1.2. Berhenti setelah tiap task. Jangan menyentuh server.js.

TASK 1.1: lapisan akses data MySQL di server/db/.
Bangun server/config.ts (baca dan validasi env, gagal cepat bila kurang), server/db/pool.ts (mysql2/promise sesuai SYSTEM-DESIGN 6A.4: charset utf8mb4, timezone 'Z', dateStrings true, multipleStatements false), server/db/tx.ts dengan helper tx(fn): START TRANSACTION, COMMIT, ROLLBACK saat galat, ulang otomatis maksimal 3 kali pada galat 1213 dan 1205. Semua async/await. Tidak ada SQL di luar server/db/.
Bahasa server mengikuti keputusan S03 (TypeScript dengan tsx, atau JavaScript). Pisahkan pembuatan aplikasi Express (server/app) dari app.listen (server/index) agar bisa dites dengan supertest. Port dev v5 sesuai bagian 13 SYSTEM-DESIGN (bukan 3001).
Tes (vitest): tx rollback penuh saat galat, retry berjalan pada galat deadlock tiruan, tidak lebih dari 3 kali.
Selesai jika: tidak ada import driver basis data di luar server/db/, dan tes tx hijau.

TASK 1.2: runner migrasi dan skema awal.
1. db/migrations/0001_init.sql: skema dari docs/SYSTEM-DESIGN.md bagian 6 APA ADANYA (CREATE DATABASE dan USE sudah dihapus di S04; bila masih ada, hapus dan laporkan sebagai selisih). Jangan "memperbaiki" bagian lain.
2. scripts/migrate: pakai akun migrator, koneksi KHUSUS dengan multipleStatements true (pool aplikasi tetap false). Tabel schema_migrations(versi, diterapkan_pada). Berkas berurutan, yang tercatat dilewati, hanya maju. Sebelum menjalankan migrasi, backup otomatis dengan mysqldump (jalur dari env, kredensial lewat berkas konfigurasi sementara, bukan argumen). DDL MySQL tidak bisa di-ROLLBACK: satu berkas satu perubahan kecil.
3. npm run db:migrate. Hanya jalan pada inventaris_it_dev atau inventaris_it_test. Tolak bila DB_NAME bukan keduanya kecuali ada flag eksplisit --produksi.
Selesai jika: migrasi dari basis data kosong berhasil di MySQL Laragon saya, dan dijalankan dua kali tidak mengulang apa pun. Tempel keluaran kedua jalannya.
```

#### S12: kerangka tes, pemeriksaan saat start (B)

Branch: `feat/s12-kerangka-tes`.

```text
SESI S12. Paket: 1.9, 1.3. Berhenti setelah tiap task.

TASK 1.9: kerangka tes.
Pasang vitest dan supertest. Basis data inventaris_it_test dibuat ulang (drop, create, migrasi) di awal tiap suite memakai akun migrator. Dua pengaman: tes menolak jalan bila DB_NAME dari env tidak berakhiran _test, DAN bila SELECT DATABASE() pada koneksi aktual tidak berakhiran _test. Berkas tes paralel yang memakai basis data sama akan saling merusak: atur fileParallelism false (atau satu basis data per worker). npm test menjalankan semuanya.
Tes contoh: satu tes sehat (hijau), satu tes yang membuktikan pengaman menolak DB_NAME=inventaris_it.
Selesai jika: tes contoh hijau dan saya bisa menunjukkan tes menolak jalan terhadap nama basis data produksi.

TASK 1.3 ⚙: pemeriksaan saat start (T-5.32). Tulis tes dulu, tunjukkan merah.
Server menolak menyala (keluar kode non-nol, pesan jelas) bila: versi di bawah batas, sql_mode tanpa STRICT_TRANS_TABLES, atau character_set_database bukan utf8mb4. Setelah lolos, jalankan kueri invarian SYSTEM-DESIGN 2.2 dan catat peringatan di log bila ada selisih (jangan menolak start untuk selisih invarian).
Hati-hati membandingkan versi: MySQL "8.0.x", MariaDB "10.11.x-MariaDB". Batas berbeda (8.0.16 vs 10.2.1). Deteksi jenis dari string versi dan uji pengurai dengan beberapa contoh string.
Tes: fungsi pemeriksa menerima nilai tiruan dan diuji untuk semua cabang.
Selesai jika: tes merah dulu lalu hijau, dan server benar-benar menolak menyala saat saya sengaja mengubah sql_mode di dev.
```

#### S13: utilitas inti, buku besar stok (B)

Branch: `feat/s13-utilitas-buku-besar`.

```text
SESI S13. Paket: 1.7, 1.8. Berhenti setelah tiap task.

TASK 1.7: utilitas inti di server/lib/.
1. Kode pinjam PJM-XXXXXX, 31 karakter (huruf kecuali I, L, O, plus angka 2-9), crypto.randomInt, huruf besar (BR-17). Format kode klaim sesuai keputusan di PRD 5.3 (bila belum ada, tanyakan).
2. Tanggal Asia/Jakarta: hariIni(), selisihHari(a, b), tambahHari(tgl, n) berbasis tanggal kalender YYYY-MM-DD memakai Intl dengan timeZone, bukan selisih milidetik. Uji tengah malam, pergantian bulan dan tahun. Catatan: todayStr() di klien memakai jam lokal mesin, bukan Asia/Jakarta.
3. Idempotensi (BR-20): kunci UUID (CHAR(36)). Kunci sama dan isi sama mengembalikan hasil lama. Kunci sama isi berbeda membalas 409. Skema tidak menyimpan hash isi: usulkan cara membandingkan paling sederhana dan tunggu persetujuan saya.
4. Validasi input dengan zod: skema bersama nama (2-100), telepon (8-15 digit), tanggal, jumlah.
Tes unit untuk semuanya. Selesai jika: tes hijau.

TASK 1.8: buku besar stok.
applyMovement(conn, { itemId, jenis, deltaTotal, deltaTersedia, deltaRusak, ref, userId, catatan }) di dalam transaksi pemanggil: pembaruan bersyarat items (tersedia dan rusak tidak boleh negatif, tersedia + rusak tidak boleh melebihi total) dan satu baris stock_movements. Periksa affectedRows. Jenis dan efek mengikuti tabel SYSTEM-DESIGN 2.3 (termasuk TANDAI_RUSAK bila diputuskan). TIDAK membuka transaksi sendiri.
cekInvarian(conn, itemId?) untuk BR-01 dan keselarasan buku besar (SYSTEM-DESIGN 2.2): dipinjam dan menunggu dihitung dari data peminjaman dan klaim, bukan kolom items.
Tes: tiap jenis menghasilkan delta benar, pelanggaran ditolak, invarian terdeteksi bila data sengaja dirusak di tes.
Selesai jika: tes hijau.
```

#### S14: seed, skrip admin, autentikasi server (**K**)

Branch: `feat/s14-autentikasi`. Satu-satunya sesi Phase 1 yang memakai model terkuat.

```text
SESI S14. Paket: 1.4, 1.5. Berhenti setelah tiap task. Tahap autentikasi: periksa baik-baik.

TASK 1.4: seed dan skrip admin (FR-A-02, FR-S-06, T-5.30).
1. Seed: tabel settings dari PRD bagian 8 (delapan parameter dan nilai rekomendasi). Divisi awal: TANYAKAN daftarnya kepada saya, jangan mengarang. Seed idempotent.
2. scripts/create-admin: meminta email, nama, kata sandi lewat prompt terminal dengan input tersembunyi. Kata sandi tidak boleh lewat argumen atau variabel lingkungan.
3. scripts/reset-password: ganti hash dan HAPUS semua sesi pengguna itu.
4. Hash: bcryptjs (argon2 native sering gagal dibangun di Windows). Cost 12. Usulkan kebijakan panjang kata sandi minimal dan tunggu persetujuan saya.
5. Tes ⚙ untuk reset: hash berubah, sesi lama hilang.
Selesai jika: tidak ada kata sandi di repo dan skrip berjalan di dev saya.

TASK 1.5 ⚙: autentikasi server-side (FR-A-01, BR-19, T-5.1, sebagian T-5.20). Tulis tes dulu, tunjukkan merah.
/api/auth/login, logout, me, change-password sesuai SYSTEM-DESIGN 8.2. Sesi di tabel sessions: simpan SHA-256 token (CHAR(64)), bukan token mentah. Cookie httpOnly, SameSite=Strict. JANGAN set Secure (HTTP di LAN); catat sebagai risiko yang diterima (PRD bagian 12). Idle 15 menit ditegakkan server dari parameter sesi_idle_menit, perbarui aktivitas_terakhir tiap permintaan sah. Middleware pada seluruh /api/admin/*: tanpa sesi 401. Rate limit login: 5 gagal per 15 menit per IP dan email. Pesan galat login selalu sama dan waktu respons tidak membedakan "email tidak ada" dari "kata sandi salah" (bandingkan dengan hash tiruan). CORS dibatasi ke origin aplikasi. Hapus sesi kedaluwarsa berkala (app_inventaris boleh DELETE pada sessions).
Tes: tanpa sesi 401, sesi idle berakhir (majukan waktu terkontrol), rate limit bekerja, token mentah tidak ada di tabel.
Selesai jika: tes hijau dan API admin tanpa sesi membalas 401.
```

#### S15: bersihkan kredensial, sambungkan login (B)

Branch: `feat/s15-login-ui`. Menyentuh kode teman Anda: perubahan sekecil mungkin.

```text
SESI S15. Task: 1.6. Hapus kredensial dan sambungkan login ke API (T-5.20).

Hapus akun dan kata sandi bawaan dari src/services/db.ts (SEED_USERS), LoginModal.tsx (nilai awal dan kotak petunjuk), README, dan src/services/tests.ts. Ubah src/services/auth.ts agar memanggil /api/auth/*, tanpa menyimpan pengguna atau sesi di localStorage, menangani 401, dan ada tombol logout. Ini mengubah berkas rekan: perubahan sekecil mungkin, jangan merapikan kode di sekitarnya.
tests.ts dan TestRunnerModal bergantung pada login lama. TANYAKAN saya: hapus penguji dalam aplikasi (digantikan vitest) atau perbarui. Jangan memutuskan sendiri.
Catatan keamanan untuk laporan: kata sandi lama tetap ada di riwayat Git, anggap sudah bocor. /api/state lama masih terbuka sampai peralihan; jangan diekspos ke internet.
Selesai jika: pencarian "password123" dan "admin@kantor.id" di repo dan di hasil npm run build kosong (tempel hasil pencarian).
```

### Phase 2

#### S21: katalog publik, kelola barang, stok, divisi (B)

Branch: `feat/s21-data-induk`.

```text
SESI S21. Paket: 2.1, 2.6. Berhenti setelah tiap task.

TASK 2.1: katalog dan divisi publik (FR-K-01).
GET /api/kiosk/items?q=&kategori= hanya id, nama, kategori, tersedia untuk barang belum dihapus (kategori sesuai PRD 5.3; bila belum ada, berhenti dan tanyakan). Total, rusak, data lain tidak boleh bocor. Pencarian berparameter dan karakter % dan _ di-escape. GET /api/kiosk/divisions: divisi aktif. Rate limit longgar.
Tes: bidang selain yang diizinkan tidak muncul, barang terhapus dan divisi nonaktif tidak muncul. Selesai jika: tes hijau.

TASK 2.6: kelola barang, stok, divisi (FR-A-03, FR-A-10, FR-A-16; BR-14, 15, 27; T-5.5). Semua rute di balik sesi admin.
/api/admin/items (GET, POST, PUT, DELETE soft-delete), /items/:id/stock-adjustments, /api/admin/divisions (GET, POST, PATCH; nonaktifkan, tidak menghapus). PUT barang TIDAK boleh mengubah total, tersedia, rusak langsung: perubahan jumlah hanya lewat stock-adjustments agar buku besar terisi (BR-15, alasan wajib, tersedia tidak negatif). Hapus ditolak bila ada unit Dipinjam, Menunggu, atau rusak > 0 (BR-14). Nama barang aktif unik (nama_aktif). Penanda boleh_diperpanjang ada di form. Kategori dan kondisi sesuai PRD 5.3.
FE: layar baru di src/v5/, jangan menulis ulang ItemsCrud.tsx.
Selesai jika: T-5.5 hijau dan setiap perubahan jumlah punya baris buku besar.
```

#### S22: buat peminjaman ⚙ (**K**)

Branch: `feat/s22-buat-peminjaman`. Berdiri sendiri (konkurensi stok).

```text
SESI S22. Task: 2.2 ⚙ (SYSTEM-DESIGN 7.1; BR-02, 17, 20, 22, 23; T-5.2, 5.21, 5.24). Tulis tes dulu, tunjukkan merah.

POST /api/kiosk/loans: langkah persis 7.1. Tipe peminjam wajib dan divalidasi (PRD 5.3). Barang diproses menurut id menaik. Pengurangan bersyarat dengan affectedRows. Tanggal divalidasi dengan tanggal Asia/Jakarta, parameter maks_booking_hari dan maks_durasi_awal_hari dari settings. Kode pinjam bentrok: ulang HANYA bila galat duplikat 1062 berasal dari indeks kode, bukan kunci idempotensi. Tiap barang menulis stock_movements PINJAM lewat applyMovement. Respons memuat kode pinjam dan data struk.
Tes wajib: dua permintaan paralel pada stok 1 (Promise.all, koneksi terpisah) tepat satu sukses; klik ganda dengan kunci sama satu peminjaman; tanggal lampau dan melebihi batas ditolak; divisi nonaktif ditolak; barang duplikat ditolak; BR-01 benar sesudahnya.
Selesai jika: T-5.2, T-5.21, T-5.24 hijau.
```

#### S23: form peminjaman dan struk (FE) (R)

Branch: `feat/s23-form-struk`.

```text
SESI S23. Paket: 2.3, 2.4. Berhenti setelah tiap task.

TASK 2.3: form peminjaman v5 (FR-K-02).
Jangan mengubah BorrowModal.tsx. Komponen baru di src/v5/, klien API di src/api/kioskClient.ts. Pilihan antarmuka lama atau v5 lewat satu flag (VITE_UI=v5) dengan perubahan sekecil mungkin di App.tsx (SYSTEM-DESIGN bagian 13). Tidak ada berkas desain terpisah: ikuti gaya komponen di src/components/kiosk (Tailwind, lucide-react, motion).
Isi: tipe peminjam, divisi (pilihan), filter kategori, tanggal pinjam (default hari ini, sampai maks_booking_hari), batas kembali (maks maks_durasi_awal_hari dari tanggal pinjam). Bila tanggal pinjam masa depan, tampilkan bahwa stok ditahan mulai sekarang. Kunci idempotensi dibuat sekali per pembukaan form (crypto.randomUUID) dan dipakai ulang saat kirim ulang; tombol kirim nonaktif selama proses. Galat 409 menyebut barangnya. Jangan simpan data peminjam di localStorage atau sessionStorage (FR-K-10).
Selesai jika: saya bisa membuat peminjaman dan pemesanan dari UI v5, dan mengecek stok berubah lewat kueri baca-saja.

TASK 2.4: struk cetak (FR-K-03).
Komponen struk di src/v5/ dengan @media print: kode pinjam huruf besar, nama, divisi, tanggal pinjam (penanda PEMESANAN bila masa depan), batas kembali, daftar barang, petunjuk singkat mengembalikan. Bukti tetap tampil di layar sebagai cadangan. Tanpa dependensi baru. Jangan mencetak telepon.
Selesai jika: pratinjau cetak menampilkan struk satu halaman dan tampilan layar utuh.
```

#### S24: pembatalan peminjam dan admin, sisi server ⚙ (B)

Branch: `feat/s24-pembatalan`.

```text
SESI S24. Paket: 2.5, 4.4 (sisi server saja). Berhenti setelah tiap task.

TASK 2.5 ⚙: batalkan pemesanan oleh peminjam (SYSTEM-DESIGN 7.7; BR-24; T-5.25). Tes dulu.
POST /api/kiosk/loans/cancel { kode }: hitung percobaan kode salah seperti lookup (BR-18). Hanya bila hari ini < tanggal_pinjam dan belum dibatalkan. Kunci baris loans, UPDATE bersyarat, tersedia dikembalikan per barang lewat applyMovement BATAL_PINJAM, dibatalkan_oleh NULL, audit_logs. Pembatalan kedua 409.
Sisi FE (tombol) ditunda ke butir 3.2a. Catat di TODO.md bila belum ada.
Tes: sebelum tanggal pinjam berhasil dan stok kembali; pada atau sesudah tanggal pinjam ditolak; dua pembatalan paralel satu sukses; BR-01 benar.
Selesai jika: T-5.25 hijau.

TASK 4.4 ⚙: batalkan peminjaman oleh admin (SYSTEM-DESIGN 7.7; BR-25; T-5.27). Tes dulu.
POST /api/admin/loans/:id/cancel { alasan }: ditolak bila ada baris return_claims APA PUN pada peminjaman itu (termasuk yang sudah diverifikasi), alasan wajib, dibatalkan_oleh = id admin, stok kembali lewat applyMovement BATAL_PINJAM, audit_logs. Ganda 409. Pakai ulang fungsi pembatalan dari 2.5. Sisi FE ditunda ke 5.2a.
Selesai jika: T-5.27 hijau.
```

### Phase 3

#### S31: cek peminjaman dan status turunan ⚙ (**K**)

Branch: `feat/s31-cek-peminjaman`. Berdiri sendiri.

```text
SESI S31. Task: 3.1 ⚙ (SYSTEM-DESIGN bagian 3; BR-10, 18; T-5.4, 5.6, 5.16). Tes dulu, tunjukkan merah.

1. deriveStatus() fungsi murni: masukan O (belum diklaim), P (menunggu), status batal, tanggal pinjam, batas kembali, hari ini; keluaran status utama dan lencana. Tes tabel mencakup setiap cabang diagram bagian 3 dan hari terlambat (BR-10, termasuk O=0 dan P>0 yang tidak bertambah).
2. POST /api/kiosk/loans/lookup { kode }: kartu per barang (dipinjam, menunggu, terverifikasi, sisa), batas kembali, sisa hari atau hari terlambat, kuota perpanjangan, riwayat klaim. Hasil verifikasi dan catatan admin hanya untuk klaim yang sudah diverifikasi. Telepon tidak pernah tampil. Kode tidak ditemukan: pesan umum dan dihitung percobaan gagal; setelah kiosk_lookup_maks_gagal, kunci selama kiosk_lookup_kunci_menit (dari settings). Kode dinormalkan ke huruf besar.
Selesai jika: T-5.4, T-5.6, T-5.16 hijau.
```

#### S32: klaim pengembalian parsial ⚙ (**K**)

Branch: `feat/s32-klaim`. Berdiri sendiri.

```text
SESI S32. Task: 3.3 ⚙ (SYSTEM-DESIGN 7.2; BR-03, 04, 10, 20; T-5.7, 5.8, 5.9, 5.11, 5.12, 5.26). Tes dulu, tunjukkan merah.

POST /api/kiosk/return-claims. Langkah pertama setelah idempotensi: SELECT ... FOR UPDATE pada baris loans, baru hitung sisa. Tolak pemesanan belum dimulai dan peminjaman dibatalkan. Jumlah per barang <= sisa, termasuk unit yang sedang menunggu verifikasi. Gabungkan baris sama (barang dan kondisi) sebelum menyimpan (UNIQUE claim_id, loan_item_id, kondisi_dilaporkan). hari_terlambat dibekukan saat klaim. TIDAK ada penulisan ke items maupun stock_movements (BR-03). Catatan <= 500 karakter.
Tes: pinjam 3 klaim 2 sisa 1; dua klaim berturut-turut melebihi sisa ditolak; kondisi campuran; klik ganda; dua klaim paralel yang masing-masing mengklaim seluruh sisa menghasilkan satu sukses; stok tidak berubah setelah klaim.
Selesai jika: tes di atas hijau.
```

#### S33: Cek Peminjaman, form klaim, tombol batal (FE) (R)

Branch: `feat/s33-fe-kiosk-klaim`. Syarat: S32 digabung.

```text
SESI S33. Paket: 3.2, 3.4, 3.2a. Komponen baru di src/v5/. Berhenti setelah tiap task.

TASK 3.2: halaman Cek Peminjaman (FR-K-04, FR-K-07 bagian tampilan).
Kartu per barang (dipinjam, menunggu, terverifikasi, sisa); penghitung mundur ("Sisa 3 hari", "Terlambat 2 hari"); kuota perpanjangan; riwayat klaim berstatus. Untuk pemesanan tampilkan "Dipesan, mulai [tanggal]" tanpa tombol Kembalikan dan Perpanjang. Tombol tidak aktif disertai alasan jelas dalam bahasa Indonesia yang tidak menyalahkan. Tangani tampilan terkunci setelah terlalu banyak percobaan. Jangan simpan kode di penyimpanan browser.
Selesai jika: semua status (Dipesan, Dipinjam, Terlambat, Menunggu Verifikasi, Selesai, Dibatalkan) tampil benar untuk data uji.

TASK 3.4: form klaim dan bukti klaim (FR-K-05, FR-K-06).
Per barang: jumlah Baik, Rusak, Hilang, total <= sisa (cegah di klien; server penentu). Satu catatan per klaim (500 karakter, penghitung). Tombol nonaktif bila sisa 0. Kunci idempotensi per pembukaan form. Bukti klaim: kode klaim, isi, status Menunggu Verifikasi, pengingat menyerahkan barang fisik ke petugas IT; dapat dicetak (seperti 2.4).
Selesai jika: saya bisa membuat klaim parsial dari UI dan melihat bukti cetak.

TASK 3.2a: tombol Batalkan pemesanan (FE dari 2.5).
Pada kartu peminjaman berstatus Dipesan, tombol Batalkan pemesanan dengan konfirmasi, memanggil API S24. Tampilkan hasil dan stok yang kembali.
Selesai jika: pemesanan bisa dibatalkan dari UI sebelum tanggal pinjam, dan tombol hilang pada atau sesudah tanggal pinjam.
```

#### S34: antrean dan verifikasi ⚙ (**K**)

Branch: `feat/s34-verifikasi`. Berdiri sendiri.

```text
SESI S34. Task: 3.5 ⚙ (SYSTEM-DESIGN 7.3; BR-05 sampai 08; T-5.3, 5.14). Tes dulu, tunjukkan merah. Rute di balik sesi admin.

GET /api/admin/return-claims?status=menunggu (terlama dulu), GET /:id, POST /:id/verify { lines[], catatanAdmin }. Urutan kunci: baris klaim, lalu baris items terkait menurut id menaik. Tiap baris: baik+rusak+hilang+ditolak = qty, semua >= 0. Catatan admin wajib bila ada hasil berbeda dari laporan atau ada unit ditolak (BR-06). Efek stok lewat applyMovement (VERIFIKASI_BAIK, _RUSAK, _HILANG); unit ditolak tidak menulis buku besar. Setelah selesai periksa BR-01 untuk barang terkait dan batalkan seluruh transaksi bila gagal. Klaim sudah diverifikasi 409. Isi keempat kolom qty_* pada semua baris. Tulis audit_logs.
Tes: ketiga hasil menghasilkan delta benar; verifikasi ulang 409; dua verifikasi paralel satu 409; hasil berbeda tanpa catatan ditolak; ditolak mengembalikan unit ke Dipinjam dan memulihkan hitungan terlambat (BR-10).
Selesai jika: T-5.3 dan T-5.14 hijau.
```

#### S35: antrean verifikasi dan hasil klaim (FE) (R)

Branch: `feat/s35-fe-verifikasi`.

```text
SESI S35. Paket: 3.6, 3.8. Komponen baru di src/v5/. Berhenti setelah tiap task.

TASK 3.6: antrean verifikasi (FR-A-04, FR-A-15).
Daftar klaim terlama di atas, lencana jumlah antrean di menu, detail dengan catatan peminjam disorot, pembagian jumlah per baris ke Baik, Rusak, Hilang, Ditolak, aksi cepat "Setujui sesuai laporan" (mengisi hasil sama dengan laporan; server tetap memvalidasi). Form menyatakan bahwa catatan admin terlihat peminjam. Tangani 409 dengan memuat ulang klaim.
Selesai jika: saya bisa memverifikasi klaim dengan dan tanpa perbedaan dari UI.

TASK 3.8: hasil klaim terlihat peminjam (FR-K-09).
Pada kartu peminjaman tampilkan, untuk klaim terverifikasi, hasil per baris dan catatan admin. Pastikan respons lookup tidak memuat catatan admin untuk klaim yang masih menunggu.
Selesai jika: tampilan benar untuk klaim menunggu dan terverifikasi.
```

#### S36: stok rusak ⚙ (B)

Branch: `feat/s36-stok-rusak`.

```text
SESI S36. Task: 3.7 ⚙ (SYSTEM-DESIGN 7.5; BR-09; T-5.15). Tes dulu.

GET /api/admin/repairs (rusak > 0), POST /items/:id/repair-complete, POST /items/:id/write-off (alasan wajib). Kunci baris items sebelum memeriksa n <= rusak. Lewat applyMovement (PERBAIKAN_SELESAI, AFKIR). Bila S04 menambah TANDAI_RUSAK, sertakan aksi "tandai rusak" (tersedia -n, rusak +n, alasan wajib) di task ini.
FE di src/v5/: daftar, aksi, jumlah dan catatan.
Selesai jika: T-5.15 hijau (rusak tidak menambah tersedia, perbaikan memindahkan, afkir mengurangi total).
```

#### S37: tes invarian acak ⚙ (B)

Branch: `feat/s37-invarian-acak`.

```text
SESI S37. Task: 3.9 ⚙ (T-5.10).

Pembangkit rangkaian operasi acak berbenih (seed dicatat di log agar kegagalan bisa diulang): pinjam, pesan, batal, klaim, verifikasi (hasil acak), perbaikan, afkir, termasuk lonjakan permintaan paralel. Setelah SETIAP operasi periksa cekInvarian (BR-01 dan keselarasan buku besar). Jalankan beberapa seed tetap di npm test (di bawah satu menit) dan sediakan perintah terpisah untuk seed acak panjang.
Selesai jika: lolos minimal 10 seed. Bila gagal, laporkan seed dan rangkaian pemicunya; jangan melonggarkan pemeriksaan.
```

### Phase 4

#### S41: perpanjangan peminjam dan admin ⚙ (**K**)

Branch: `feat/s41-perpanjangan`.

```text
SESI S41. Paket: 4.1, 4.2, 4.3. Berhenti setelah tiap task.

TASK 4.1 ⚙: perpanjangan oleh peminjam (SYSTEM-DESIGN 7.4; BR-11, 12, 26; D-12; T-5.17, 5.18, 5.28). Tes dulu, tunjukkan merah.
POST /api/kiosk/extensions { kode, tambahanHari, alasan }. Kunci baris loans lebih dulu. Semua syarat BR-11 (a sampai f). Batas baru = batas kembali saat ini + tambahan hari, tanggal kalender Asia/Jakarta. Galat barang tidak boleh diperpanjang menyebut nama barangnya. Pemesanan ditolak (BR-26). Tulis loan_extensions dan audit_logs.
Tes: batas baru benar; ditolak bila terlambat, kuota habis, n di luar batas, tak ada sisa, pemesanan, barang bertanda tidak boleh; dua perpanjangan paralel pada kuota tersisa 1 menghasilkan satu sukses.
Selesai jika: T-5.17, 5.18, 5.28 hijau.

TASK 4.2: antarmuka perpanjangan (FR-K-07, FR-K-08), komponen baru di src/v5/.
Pilihan tambahan hari 1 sampai batas, alasan opsional, batas lama dan baru ditampilkan SEBELUM konfirmasi, bukti perpanjangan yang dapat dicetak. Tombol tidak aktif disertai alasan jelas (mis. "Sudah terlambat, hubungi petugas IT"). Server tetap penentu.
Selesai jika: perpanjangan sah dan tiap kasus penolakan tampil dengan pesan tepat.

TASK 4.3 ⚙: perpanjangan oleh admin, sisi server (BR-13; T-5.19). Tes dulu.
POST /api/admin/loans/:id/extensions: tanpa batas kuota, boleh untuk peminjaman terlambat dan barang bertanda tidak boleh diperpanjang, alasan WAJIB, diajukan_oleh = 'admin' dan user_id terisi. Pemesanan tetap ditolak (BR-26). Sisi FE ke butir 5.2a.
Selesai jika: T-5.19 hijau.
```

#### S42: koreksi peminjaman (B)

Branch: `feat/s42-koreksi`.

```text
SESI S42. Task: 4.5, sisi server (BR-16; FR-A-07; SYSTEM-DESIGN 7.6).

PATCH /api/admin/loans/:id: nama, divisi, telepon, batas kembali, tanggal pinjam, jumlah item. Alasan wajib. Setiap perubahan field menulis satu baris loan_corrections (nilai lama dan baru). Jumlah item hanya bisa dikoreksi bila barang itu belum punya baris klaim; selisih Δ > 0 butuh tersedia >= Δ; efek stok lewat applyMovement KOREKSI_PINJAM. Kunci baris loans dan items (urut id).
Hal yang tidak diatur dokumen, TANYAKAN dulu: apakah divisi hasil koreksi harus divisi aktif, dan bagaimana bila tanggal pinjam dikoreksi ke masa depan padahal sudah ada klaim.
Sisi FE ke butir 5.2a.
Tes: tiap field; penolakan tanpa alasan; penolakan koreksi jumlah setelah klaim; efek stok dan buku besar benar; BR-01 tetap benar.
Selesai jika: tes hijau.
```

### Phase 5

#### S51: daftar, filter, detail, lini masa (B)

Branch: `feat/s51-daftar-detail`.

```text
SESI S51. Paket: 5.1, 5.2. Berhenti setelah tiap task.

TASK 5.1: daftar peminjaman dan filter (FR-A-05).
GET /api/admin/loans dengan filter status (termasuk Dipesan dan Dibatalkan), barang, kategori, divisi, tipe peminjam, dari, sampai, q, adaCatatan, adaKerusakan, belumKembali, page, pageSize (maksimum 100). Status adalah turunan: filter dan paginasi butuh ekspresi SQL yang setara deriveStatus(). Tulis ekspresi itu dan satu tes paritas: pada data acak hasil SQL sama dengan deriveStatus() untuk setiap peminjaman. Semua kueri berparameter. Tampilkan lencana (Sebagian, Ada klaim menunggu, Diperpanjang n×, Ada catatan).
FE di src/v5/: ringkasan, filter, tombol cepat Belum Dikembalikan.
Selesai jika: tes paritas hijau dan filter bekerja untuk setiap status.

TASK 5.2: detail dan lini masa (FR-A-06; T-5.13).
GET /api/admin/loans/:id: peminjaman, barang, lini masa kronologis dari pembuatan, perpanjangan, klaim (catatan peminjam), verifikasi (catatan admin), koreksi, pembatalan. Telepon boleh tampil (hanya admin). Catatan peminjam disorot, penanda Ada catatan berfungsi.
Selesai jika: T-5.13 terpenuhi.
```

#### S52: tombol aksi admin di halaman detail (FE) (R)

Branch: `feat/s52-aksi-detail`. Syarat: S41, S42, S24, S51 digabung.

```text
SESI S52. Task: 5.2a. Sisi FE untuk 4.3, 4.4, 4.5 di halaman detail dari 5.2. Komponen baru di src/v5/.

Tombol Perpanjang (alasan wajib), Batalkan peminjaman (alasan wajib; nonaktif beralasan bila sudah ada klaim), Koreksi (alasan wajib; field yang boleh diubah mengikuti aturan 4.5). Semua memanggil API yang sudah ada, tangani 401 dan 409 dengan pesan jelas. Jangan menambah logika bisnis di klien.
Selesai jika: ketiga aksi bisa dijalankan dari halaman detail dan tampil di lini masa.
```

#### S53: dasbor, pengaturan, jejak audit (R)

Branch: `feat/s53-admin-kecil`.

```text
SESI S53. Paket: 5.3, 5.5, 5.6. Berhenti setelah tiap task.

TASK 5.3: dasbor dan polling (FR-A-15).
GET /api/admin/summary: jumlah Dipinjam, Terlambat, Menunggu Verifikasi, Selesai, Dipesan, panjang antrean. FE memanggil tiap 30 detik, berhenti saat tab tersembunyi, dan berhenti serta mengalihkan ke login pada 401. Tanpa WebSocket.
Selesai jika: lencana antrean berubah tanpa memuat ulang halaman.

TASK 5.5: pengaturan parameter (FR-A-12).
GET/PUT /api/admin/settings untuk delapan parameter PRD bagian 8. Validasi tipe dan rentang (usulkan rentang, tunggu persetujuan saya). Nilai dibaca server tiap permintaan atau lewat cache pendek yang dibatalkan saat PUT. Perubahan masuk audit_logs dengan nilai lama dan baru. FE di src/v5/.
Tes: nilai tidak valid ditolak, perubahan sesi_idle_menit berlaku pada permintaan berikutnya.
Selesai jika: tes hijau.

TASK 5.6: penampil jejak audit (FR-A-13). Hanya baca.
GET /api/admin/audit-logs dengan paginasi dan filter entitas, pengguna, rentang tanggal. Periksa semua penulisan audit_logs di kode v5: detail tidak boleh memuat kata sandi, hash, atau token. Laporkan. FE hanya membaca; tanpa aksi ubah atau hapus.
Selesai jika: audit task sebelumnya tampil dan pemeriksaan kebocoran rahasia tercatat.
```

#### S54: laporan PDF dan CSV (B)

Branch: `feat/s54-laporan`.

```text
SESI S54. Paket: 5.4, 5.9. Berhenti setelah tiap task.

TASK 5.4: laporan PDF (FR-A-11). GET /api/admin/reports/:jenis.pdf, jenis rekap, belum-kembali, stok, pengembalian.
Usulkan dulu di rencana: src/services/pdf.ts yang ada membuat PDF di klien dengan jspdf, sedangkan SYSTEM-DESIGN menetapkan rute server. Usulkan pustaka server murni JavaScript (hindari kompilasi di Windows) dan pakai ulang tata letak pdf.ts bila wajar. Isi: judul, periode, waktu cetak (Asia/Jakarta). Belum-kembali memuat batas kembali, sisa, dan pemesanan belum dimulai. Pengembalian memuat catatan peminjam dan admin. Rekap mengikuti filter 5.1 dan menampilkan tipe peminjam. Stok dikelompokkan per kategori.
Tes: respons PDF valid (awalan %PDF), butuh sesi admin, parameter tidak valid ditolak.
Selesai jika: keempat laporan terbuka dan angkanya cocok dengan data uji.

TASK 5.9 (opsional): ekspor CSV untuk laporan 1 sampai 4 (FR-A-14).
UTF-8 dengan BOM agar benar di Excel. Lindungi injeksi rumus: sel berawalan =, +, -, atau @ diberi awalan tanda petik. Tanpa pustaka baru. Tes karakter khusus, koma, baris baru dalam sel.
Selesai jika: file terbuka di Excel dengan huruf dan kolom benar.
```

#### S55: akun admin (**K**)

Branch: `feat/s55-akun-admin`. Berdiri sendiri (autentikasi).

```text
SESI S55. Task: 5.7 (FR-A-02).

Ganti kata sandi sendiri (wajib kata sandi lama), tambah admin baru, nonaktifkan admin lain. Aturan: tidak boleh menonaktifkan diri sendiri; harus selalu ada minimal satu admin aktif; penonaktifan menghapus semua sesi akun itu. Tidak ada registrasi publik. Semua aksi masuk audit_logs. Kata sandi mengikuti kebijakan dari S14.
Tes untuk setiap aturan. Selesai jika: tes hijau.
```

#### S56: perilaku kiosk (R)

Branch: `feat/s56-perilaku-kiosk`.

```text
SESI S56. Task: 5.8 (FR-K-10, FR-K-11).

Reset otomatis setelah kiosk_idle_detik tanpa interaksi: hitung mundur terlihat, lalu kembali ke beranda dan hapus semua isian. Nilai idle dari server; usulkan endpoint publik minimal (mis. GET /api/kiosk/config yang hanya memuat parameter non-rahasia) karena SYSTEM-DESIGN 8.1 belum punya, dan tunggu persetujuan saya sebelum menambahkan. Target sentuh minimal 44x44 px, teks utama terbaca dari jarak lengan, seluruh alur bisa dengan keyboard. Pastikan tidak ada data peminjam di localStorage atau sessionStorage (cek juga di alat pengembang).
Selesai jika: reset berjalan dari setiap layar kiosk dan penyimpanan browser kosong dari data peminjam.
```

### Phase 6

#### S61: skrip migrasi data lama ⚙ (**K**)

Branch: `feat/s61-migrasi-data`. Syarat: CSV divisi (S02) sudah Anda setujui. Berdiri sendiri.

```text
SESI S61. Task: 6.1 ⚙ (SYSTEM-DESIGN bagian 11; T-5.22). Tulis fixture dan tes dulu.

Sumber data adalah yang tertulis di docs/AUDIT-0.2.md. Skrip scripts/migrate-legacy-to-mysql: sumber HANYA dibaca; mode --dry-run hanya menghasilkan laporan; penulisan ke MySQL dalam satu transaksi per tahap (barang, divisi, peminjaman, klaim, buku besar). Ikuti pemetaan bagian 11 dan hasil audit, ditambah pemetaan category, condition, borrower_type, notes sesuai PRD 5.3. Divisi dipetakan lewat docs/divisi-pemetaan.csv yang sudah saya setujui. Kode pinjam baru dibangkitkan. Peminjaman lama yang sudah dikembalikan menjadi satu klaim diverifikasi; tanggal klaim dan verifikasi dari returned_date (tanyakan jam yang dipakai bila perlu). Buku besar awal TAMBAH_STOK menyamakan nilai sekarang.
Laporan akhir: jumlah baris per tabel sebelum dan sesudah, jumlah dan status peminjaman, total stok, daftar data yatim atau janggal (jumlah negatif, barang hilang, divisi ejaan ganda), hasil cekInvarian semua barang. Dijalankan hanya ke inventaris_it_trial sampai bersih.
Tes pada fixture yang memuat data janggal.
Selesai jika: T-5.22 terpenuhi pada basis data percobaan.
```

#### S62: bahan hitung fisik (B), **Anda** yang menghitung

Branch: `feat/s62-hitung-fisik`. Syarat: S61 lulus di basis data percobaan.

```text
SESI S62. Task: 6.3, bahan saja. Aturan lama memasukkan barang rusak ke tersedia.

Buat lembar hitung (CSV atau HTML siap cetak) per barang: nama, tersedia menurut sistem, kolom kosong untuk hitungan fisik baik dan rusak, ditambah daftar periksa untuk barang berkondisi perlu_perbaikan dari data lama. Buat skrip pengisian hasil yang memakai fungsi aplikasi (bukan UPDATE SQL manual) agar buku besar tercatat. Periksa dulu apakah operasi "tandai tersedia menjadi rusak" ada (S04, S36). Bila belum, berhenti dan laporkan: skrip tidak boleh menembak tabel items langsung.
Selesai jika: stok sistem cocok dengan hitungan fisik dan setiap selisih punya baris buku besar.
```

#### S63: backup terjadwal, hardening MySQL (B), tangan Anda terlibat

Branch: `feat/s63-backup-hardening`.

```text
SESI S63. Paket: 6.4, 6.5. Berhenti setelah tiap task. Anda tidak mengubah konfigurasi sistem, firewall, atau Task Scheduler sendiri.

TASK 6.4: backup terjadwal dan uji pulih (FR-S-04; SYSTEM-DESIGN 6A.7; T-5.23).
1. scripts/backup.ps1 berdasarkan 6A.7: mysqldump --single-transaction dengan --defaults-extra-file DI LUAR repo dan hak aksesnya dibatasi (sertakan perintah icacls). Nama berkas bertanda waktu, retensi 14 salinan terakhir, salinan kedua ke lokasi lewat parameter. 6A.7 memakai --routines; skema ini tidak punya stored routine dan akun backup hanya berhak per skema: uji apakah opsi itu membuat dump gagal, dan bila gagal hapus opsinya dan laporkan.
2. Instruksi mendaftarkan tugas di Task Scheduler (di luar jam kerja). Jangan mendaftarkannya sendiri.
3. scripts/check-invariants yang menjalankan cekInvarian pada basis data yang ditunjuk.
4. Prosedur pulih ke inventaris_it_restore lalu check-invariants di sana. Saya yang menjalankannya.
Selesai jika: backup dibuat saat server hidup, pulih ke basis data terpisah, pemeriksaan invarian lolos.

TASK 6.5: hardening MySQL (T-5.31).
1. Tes otomatis: app_inventaris tidak bisa DROP atau ALTER dan tidak bisa DELETE selain pada sessions; backup tidak bisa menulis.
2. Daftar periksa manual Windows: kata sandi root terisi, bind-address=127.0.0.1, firewall tidak membuka 3306, dan menguji dari PC lain (Test-NetConnection <IP> -Port 3306 harus gagal).
Tulis ke docs/HARDENING-6.5.md yang saya isi hasilnya.
Selesai jika: tes hijau dan semua butir manual tercentang oleh saya.
```

#### S64: satu port dan layanan otomatis (B), Anda yang menguji

Branch: `feat/s64-layanan`.

```text
SESI S64. Task: 6.6 (FR-S-05).

Express menyajikan hasil npm run build (berkas statis dan fallback SPA yang tidak menangkap /api). NODE_ENV=production menonaktifkan alat pengembangan. Aplikasi mengulang koneksi ke MySQL saat start (batas waktu dan log jelas), karena setelah PC hidup MySQL bisa menyala belakangan.
Usulkan dua cara menyalakan otomatis di Windows beserta kelebihan dan kekurangannya (mis. NSSM sebagai layanan, atau Task Scheduler "saat startup"), dan cara yang sama untuk MySQL (opsi Laragon atau MySQL Server resmi sebagai layanan). Tulis ke docs/SETUP-SERVER.md. Jangan memasang apa pun sendiri.
Selesai jika: setelah RESTART PC sungguhan sistem berfungsi tanpa ada yang membuka terminal atau jendela Laragon. Saya yang menguji.
```

#### S65: UAT, runbook, bahan go-live (R)

Branch: `feat/s65-dokumen-operasional`. Dokumen saja.

```text
SESI S65. Paket: 6.7, 6.8, 6.9. Berhenti setelah tiap task. Tidak menjalankan apa pun pada basis data produksi.

TASK 6.7: docs/UAT.md dari SOP PRD 9.4 dan metrik PRD bagian 3: skenario langkah demi langkah untuk petugas IT dan karyawan (pinjam, pesan, batalkan, klaim parsial, verifikasi, perpanjang, kode hilang, barang rusak), kolom hasil dan catatan, daftar kekurangan. Jangan mengisi hasilnya.
TASK 6.8: docs/RUNBOOK.md dari dokumen yang ada, tanpa mengarang: menyalakan dan mematikan, backup dan pulih, reset kata sandi, mengubah parameter, membaca log, tindakan bila invarian melanggar, siapa dihubungi (placeholder, saya yang isi).
TASK 6.9: daftar periksa go-live (prasyarat 6.1 sampai 6.8), skrip pemantauan baca-saja (umur klaim tertua di antrean, hasil cekInvarian, umur backup terakhir, jumlah peminjaman terlambat), kueri metrik PRD bagian 3 untuk tinjauan sebulan, rencana mundur bila migrasi final gagal (SYSTEM-DESIGN 11 langkah 6).
```

### Phase 7: backlog (satu butir per sesi)

```text
SESI S7x. Task: <tempel satu butir backlog dari TODO.md>.

Sebelum merencanakan: periksa apakah butir ini butuh perubahan PRD (BR baru) atau skema (migrasi 000N baru). Bila ya, tulis usulan perubahan dokumen dan tunggu persetujuan, baru kodekan. Satu butir satu pull request, tes baru ikut, BR-01 tetap lolos.
```

---

## F. Gerbang phase dan pull request ke `main`

**PR pertama hanya berisi dokumen.** Setelah S04 selesai dan digabung ke `v5` (isinya `docs/`, `AGENTS.md`, `TODO.md`, README, serta berkas audit dan keputusan), buka PR `v5` → `main` **sebelum** menulis kode apa pun. PR ini sekaligus menjadi persetujuan draf oleh teman Anda: dokumen berstatus draf sampai kedua pengembang setuju, dan kode baru baru boleh dibangun di atas aturan yang sudah disepakati. Bila ia meminta perubahan, perbaiki lewat sesi dokumen kecil (prompt bebas, tetap memakai PEMBUKA), lalu lanjut ke S05.

Sesudah itu, tiap akhir phase **Anda** (bukan agent) memeriksa gerbang di bawah. Bila lulus, buka PR `v5` → `main`. Selama flag `VITE_UI` bawaannya tetap sistem lama, PR per phase aman digabung karena v5 hidup di folder baru dan tidak mengubah perilaku sistem teman Anda.

| Phase | Gerbang (semua harus benar) |
|---|---|
| 0 | Audit selesai dan sumber data lama pasti. Keputusan 0.4 tertulis dan PRD 5.3 ada. `SELECT VERSION()` memenuhi syarat. Baseline T-5.1 sampai T-5.6 tercatat. Tag `prototipe-v4` dan backup terverifikasi |
| 1 | `npm test` hijau. Tes menolak jalan di basis data non-`_test`. API admin tanpa sesi membalas 401. Tidak ada kata sandi di repo dan build |
| 2 | T-5.2, 5.5, 5.21, 5.24, 5.25, 5.27 hijau. Dua peminjaman paralel pada stok 1: satu berhasil |
| 3 | T-5.3, 5.7 sampai 5.12, 5.14 sampai 5.16, 5.26 hijau. Tes invarian acak hijau pada minimal 10 seed |
| 4 | T-5.17 sampai 5.19, 5.28 hijau |
| 5 | Demo menyeluruh dari UI v5: pinjam, klaim, verifikasi, perpanjang, laporan PDF |
| 6 | Latihan migrasi bersih di `inventaris_it_trial`. Pemulihan backup teruji. Restart PC sungguhan lulus. UAT selesai |

**Isi PR** (tulis sendiri): ringkasan phase, daftar sesi yang masuk, hasil `npm test`, dan bagian "Perlu perhatian reviewer" untuk kode teman Anda yang tersentuh (S15, S23 pada `App.tsx`). Tandai sebagai *Draft* bila ia belum diminta meninjau.

**Sinkron berkala.** Teman Anda terus commit ke `main`. Makin lama `v5` tertinggal, makin besar konflik. Lakukan G.1 langkah 1 sebelum **setiap** sesi, dan merge `origin/main` ke `v5` minimal seminggu sekali.

---

## G. Ritual tiap sesi dan penanganan masalah

### G.1 Awal sesi

```bash
git switch v5
git fetch origin
git merge origin/main                    # bawa pekerjaan terbaru teman Anda ke v5; selesaikan konflik di sini, bukan di branch sesi
git status                               # harus bersih
git switch -c feat/s22-buat-peminjaman   # nama dari bagian E
```

Lalu buka percakapan baru di Antigravity, tempel PEMBUKA, tempel prompt sesi.

### G.2 Selama dan setelah sesi

Setelah **tiap task** (agent berhenti dan menunggu "lanjut"):

```bash
git status                               # pastikan tidak ada .env, dump .sql, atau file di luar rencana
git diff                                 # baca perubahannya
npm test                                 # jalankan sendiri; jangan hanya percaya laporan agent
git add server db                        # sebut folder/berkas; hindari "git add -A" bila belum yakin
git commit -m "feat(2.2): buat peminjaman"   # pesan dari laporan agent, diawali ID task
```

Baru jawab "lanjut" ke agent. Setelah **seluruh sesi** selesai:

```bash
git switch v5
git merge --no-ff feat/s22-buat-peminjaman
git push origin v5                       # hanya ke v5, tidak pernah ke main
```

Penggabungan ke `main` hanya lewat tombol Pull Request di GitHub (bagian F). Bila Antigravity menawarkan menjalankan perintah git, **tolak** dan tulis sendiri perintahnya.

### G.3 Bila ada masalah

| Situasi | Tindakan |
|---|---|
| `git push` ditolak (403) | Akun Anda belum collaborator. Minta ditambahkan, atau fork dan PR dari fork (B.2) |
| Konflik saat `git merge origin/main` | Selesaikan di `v5`. Konflik di kode teman Anda: tanyakan padanya, jangan memilih satu sisi. Bila ragu: `git merge --abort` lalu bicarakan |
| Agent melenceng (daftar C.2) | Hentikan. Tulis: "Berhenti. Batalkan perubahan di luar rencana. Jelaskan apa yang sudah berubah." Periksa `git diff`. Perubahan yang tidak diinginkan di branch sesi dibuang dengan `git restore <berkas>` (Anda yang menjalankan) |
| Tes agent hijau tetapi tes Anda merah | Percayai tes Anda. Tempel keluaran merah ke agent dan minta penyebab |
| Percakapan terlalu panjang, agent mulai lupa aturan | Simpan hasil (commit task yang sudah selesai), mulai percakapan baru dengan PEMBUKA dan sisa task. Agent membaca status dari kode dan `git log` |
| Sesi terputus karena kuota | Commit apa yang sudah benar, `git status` untuk melihat sisanya, lanjutkan di percakapan baru dengan `SESI Sxx, lanjutkan dari task [ID]` |
| Task ternyata sudah ada (status A atau C) | Lihat A.4. Untuk C, putuskan tegas atau tunda ke teman Anda |
| Agent meminta kata sandi | Tolak. Isi `.env` sendiri di luar percakapan |
| Salah commit ke `main` | Jangan push. `git switch -c v5-cadangan` lalu minta bantuan sebelum menyentuh riwayat |

---

## Lampiran A: draf `SYSTEM-DESIGN.md` bagian 13 (untuk disetujui teman Anda)

Bagian ini dirujuk `AGENTS.md`, README, dan sesi S04, tetapi belum ada di repo. Status **DRAF** sampai kedua pengembang setuju.

> ## 13. Peralihan dari prototipe: dua sistem berdampingan
>
> **Prinsip.** Sistem lama (`server.js`, `src/components/*`, `src/services/*`) tetap berjalan dan tidak diubah sampai peralihan di Phase 6. Sistem v5 dibangun berdampingan, tanpa menulis ke basis data lama dan tanpa penulisan ganda.
>
> **Letak kode.** v5: `server/` (API dan akses data), `db/migrations/`, `scripts/`, `src/v5/` (layar), `src/api/` (klien API). Lama: tidak disentuh, kecuali perubahan kecil yang disebut task (mis. S15 untuk login).
>
> **Port.** Dev: server lama 3001 (`/api/state`), server v5 3002. Proxy Vite memakai aturan spesifik: `/api/kiosk`, `/api/admin`, `/api/auth` menuju 3002, `/api/state` menuju 3001. Perubahan `vite.config.ts` dibuat dalam satu pull request kecil. Produksi: satu port (S64).
>
> **Pemilihan antarmuka.** Satu flag `VITE_UI=v5` di `App.tsx` memilih layar lama atau v5. Perubahannya satu baris percabangan, dibuat sekali.
>
> **Data.** v5 hanya memakai MySQL. Data lama dipindahkan satu kali di S61, dilatih di `inventaris_it_trial` lebih dulu. Selama pengembangan, data uji v5 tidak dicampur dengan data nyata.
>
> **Peralihan.** Setelah UAT (S65) dan migrasi final, flag diubah menjadi bawaan v5. Kode lama dihapus paling cepat dua minggu setelah stabil, dalam pull request tersendiri yang disetujui kedua pengembang.
>
> **Berkas bersama** (`package.json`, `package-lock.json`, `src/types.ts`, `vite.config.ts`, `App.tsx`) diubah dalam pull request kecil tersendiri.

Satu keberatan atas usulan ini: dua sistem berdampingan berarti selama berbulan-bulan ada dua tempat yang bisa menyimpan peminjaman. Selama kantor masih memakai prototipe lama untuk data nyata, jangan masukkan data nyata ke v5 sebelum S61.
