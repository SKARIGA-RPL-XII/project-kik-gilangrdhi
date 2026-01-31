import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Mulai seeding data...')
  const company = await prisma.company.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nama: "SMK PGRI 3 Malang (Pusat)",
      latitude: -7.952086,
      longitude: 112.612502,
      radius: 100,
      alamat: "Jl. Tlogomas No. 29"
    }
  })

  for (let i = 1; i <= 50; i++) {
    const telegramId = `dummy_user_${i}`
    const namaSiswa = `Siswa Percobaan ${i}`

    await prisma.user.upsert({
      where: { telegramId },
      update: {},
      create: {
        telegramId,
        nama: namaSiswa,
        role: "STUDENT",
        status_akun: "ACTIVE",
        companyId: company.id
      }
    })

    console.log(`👤 Dibuat/Update: ${namaSiswa}`)

    for (let d = 0; d < 30; d++) {
      const date = new Date()
      date.setDate(date.getDate() - d)

      const jamMasuk = new Date(date)
      const randomHour = Math.floor(Math.random() * (8 - 6) + 6)
      const randomMinute = Math.floor(Math.random() * 60)
      jamMasuk.setHours(randomHour, randomMinute, 0)

      let status = "TEPAT WAKTU"
      if (randomHour > 7 || (randomHour === 7 && randomMinute > 0)) {
        status = "TERLAMBAT"
      }

      const lat = -7.952086 + (Math.random() - 0.5) * 0.001
      const long = 112.612502 + (Math.random() - 0.5) * 0.001

      await prisma.absensi.create({
        data: {
          userId: telegramId,
          tanggal: date,
          jam_masuk: jamMasuk,
          lat_masuk: lat,
          long_masuk: long,
          status: status
        }
      })
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