# 🤖 Skariga Absenku

<p align="center">
  <img src="Assets/logo.png" width="120" alt="Skariga Absenku Logo">
  <br>
  <img src="Assets/mascot.png" width="200" alt="Skariga Absenku Mascot">
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
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind">
</p>

---

## 📖 Tentang Project
**Skariga Absenku** adalah platform manajemen kehadiran dan jurnal harian otomatis untuk siswa PKL. Sistem ini menggunakan **Bot Telegram** sebagai antarmuka utama siswa untuk melakukan absensi berbasis lokasi (*geofencing*) dan pengisian jurnal, sementara **Web Dashboard** digunakan oleh admin/guru untuk monitoring dan rekap data.

### Fitur Utama:
- **📍 Smart Geofencing:** Validasi lokasi absen berdasarkan radius koordinat perusahaan.
- **🤖 Bot Telegram:** Fitur `check-in`, `check-out`, dan input jurnal harian langsung lewat Telegram.
- **📊 Admin Dashboard:** Manajemen data user, perusahaan, dan verifikasi akun pending.
- **📸 Bukti Jurnal:** Upload foto kegiatan sebagai bukti pengerjaan jurnal harian.
- **🖨️ PDF Reporting:** Ekspor rekapitulasi absensi ke format PDF secara otomatis.

---

## 🖼️ Dokumentasi Sistem

### 📐 Diagram & Alur
<p align="center">
  <img src="ERD.png" width="45%" alt="ERD">
  <img src="DFD-Level-0.png" width="45%" alt="DFD Level 0">
</p>

<details>
<summary><b>Lihat Flowchart Sistem</b></summary>
<p align="center">
  <b>Flowchart User:</b><br>
  <img src="FlowchartUser.png" width="80%" alt="Flowchart User">
  <br><br>
  <b>Flowchart Admin:</b><br>
  <img src="FlowchartAdmin.png" width="80%" alt="Flowchart Admin">
</p>
</details>

### 📱 Antarmuka Bot Telegram (Result)
<p align="center">
  <img src="Result/tele start.jpeg" width="30%" alt="Tele Start">
  <img src="Result/tele menu.jpeg" width="30%" alt="Tele Menu">
</p>

### 💻 Dashboard Web (Result)
<p align="center">
  <img src="Result/halaman dashboard.png" width="48%" alt="Dashboard">
  <img src="Result/list absensi.png" width="48%" alt="List Absensi">
</p>

---

## 🛠️ Tech Stack
- **Frontend:** Next.js 16 (App Router), React 19, Ant Design, Tailwind CSS v4
- **Backend & Bot:** Node.js, Telegraf API
- **ORM & Database:** Prisma dengan SQLite
- **Auth:** NextAuth.js

---

## 🚀 Cara Menjalankan Project

1. **Clone & Masuk ke Folder Source:**
   ```bash
   git clone [https://github.com/username/repo-name.git](https://github.com/username/repo-name.git)
   cd skariga-absenku
