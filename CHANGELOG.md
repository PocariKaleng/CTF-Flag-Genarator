# Changelog

## Unreleased

### Added

- Generate flag dari MD5, SHA-1, SHA-256, SHA-384, atau SHA-512 dengan pilihan hash mentah dan pembungkus prefix.
- Leet acak dengan beberapa padanan tiap huruf serta pilihan mode Klasik.
- Tab generator, shortcut keyboard, konfirmasi clipboard, dan riwayat enam hasil per sesi.
- Tes tanpa dependensi untuk hash, konversi leet, dan pembuatan flag acak.

### Changed

- Teks UI disederhanakan; slogan, badge promosi, dan pesan privasi dihapus.
- UI berbahasa Indonesia dengan layout responsif, tema terang/gelap, label form, dan fokus keyboard yang jelas.
- Output panjang membungkus baris dan tetap dapat disalin utuh.
- Pengacakan memakai Web Crypto dengan rejection sampling.

### Fixed

- Padanan leet acak hanya memakai ASCII; simbol euro diganti dengan `[-`.
- Preferensi tema yang diblokir browser tidak lagi menghentikan aplikasi.
- Tombol salin tidak dapat menyalin placeholder dan memberi pesan saat akses clipboard gagal.
- Tautan GitHub mengarah ke repositori PocariKaleng.
