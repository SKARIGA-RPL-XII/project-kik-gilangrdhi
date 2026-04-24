# 🤖 Skariga Absenku

<p align="center">
  <img src="public/mascot.png" width="200" alt="Skariga Absenku Mascot">
  <br>
  <b>Sistem Absensi PKL Berbasis Geolocation & Bot Telegram</b>
  <br>
  <i>SMK PGRI 3 Malang - Rekayasa Perangkat Lunak</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/Telegraf-Bot-0088cc?style=for-the-badge&logo=telegram" alt="Telegraf">
  <img src="https://img.shields.io/badge/Ant_Design-6-0170FE?style=for-the-badge&logo=ant-design" alt="Ant Design">
</p>

---

## 📖 Tentang Project
**Skariga Absenku** adalah platform manajemen kehadiran dan jurnal kegiatan harian bagi siswa yang menjalankan Praktik Kerja Lapangan (PKL). Project ini memadukan kemudahan interaksi melalui **Bot Telegram** dengan dashboard admin yang komprehensif menggunakan **Next.js**.

### Fitur Utama:
- **📍 Smart Geofencing:** Memvalidasi lokasi absen berdasarkan radius koordinat perusahaan yang sudah ditentukan di database.
- **🤖 Telegram Interaction:** Siswa melakukan absen masuk, pulang, dan mengisi jurnal langsung dari bot.
- **📑 Digital Journaling:** Pencatatan kegiatan harian siswa yang terintegrasi dengan sistem persetujuan (*approval*) admin.
- **📊 Admin Dashboard:** Monitoring kehadiran, manajemen data perusahaan (Company), dan verifikasi akun siswa.
- **🖨️ PDF Reporting:** Ekspor data absensi ke format PDF menggunakan `jspdf` dan `jspdf-autotable`.

---

## 🛠️ Tech Stack
Project ini dibangun menggunakan ekosistem JavaScript modern:
- **Core:** [Next.js 16](https://nextjs.org/) & [React 19](https://react.dev/)
- **Bot Engine:** [Telegraf](https://telegrafjs.org/) (Telegram Bot API)
- **ORM & DB:** [Prisma](https://www.prisma.io/) dengan SQLite
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) & [Ant Design](https://ant.design/)
- **Auth:** [NextAuth.js](https://next-auth.js.org/)

---

## 🏗️ Struktur Database (Prisma Schema)
Sistem ini menggunakan relasi database yang terstruktur untuk mengelola data operasional PKL:

- **Company:** Menyimpan data lokasi, koordinat (Lat/Long), dan radius aman absensi.
- **User:** Mengelola data profil siswa yang terikat dengan `telegramId` unik.
- **Absensi:** Mencatat waktu masuk/pulang beserta titik koordinat saat melakukan aksi.
- **Jurnal:** Menyimpan laporan aktivitas harian dan status approval.

---

## 🚀 Cara Menjalankan Project

### 1. Persiapan Environment
Buat file `.env` di root project:
```env
DATABASE_URL="file:./prisma/dev.db"
TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN"
NEXTAUTH_SECRET="your_secret_key"
NEXTAUTH_URL="http://localhost:3000"
