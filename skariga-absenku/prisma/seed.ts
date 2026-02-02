import { PrismaClient } from '@prisma/client'
import { fakerID_ID as faker } from '@faker-js/faker'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const activities = [
  "Membuat tampilan Login menggunakan React dan Tailwind",
  "Slicing UI halaman Dashboard Admin",
  "Belajar integrasi API dengan Axios",
  "Rapat evaluasi mingguan dengan pembimbing lapangan",
  "Fixing bug pada fitur Absensi",
  "Setup database PostgreSQL dan Prisma",
  "Membuat dokumentasi API di Postman",
  "Deploy aplikasi ke Vercel",
  "Belajar State Management menggunakan Zustand",
  "Istirahat dan sholat dzuhur"
]

async function main() {
  console.log('🌱 Mulai seeding data...')
  const hashedAdminPass = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { telegramId: 'admin_dashboard' },
    update: {},
    create: {
      telegramId: 'admin_dashboard',
      nama: 'Super Admin',
      email: 'admin@sekolah.id',
      password: hashedAdminPass,
      role: 'ADMIN',
      status_akun: 'ACTIVE',
    }
  })
  console.log('✅ Admin dibuat.')

  const companiesData = [
    {
      nama: "SMK PGRI 3 Malang (Pusat)",
      alamat: "Jl. Tlogomas No. 29, Malang",
      lat: -7.952086, long: 112.612502
    },
    {
      nama: "PT. Inovasi Teknologi Digital",
      alamat: "Jl. Soekarno Hatta No. 9, Malang",
      lat: -7.943123, long: 112.624567
    },
    {
      nama: "Dinas Kominfo Kota Malang",
      alamat: "Jl. Ijen No. 2, Malang",
      lat: -7.971234, long: 112.631234
    },
    {
      nama: "CV. Kreatif Media Solusindo",
      alamat: "Jl. Sulfat Agung, Malang",
      lat: -7.962345, long: 112.645678
    }
  ]

  const createdCompanies = []
  
  for (const comp of companiesData) {
    const c = await prisma.company.create({
      data: {
        nama: comp.nama,
        alamat: comp.alamat,
        latitude: comp.lat,
        longitude: comp.long,
        radius: 100,
        deskripsi: "Tempat magang siswa jurusan RPL dan TKJ."
      }
    })
    createdCompanies.push(c)
  }
  console.log(`🏢 ${createdCompanies.length} Perusahaan dibuat.`)

  for (let i = 0; i < 20; i++) {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const fullName = `${firstName} ${lastName}`
    const telegramId = faker.string.numeric(9) // ID Tele biasanya angka 9-10 digit
    const email = faker.internet.email({ firstName, lastName }).toLowerCase()
    
    // Assign ke perusahaan secara acak
    const randomCompany = createdCompanies[Math.floor(Math.random() * createdCompanies.length)]

    const user = await prisma.user.create({
      data: {
        telegramId: telegramId,
        nama: fullName,
        email: email,
        role: "STUDENT",
        status_akun: "ACTIVE",
        companyId: randomCompany.id
      }
    })

    console.log(`👤 Siswa: ${fullName} @ ${randomCompany.nama}`)

    for (let d = 0; d < 30; d++) {
      const date = new Date()
      date.setDate(date.getDate() - d)

      const dayOfWeek = date.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const jamMasuk = new Date(date)
      const randomHour = Math.floor(Math.random() * (8 - 6 + 1) + 6)
      const randomMinute = Math.floor(Math.random() * 60)
      jamMasuk.setHours(randomHour, randomMinute, 0)

      let status = "TEPAT WAKTU"
      if (randomHour > 7 || (randomHour === 7 && randomMinute > 0)) {
        status = "TERLAMBAT"
      }

      const lat = randomCompany.latitude + (Math.random() - 0.5) * 0.0005
      const long = randomCompany.longitude + (Math.random() - 0.5) * 0.0005

      await prisma.absensi.create({
        data: {
          userId: user.telegramId,
          tanggal: date,
          jam_masuk: jamMasuk,
          jam_keluar: new Date(jamMasuk.getTime() + 8 * 60 * 60 * 1000),
          lat_masuk: lat,
          long_masuk: long,
          status: status
        }
      })

      if (Math.random() > 0.2) {
        const randomActivity = activities[Math.floor(Math.random() * activities.length)]
        
        await prisma.jurnal.create({
          data: {
            userId: user.telegramId,
            tanggal: date,
            isi_kegiatan: randomActivity,
            bukti_foto: Math.random() > 0.5 ? `https://placehold.co/600x400?text=Bukti+${d}` : null,
            is_approved: Math.random() > 0.3
          }
        })
      }
    }
  }

  console.log('✅ Seeding selesai! Data dummy berhasil dibuat.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })    