# My Pixel World — Special Edition (Angular)

## Jalankan
1. Pastikan Node.js terpasang.
2. Buka terminal di folder yang berisi `package.json`.
3. Jalankan `npm install` lalu `npm start`.
4. Buka http://localhost:4200.

## Alur website
Bunga pembuka → transisi cahaya → modal senyum/kamera (estimasi senyum 80%) → pilihan kabar → cerita opsional jika memilih Sedih → pilih tanggal weekend → WhatsApp dengan pesan yang sudah disiapkan.

## Pengaturan WhatsApp
Buka `src/app/app.component.ts`, lalu ubah `whatsappNumber = '628XXXXXXXXXX'` menjadi nomor tujuan dalam format internasional tanpa tanda `+`, spasi, atau strip. Jika dibiarkan placeholder, WhatsApp akan membuka pilihan kontak dengan teks yang sudah diisi.

## Catatan kamera & privasi
Kamera memerlukan izin browser. Pada localhost, akses kamera diizinkan oleh browser modern. Model deteksi wajah diunduh dari CDN saat pertama dipakai, jadi perlu koneksi internet. Pemrosesan video dilakukan di browser; video tidak disimpan dan tidak dikirim ke server. Angka persentase adalah perkiraan skor ekspresi senyum dari model, bukan ukuran ilmiah emosi seseorang. Model AI dapat gagal mendeteksi senyum pada kondisi pencahayaan atau sudut tertentu.

Tanggal hanya menerima Sabtu/Minggu dalam rentang 90 hari dari hari ini. Pesan WhatsApp dibuka sebagai draft; pengguna tetap menekan tombol kirim sendiri.
