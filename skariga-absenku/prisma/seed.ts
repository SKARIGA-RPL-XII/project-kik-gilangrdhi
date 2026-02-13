import { PrismaClient } from "@prisma/client";
import { fakerID_ID as faker } from "@faker-js/faker";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Mulai seeding data...");

  await prisma.jurnal.deleteMany();
  await prisma.absensi.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  const hashedAdminPass = await bcrypt.hash("admin123", 10);
  await prisma.user.create({
    data: {
      telegramId: "7777777",
      nama: "Admin Skariga",
      email: "admin@sekolah.id",
      password: hashedAdminPass,
      role: "ADMIN",
      status_akun: "ACTIVE",
    },
  });
  console.log("✅ Admin dibuat: admin@sekolah.id / admin123");

  const companiesData = [
    {
      nama: "SMK PGRI 3 Malang (Pusat)",
      alamat: "Jl. Tlogomas No. 29, Malang",
      lat: -7.952086,
      long: 112.612502,
    },
    {
      nama: "PT. Inovasi Teknologi Digital",
      alamat: "Jl. Soekarno Hatta No. 9, Malang",
      lat: -7.943123,
      long: 112.624567,
    },
    {
      nama: "Dinas Kominfo Kota Malang",
      alamat: "Jl. Ijen No. 2, Malang",
      lat: -7.971234,
      long: 112.631234,
    },
    {
      nama: "CV. Kreatif Media Solusindo",
      alamat: "Jl. Sulfat Agung, Malang",
      lat: -7.962345,
      long: 112.645678,
    },
  ];

  const createdCompanies = [];
  for (const comp of companiesData) {
    const c = await prisma.company.create({
      data: {
        nama: comp.nama,
        alamat: comp.alamat,
        latitude: comp.lat,
        longitude: comp.long,
        radius: 100,
        deskripsi: "Tempat magang siswa jurusan RPL dan TKJ.",
        jam_masuk_kantor: "07:00",
        jam_pulang_kantor: "15:00",
      },
    });
    createdCompanies.push(c);
  }
  console.log(`🏢 ${createdCompanies.length} Perusahaan dibuat.`);

  // 4. Buat Siswa Dummy
  for (let i = 0; i < 25; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const fullName = `${firstName} ${lastName}`;
    const telegramId = faker.string.numeric(9);
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();

    // Pilih perusahaan random
    const randomCompany =
      createdCompanies[Math.floor(Math.random() * createdCompanies.length)];

    const user = await prisma.user.create({
      data: {
        telegramId: telegramId,
        nama: fullName,
        email: email,
        password: await bcrypt.hash("siswa123", 10),
        role: "STUDENT",
        status_akun: "ACTIVE",
        companyId: randomCompany.id,
      },
    });

    for (let d = 0; d < 30; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d);

      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const jamMasuk = new Date(date);
      const randomHour = Math.floor(Math.random() * (8 - 6 + 1) + 6); 
      const randomMinute = Math.floor(Math.random() * 60);
      jamMasuk.setHours(randomHour, randomMinute, 0);

      let telatMenit = 0;
      const targetHour = 7;
      
      if (randomHour > targetHour || (randomHour === targetHour && randomMinute > 0)) {
        telatMenit = ((randomHour - targetHour) * 60) + randomMinute;
      }

      let status = "VALID (VERIFIED)";
      if (Math.random() > 0.9) {
        status = Math.random() > 0.5 ? "INVALID (KELUAR RADIUS)" : "INVALID (LIVE MATI)";
      }

      const lat = randomCompany.latitude + (Math.random() - 0.5) * 0.0005;
      const long = randomCompany.longitude + (Math.random() - 0.5) * 0.0005;

      await prisma.absensi.create({
        data: {
          userId: user.telegramId,
          tanggal: date,
          jam_masuk: jamMasuk,
          jam_keluar: new Date(jamMasuk.getTime() + 8 * 60 * 60 * 1000), // Pulang 8 jam kemudian
          lat_masuk: lat,
          long_masuk: long,
          status: status,
          telat_menit: telatMenit,
        },
      });

      if (Math.random() > 0.2) {
        await prisma.jurnal.create({
          data: {
            userId: user.telegramId,
            tanggal: date,
            isi_kegiatan: faker.lorem.sentences(2),
            bukti_foto: null,
            is_approved: Math.random() > 0.5,
          },
        });
      }
    }
  }

  console.log("✅ Seeding selesai! Data dummy (User, Absen, Jurnal) siap.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });