# 🤖 Skariga Absenku

<p align="center">
  <img src="Assets/logo.png" width="120" alt="Logo">
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <img src="Assets/mascot.png" width="120" alt="Mascot">
  <br><br>
  <b>Sistem Absensi PKL Berbasis Geolocation & Bot Telegram</b>
  <br>
  <i>Project Kreativitas dan Inovasi (KIK) - SMK PGRI 3 Malang</i>
</p>

<p align="center">
  <img src="[https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)" alt="Next.js">
  <img src="[https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)" alt="Prisma">
  <img src="[https://img.shields.io/badge/Telegraf-Bot-0088cc?style=for-the-badge&logo=telegram](https://img.shields.io/badge/Telegraf-Bot-0088cc?style=for-the-badge&logo=telegram)" alt="Telegraf">
  <img src="[https://img.shields.io/badge/Ant_Design-6-0170FE?style=for-the-badge&logo=ant-design](https://img.shields.io/badge/Ant_Design-6-0170FE?style=for-the-badge&logo=ant-design)" alt="Ant Design">
</p>

---

## 📖 Tentang Project
**Skariga Absenku** adalah platform manajemen kehadiran dan jurnal harian otomatis untuk siswa PKL. Sistem ini menggunakan **Bot Telegram** sebagai antarmuka utama siswa untuk melakukan absensi berbasis lokasi (*geofencing*) dan pengisian jurnal harian.

---

## 📐 Dokumentasi Arsitektur
<p align="center">
  <b>Entity Relationship Diagram (ERD) & Data Flow Diagram (DFD)</b><br>
  <img src="ERD.png" width="48%" alt="ERD">
  &nbsp;
  <img src="DFD-Level-0.png" width="48%" alt="DFD">
</p>

---

## 📱 Preview Bot Telegram
<p align="center">
  <img src="Result/tele%20start.jpeg" width="23%" alt="Start">
  &nbsp;
  <img src="Result/tele%20menu.jpeg" width="23%" alt="Menu">
  &nbsp;
  <img src="Design/Menu%20Tele.png" width="23%" alt="Action">
  &nbsp;
  <img src="Design/Jurnal.png" width="23%" alt="Jurnal">
</p>
<p align="center"><i>(Tampilan Interaksi Siswa dengan Bot Absensi)</i></p>

---

## 💻 Preview Dashboard Web
<p align="center">
  <img src="Result/halaman%20login.png" width="48%" alt="Login">
  &nbsp;
  <img src="Result/halaman%20dashboard.png" width="48%" alt="Dashboard">
</p>
<p align="center">
  <img src="Result/list%20absensi.png" width="48%" alt="Absensi">
  &nbsp;
  <img src="Result/list%20jurnal.png" width="48%" alt="Jurnal">
</p>

---

## 🚀 Panduan Instalasi & Penggunaan

Ikuti langkah-langkah di bawah ini secara berurutan agar project berjalan lancar:

### 1. Masuk ke Folder Source Code
Buka terminal/CMD, lalu masuk ke folder utama aplikasi:
```bash
cd skariga-absenku
```

### 2. Instalasi Library
Jalankan perintah berikut untuk mengunduh semua dependensi (Next.js, Telegraf, Prisma, dll):
```bash
npm install
```

### 3. Konfigurasi File Environment
Buat file baru dengan nama `.env` di dalam folder `skariga-absenku`. Copy paste kode di bawah ini:
```env
DATABASE_URL="file:./prisma/dev.db"
TELEGRAM_BOT_TOKEN="MASUKKAN_TOKEN_BOT_DI_SINI"
NEXTAUTH_SECRET="buat_password_acak_bebas"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Sinkronisasi Database
Jalankan perintah ini untuk membuat struktur tabel database dan mengisi data awal (seeding):
```bash
npx prisma db push
npm run prisma db seed
```

### 5. Menjalankan Project
Gunakan perintah khusus ini untuk mengaktifkan **Web Dashboard** dan **Bot Telegram** sekaligus dalam satu jendela terminal:
```bash
npm run dev:all
```
* **Akses Web:** Buka `http://localhost:3000` di browser.
* **Akses Bot:** Buka Telegram, cari bot Anda, lalu ketik `/start`.

---
<p align="center">
  Developed by <b>Gilang Ardhi Maulana</b><br>
  Siswa RPL - SMK PGRI 3 Malang
</p>
