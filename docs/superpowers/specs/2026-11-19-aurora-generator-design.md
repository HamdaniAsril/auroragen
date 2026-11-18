# Aurora Generator: Rancangan

Tanggal: 2026-11-19 · Status: draf, menunggu persetujuan
Nama kerja: **Auroragen** (nama publik belum diputuskan)

## 1. Apa dan kenapa

Tool web publik untuk membuat **gambar aurora borealis yang realistis**, lalu mengekspornya sebagai **gambar diam**:

- background website,
- aset PNG,
- wallpaper desktop dan HP.

Preview di aplikasi bergerak dan bisa dijeda. Tujuannya supaya pengguna bisa memilih momen terbaik sebelum mengekspor. Hasil akhirnya selalu gambar diam.

Penggunanya publik: orang yang baru pertama kali membuka harus langsung mendapat hasil bagus. Pengguna yang mau mengutak-atik harus punya kontrol lengkap.

## 2. Sasaran, bukan sasaran, dan yang dihindari

**Sasaran**
- Hasilnya terlihat seperti foto aurora asli yang diambil dari darat.
- Kontrol lengkap: jenis aurora, bentuk (acak dengan slider dan tombol 🎲), warna custom, kamera, daratan, langit, dan efek foto.
- Pengunjung baru langsung mendapat hasil bagus lewat preset bergambar.
- Ekspor resolusi tinggi sampai 8K, dan hasilnya sama dengan yang terlihat di preview.
- Bisa dibuka dan dipakai di HP.

**Bukan sasaran** (tidak dikerjakan di proyek ini)
- Ekspor video, GIF, atau kode animasi untuk website.
- Akun, login, server/backend, atau galeri publik.
- Gaya abstrak (gradien lembut, pita sutra). Hanya gaya realistis.
- Menempelkan aurora ke foto milik pengguna.

**Yang dianggap gagal walaupun secara teknis jalan**
- Aurora terlihat seperti garis-garis tegak datar dari samping (masalah mockup pertama).
- Antarmuka yang membuat orang awam bingung karena semua kontrol tampil sekaligus.
- Hasil ekspor berbeda dari preview: bentuk, warna, atau komposisinya bergeser.
- Meniru merek, nama, atau preset Wayglim. Yang diambil hanya pola cara pakainya.

## 3. Batasan

- Semua dirender di browser pengunjung memakai GPU (WebGL2). Tidak ada server, jadi aplikasinya bisa di-hosting statis.
- Harus jalan di Chrome, Safari, Firefox, dan Edge versi terbaru, desktop maupun HP. Kalau WebGL2 tidak tersedia, tampilkan pesan yang jelas.
- Dua bahasa, Indonesia dan Inggris, mengikuti bahasa browser dengan tombol ganti bahasa.
- Shader yang realistis itu berat, jadi preview harus menyesuaikan kekuatan perangkat (lihat §6.2).

## 4. Pendekatan

| Pendekatan | Keputusan | Alasan |
|---|---|---|
| **Web app statis + shader WebGL2 layar penuh** (Vite, React, TypeScript) | **Dipilih** | Realistis, tanpa biaya server, ekspor resolusi tinggi bisa dilakukan di browser. React membantu mengelola banyak kontrol dan lapisan. |
| Canvas 2D (garis-garis dari samping) | Dibuang | Sudah dicoba di mockup pertama dan dinilai pengguna tidak realistis. |
| Three.js | Dibuang | Aurora digambar dengan satu shader layar penuh; scene graph Three.js hanya menambah beban. |
| Render di server | Dibuang | Mahal dan tidak perlu; browser sanggup membuat gambar 4K–8K. |
| Aplikasi desktop (Electron/Tauri) | Dibuang | Publik tidak bisa langsung membukanya lewat link. |

Pilihan teknis diambil Claude, karena pengguna fokus pada hasil.

## 5. Yang sudah diputuskan pengguna

1. Gaya: **borealis realistis** (opsi B dari mockup gaya).
2. Kelima jenis aurora masuk: **Tirai, Busur, Korona, Pilar, Pusaran**.
3. **Ada slider untuk mengacak bentuk**, plus tombol 🎲.
4. **Warna aurora bisa diatur sendiri.**
5. **Kontrol lengkap.**
6. Realisme datang dari **kamera**: aurora adalah objek 3D yang difoto dari darat. Prototipe kedua sudah dinilai pengguna "lebih realistis".
7. **Sudut dan arah hadap kamera bisa digeser langsung di preview.**
8. **Pengacak bentuk aurora dan bentuk daratan terpisah.**
9. Untuk **publik**.
10. Ekspor **gambar diam saja**.
11. Referensi cara pakai: **Wayglim** (https://sirolius.com/playground/wayglim/), yaitu studio tiga kolom.

Patokan visual yang sudah disetujui ada di `docs/superpowers/specs/prototypes/aurora-3d-prototype.html`. Buka langsung di browser. Hasil akhir harus minimal serealistis prototipe ini.

## 6. Rancangan

### 6.1 Model adegan

Satuan dunia: 1 unit = 100 km. Kamera berdiri di tepi danau (y = 0).

**Lapisan aurora** (1 sampai 4 lapisan, digabung secara aditif). Tiap lapisan punya:
- **Jenis:**
  - **Tirai**: tirai berlipat.
  - **Busur**: pita lurus yang jauh, terlihat melengkung karena perspektif.
  - **Korona**: tirai tepat di atas kepala, berkasnya menyatu ke zenit.
  - **Pilar**: tirai yang berkasnya muncul berkelompok.
  - **Pusaran**: tirai berbentuk spiral di bidang datar.
- **Bentuk aurora (seed)**: angka 1–9999 dari slider dan 🎲. Dalam versi renderer yang sama, seed yang sama selalu menghasilkan bentuk yang sama.
- **Parameter bentuk:**
  - jarak dan posisi (arah) di langit,
  - panjang tirai,
  - amplitudo dan kerapatan lipatan,
  - ketinggian tepi bawah,
  - tinggi berkas,
  - kerapatan berkas,
  - kontras berkas,
  - kecerahan.
- **Warna**: tiga titik warna menurut ketinggian (tepi bawah, badan, ujung atas), plus pinggiran pink di tepi bawah yang bisa dinyalakan atau dimatikan. Bisa memakai palet siap pakai atau custom (pemilih warna dan kode hex).
- **Gerak (preview saja)**: kecepatan.

**Cara render** mengikuti prototipe:
- Untuk tiap piksel, sinar pandang ditelusuri di sepanjang jejak tanahnya dalam rentang ketinggian aurora.
- Di titik sinar menembus tirai, digambar lembaran tajam dengan efek terang saat dilihat dari samping (1/|cos|).
- Ditambah pendar volumetrik yang lembut di sekitar tirai.
- Kecerahan meredup dengan jarak dan memudar di dekat cakrawala.

**Langit**
- Gradien zenit ke cakrawala.
- Bintang: kerapatan dan kecerahan; berkedip hanya di preview.
- Bulan (opsional): arah, ketinggian, dan kecerahan. Cahaya bulan ikut menerangi langit.
- Pendar hijau aurora yang memantul ke langit.

**Daratan**
- **Bentuk daratan (seed)** terpisah dari bentuk aurora, dengan slider dan 🎲 sendiri.
- Jenis siluet: tanpa daratan (cakrawala saja), pegunungan, perbukitan, hutan pinus.
- Pengaturan: tinggi, kekasaran, dan warna siluet.
- **Air**: nyala/mati, permukaan seperti cermin atau beriak (jumlah riak), dan kekuatan pantulan.

**Kamera**
- Sudut −10° sampai 90°.
- Arah hadap −180° sampai 180°.
- Lensa 12–50 mm (ekuivalen full-frame), diukur pada **diagonal** bingkai seperti kamera sungguhan. Dengan begitu, bingkai potret dan lanskap dengan lensa yang sama mencakup luas pandang yang mirip. Prototipe mengukur lensa di sisi lebar, dan itu membuat bingkai potret melar; ini harus diubah.
- Seret preview untuk mengarahkan kamera, seperti menggenggam langit. Slider ikut bergerak.
- Pinch atau scroll di preview mengubah lensa.
- Memilih jenis Korona menawarkan preset kamera menghadap ke atas.

**Efek foto**
- Eksposur.
- Pendar (bloom).
- Saturasi.
- Grain.
- Vignette.

**Waktu**: `t` adalah bagian dari state. Frame yang sedang tampil bisa diulang persis.

### 6.2 Render: preview dan ekspor

- **Preview**:
  - Dirender pada resolusi internal yang menyesuaikan diri: diturunkan kalau fps di bawah sekitar 30, lalu diperbesar ke layar.
  - Saat dijeda atau sedang tidak diubah, render ulang sekali dengan resolusi penuh dan sampel lebih banyak supaya tajam.
  - Kalau `prefers-reduced-motion` aktif, preview mulai dalam keadaan dijeda.
- **Ekspor**:
  - Render offscreen pada ukuran target, dipecah per potongan (tile) supaya GPU tidak timeout atau kehilangan konteks.
  - Sampel lebih banyak dan tanpa noise jitter.
  - Bloom dihitung dari render utuh beresolusi rendah lalu ditempel per tile, supaya tidak ada sambungan.
  - Ada indikator progres dan bisa dibatalkan.
- **Sama dengan preview**:
  - Dengan state yang sama, komposisi, bentuk, warna, dan posisi elemen identik.
  - Ukuran sudut bintang tetap di resolusi berapa pun.
  - Bingkai preview selalu mengikuti rasio ukuran ekspor yang dipilih.
- HDR: render ke target float, lalu bloom, tonemap, dan grain/vignette.
- Tangani kehilangan konteks WebGL dengan memuat ulang renderer tanpa kehilangan state.

### 6.3 Ekspor

- **Format**: PNG, JPG (dengan kualitas), dan WebP (dengan kualitas).
- **Ukuran siap pakai**:
  - Full HD 1920×1080, 2K 2560×1440, 4K 3840×2160, 5K 5120×2880
  - Ultrawide 3440×1440
  - Wallpaper HP 1290×2796 dan 1440×3200
  - Persegi 2048×2048
  - Hero web 2560×1280
  - Ukuran sendiri, sisi terpanjang maksimal 7680
- **Batas perangkat**:
  - Ukuran maksimal menyesuaikan kemampuan perangkat. Contohnya, kanvas di iPhone dibatasi sekitar 16,7 MP, jadi 5K masih bisa tetapi 8K tidak.
  - Ukuran yang melebihi batas dinonaktifkan dengan penjelasan singkat, misalnya "Terlalu besar untuk perangkat ini, coba di komputer".
  - Tidak perlu encoder per baris untuk memaksa 8K di HP.
- **WebP di Safari**: Safari tidak bisa membuat WebP dari kanvas, jadi dipakai encoder WASM yang baru dimuat saat dibutuhkan.
- **Salin CSS**: potongan CSS untuk memasang gambar yang diekspor sebagai background (cover, posisi tengah).
- Nama file otomatis, misalnya `aurora-tirai-3840x2160.png`.

### 6.4 Antarmuka (studio ala Wayglim, tema gelap)

- **Bar atas**:
  - nama aplikasi,
  - nama preset aktif dan status "ada perubahan",
  - undo/redo,
  - 🎲 Acak semua,
  - zoom tampilan (pas layar atau 100%),
  - ganti bahasa,
  - Bagikan,
  - Simpan,
  - Ekspor.
- **Kolom kiri**: *Pustaka* (preset bergambar, kolom cari, filter kategori) dan *Tersimpan* (disimpan di browser pengguna).
- **Tengah**:
  - preview di dalam bingkai rasio,
  - petunjuk singkat "Seret untuk memutar kamera" saat pertama dibuka,
  - bar putar di bawahnya (putar/jeda, penggeser waktu, kecepatan).
- **Kolom kanan**: panel pengaturan dengan bagian yang bisa dilipat: Ukuran & format, Aurora (daftar lapisan dan pengaturan lapisan aktif), Langit, Daratan, Kamera, Efek, dan Reset.
- **Gaya kontrol**:
  - slider satu baris (label kiri, nilai kanan, nilai bisa diketik),
  - pemilih bergambar untuk jenis aurora, palet, dan jenis daratan,
  - "Opsi lanjutan" untuk kontrol jarang dipakai,
  - ikon (i) berisi penjelasan singkat.
- **HP** (lebar di bawah 768 px): preview di atas, pengaturan di panel bawah dengan tab, pustaka di panel terpisah.
- **Link berbagi**:
  - Seluruh state adegan, **termasuk rasio bingkai**, dikodekan ringkas di hash URL. Ukuran piksel tidak ikut.
  - Penerima melihat framing yang sama persis dengan pengirim, lalu bebas mengganti rasio.
  - Memilih preset tidak mengubah rasio bingkai yang sedang dipakai.
- Aksesibilitas: semua kontrol bisa dipakai dengan keyboard, label jelas, dan kontras teks cukup.

### 6.5 Preset dan palet

- Saat rilis ada 16–24 preset buatan sendiri dengan nama orisinal. Preset mencakup kelima jenis, beberapa palet, semua jenis daratan, dan beberapa sudut kamera.
- Palet siap pakai:
  - Hijau klasik
  - Hijau-ungu
  - Merah langka (aurora ketinggian tinggi)
  - Pink-ungu
  - Biru es
  - Custom
- Preset pembuka saat pertama kali dibuka: Tirai di atas danau berpegunungan (seperti prototipe).

### 6.6 Teknologi

- Vite, React, TypeScript, dan WebGL2 tanpa library 3D.
- Store state yang mendukung riwayat undo/redo.
- State bisa diserialisasi untuk link berbagi dan fitur Simpan.
  - Formatnya punya versi dan menyimpan **versi renderer** sejak hari pertama.
  - Link dan simpanan lama dijamin tetap terbuka, dan parameternya dimigrasikan.
  - Tampilannya boleh sedikit berubah kalau renderer disempurnakan, jadi shader tidak dibekukan saat rilis.
  - Versi renderer yang tersimpan menjaga opsi untuk mematok tampilan lama di kemudian hari.
- Tes:
  - unit test untuk kode/dekode state dan migrasi versi,
  - validasi semua preset,
  - determinisme seed,
  - satu tes smoke di browser yang memastikan renderer menggambar dan ekspor kecil berhasil.
- Hosting statis. Tempat deploy dan domain diputuskan bersama pengguna nanti.

## 7. Diserahkan ke pembangun

- Rumus shader dan rentang parameter yang tepat, selama hasilnya minimal serealistis prototipe.
- Ukuran tile, teknik bloom, dan strategi resolusi adaptif.
- Struktur komponen, library pendukung kecil, dan ikon.
- Isi dan nama preset, serta cara membuat thumbnail-nya.
- Teks antarmuka (ID/EN), mengikuti nada yang ramah dan singkat.
- Rentang penggeser waktu, kecepatan per lapisan, apa saja yang diacak oleh "Acak semua", perilaku zoom 100%, dan fallback kalau target float tidak tersedia.

## 8. Keputusan yang diambil Claude (mohon dicek pengguna)

Hal-hal berikut tidak diminta langsung oleh pengguna. Semuanya bisa diubah.

1. Rasio bingkai ikut tersimpan di link dan simpanan; ukuran piksel tidak.
2. Lensa diukur pada diagonal bingkai, supaya mode potret (wallpaper HP) tidak melar.
3. Ukuran ekspor maksimal menyesuaikan perangkat. Di HP kira-kira mentok di 5K; 8K hanya di komputer.
4. Link lama selalu bisa dibuka, tetapi tampilannya boleh sedikit berubah kalau renderer diperbaiki.
5. Satu gambar bisa berisi sampai 4 lapisan aurora.
6. Ada bulan opsional. Bima Sakti tidak termasuk.
7. Jenis daratan: tanpa daratan, pegunungan, perbukitan, hutan pinus, ditambah opsi danau berpantulan.
8. Format PNG, JPG, dan WebP, sampai 8K.
9. Antarmuka hanya tema gelap.
10. 16–24 preset saat rilis, dengan nama orisinal.
