# 🤖 Skariga Absenku

<p align="center">
  <img src="Assets/logo.png" height="100" alt="Logo">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="Assets/mascot.png" height="100" alt="Mascot">
  <br>
  <br>
  <b>Sistem Absensi PKL Berbasis Geolocation & Bot Telegram</b>
  <br>
  <i>Project Kreativitas dan Inovasi (KIK) - SMK PGRI 3 Malang</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/Telegraf-Bot-0088cc?style=for-the-badge&logo=telegram" alt="Telegraf">
  <img src="https://img.shields.io/badge/Ant_Design-6-0170FE?style=for-the-badge&logo=ant-design" alt="Ant Design">
</p>

---

## 📖 Tentang Project
**Skariga Absenku** adalah platform manajemen kehadiran dan jurnal harian otomatis untuk siswa PKL. Sistem ini menggunakan **Bot Telegram** sebagai antarmuka utama siswa untuk melakukan absensi berbasis lokasi (*geofencing*) dan pengisian jurnal, sementara **Web Dashboard** digunakan oleh admin untuk monitoring data.

### Fitur Utama:
- **📍 Smart Geofencing:** Validasi lokasi absen berdasarkan radius koordinat perusahaan.
- **🤖 Bot Telegram:** Fitur `check-in`, `check-out`, dan input jurnal langsung dari chat.
- **📊 Admin Dashboard:** Manajemen data user, perusahaan, dan verifikasi akun.
- **🖨️ PDF Reporting:** Ekspor rekapitulasi absensi ke format PDF otomatis.

---

## 🖼️ Dokumentasi Sistem

### 📐 Diagram Arsitektur
<p align="center">
  <img src="ERD.png" height="250" alt="ERD">
  &nbsp;&nbsp;
  <img src="DFD-Level-0.png" height="250" alt="DFD 0">
</p>

### 📱 Preview Bot Telegram
<p align="center">
  <img src="Result/tele start.jpeg" height="350" alt="Tele Start">
  &nbsp;&nbsp;
  <img src="Result/tele menu.jpeg" height="350" alt="Tele Menu">
</p>

### 💻 Preview Dashboard Web
<p align="center">
  <img src="Result/halaman dashboard.png" height="220" alt="Dashboard">
  &nbsp;&nbsp;
  <img src="Result/list absensi.png" height="220" alt="List Absensi">
</p>

---

## 🛠️ Tech Stack
- **Frontend:** Next.js 16, React 19, Ant Design, Tailwind CSS v4
- **Backend & Bot:** Node.js, Telegraf API
- **ORM & Database:** Prisma dengan SQLite

---

## 🚀 Panduan Instalasi (Langkah demi Langkah)

Ikuti langkah-langkah berikut untuk menjalankan project di komputer lokal kamu:

### 1. Persiapan Folder
Buka terminal dan masuk ke direktori source code utama:
```bash
cd skariga-absenku
