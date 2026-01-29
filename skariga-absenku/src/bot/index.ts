import { Telegraf } from "telegraf";
import { PrismaClient } from "@prisma/client";
import { getDistance } from "../lib/distance";
import fs from "fs";
import path from "path";
import axios from "axios";

const prisma = new PrismaClient();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN as string);

console.log("🔄 Bot Telegram sedang berjalan...");

// ==========================================
// 🛡️ MIDDLEWARE (SATPAM)
// ==========================================
bot.use(async (ctx, next) => {
  if (!ctx.from) return next();

  const telegramId = ctx.from.id.toString();
  const messageText = ctx.message && "text" in ctx.message ? ctx.message.text : "";

  // Daftar perintah yang boleh diakses tanpa login
  if (
    messageText.startsWith("/start") ||
    messageText.startsWith("/daftar") ||
    messageText.startsWith("/bantuan")
  ) {
    return next();
  }

  try {
    const user = await prisma.user.findUnique({ where: { telegramId } });

    if (!user) {
      return ctx.reply(
        "⛔ <b>Akses Ditolak</b>\n" +
          "Kamu belum terdaftar. Silakan ketik: <code>/daftar [email]</code>",
        { parse_mode: "HTML" }
      );
    }

    if (user.status_akun === "PENDING") {
      return ctx.reply(
        "⏳ <b>Akun Pending</b>\n" +
          "Mohon tunggu verifikasi admin/guru sebelum menggunakan bot.",
        { parse_mode: "HTML" }
      );
    }

    ctx.state.user = user;
    return next();
  } catch (error) {
    console.error("Middleware Error:", error);
    return ctx.reply("❌ Terjadi kesalahan sistem.");
  }
});

// ==========================================
// 🎮 MENU UTAMA & BANTUAN
// ==========================================
bot.start(async (ctx) => {
  const user = await prisma.user.findUnique({
    where: { telegramId: ctx.from.id.toString() },
  });

  if (!user) {
    return ctx.reply(
      `👋 Halo! Selamat datang di <b>Skariga Absenku</b>.\n\n` +
        `Silakan registrasi dulu:\n` +
        `👉 <code>/daftar emailmu@sekolah.sch.id</code>`,
      { parse_mode: "HTML" }
    );
  }

  ctx.reply(
    `Halo <b>${user.nama}</b>! 👋\n` +
      `Gunakan menu di bawah atau ketik <code>/bantuan</code> untuk melihat daftar perintah.`,
    { parse_mode: "HTML" }
  );
});

bot.command(["bantuan", "help"], (ctx) => {
  ctx.reply(
    `🛠️ <b>DAFTAR PERINTAH</b>\n\n` +
      `📍 <b>Absensi</b>\n` +
      `/masuk - Absen Datang (Kirim Lokasi)\n` +
      `/pulang - Absen Pulang (Kirim Lokasi)\n\n` +
      `📝 <b>Jurnal PKL</b>\n` +
      `• <b>Cara Isi:</b> Kirim FOTO kegiatan + CAPTION.\n` +
      `/listjurnal - Lihat riwayat jurnal\n` +
      `/editjurnal [ID] [Isi Baru] - Edit teks jurnal\n` +
      `/hapusjurnal [ID] - Hapus jurnal\n\n` +
      `📂 <b>Lainnya</b>\n` +
      `/rekap - Cek absen 5 hari terakhir\n` +
      `/daftar [email] - Registrasi siswa`,
    { parse_mode: "HTML" }
  );
});

// ==========================================
// 📝 ADMINSITRASI (DAFTAR & REKAP)
// ==========================================
bot.command("daftar", async (ctx) => {
  const emailInput = ctx.message.text.replace("/daftar", "").trim();
  const telegramId = ctx.from.id.toString();
  const fullName = `${ctx.from.first_name} ${ctx.from.last_name || ""}`.trim();

  if (!emailInput.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return ctx.reply(
      "⚠️ Format email salah. Contoh: <code>/daftar budi@smk.sch.id</code>",
      { parse_mode: "HTML" }
    );
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { telegramId },
    });
    if (existingUser)
      return ctx.reply(
        `✅ Akun sudah terdaftar a.n <b>${existingUser.nama}</b>.`,
        { parse_mode: "HTML" }
      );

    await prisma.user.create({
      data: {
        telegramId,
        nama: fullName,
        email: emailInput,
        status_akun: "PENDING",
        role: "STUDENT",
      },
    });

    ctx.reply(
      `🎉 Pendaftaran berhasil! Status akun: <b>PENDING</b>. Hubungi guru pembimbing.`,
      { parse_mode: "HTML" }
    );
    console.log(`[REGISTER] ${fullName}`);
  } catch {
    ctx.reply("❌ Email mungkin sudah digunakan.");
  }
});

bot.command(["rekap", "history"], async (ctx) => {
  const telegramId = ctx.from.id.toString();

  try {
    const history = await prisma.absensi.findMany({
      where: { userId: telegramId },
      take: 5,
      orderBy: { tanggal: "desc" },
    });

    if (history.length === 0) {
      return ctx.reply("📂 Belum ada riwayat absensi.");
    }

    let message = "📅 <b>5 Riwayat Absensi Terakhir:</b>\n\n";
    history.forEach((data) => {
      const tgl = new Date(data.jam_masuk).toLocaleDateString("id-ID");
      const jamMasuk = new Date(data.jam_masuk).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const jamKeluar = data.jam_keluar
        ? new Date(data.jam_keluar).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Belum Pulang";

      message += `🔹 <b>${tgl}</b>\n   Masuk: ${jamMasuk} | Pulang: ${jamKeluar}\n`;
    });

    ctx.reply(message, { parse_mode: "HTML" });
  } catch (error) {
    console.error("Error Rekap:", error);
    ctx.reply("❌ Gagal memuat riwayat.");
  }
});

// ==========================================
// 📸 CRUD JURNAL (CREATE, READ, UPDATE, DELETE)
// ==========================================

// 1. CREATE (Upload Foto + Caption)
bot.on("photo", async (ctx) => {
  if (!ctx.state.user) return; // Pastikan user login

  const telegramId = ctx.from.id.toString();
  const caption = ctx.message.caption;

  if (!caption) {
    return ctx.reply(
      "⚠️ <b>Gagal</b>\nMohon kirim foto disertai <b>Caption</b> (keterangan kegiatan).",
      { parse_mode: "HTML" }
    );
  }

  try {
    ctx.reply("⏳ Sedang mengunggah bukti...");

    // Ambil foto resolusi tertinggi
    const photoFile = ctx.message.photo.pop();
    if (!photoFile) return;

    // Download Foto
    const fileLink = await ctx.telegram.getFileLink(photoFile.file_id);
    const fileName = `BUKTI-${telegramId}-${Date.now()}.jpg`;
    const folderPath = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(folderPath, fileName);

    // Buat folder jika belum ada
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Simpan ke folder public/uploads
    const response = await axios({ url: fileLink.href, responseType: "stream" });
    response.data.pipe(fs.createWriteStream(filePath));

    // Simpan ke DB
    const jurnalBaru = await prisma.jurnal.create({
      data: {
        userId: telegramId,
        isi_kegiatan: caption,
        bukti_foto: fileName,
        tanggal: new Date(),
        is_approved: false,
      },
    });

    ctx.reply(
      `✅ <b>Jurnal Tersimpan!</b>\n` +
        `🆔 ID: <b>${jurnalBaru.id}</b>\n` +
        `📝 "${caption}"\n` +
        `📸 Foto berhasil diupload.`,
      { parse_mode: "HTML" }
    );
  } catch (error) {
    console.error("Error Jurnal:", error);
    ctx.reply("❌ Gagal menyimpan data.");
  }
});

// 2. READ (List Jurnal)
bot.command("listjurnal", async (ctx) => {
  const telegramId = ctx.from.id.toString();

  const listJurnal = await prisma.jurnal.findMany({
    where: { userId: telegramId },
    orderBy: { tanggal: "desc" },
    take: 5,
  });

  if (listJurnal.length === 0) return ctx.reply("📂 Belum ada jurnal.");

  let message = "📚 <b>5 Jurnal Terakhir:</b>\n\n";

  listJurnal.forEach((j) => {
    const tgl = new Date(j.tanggal).toLocaleDateString("id-ID");
    const adaFoto = j.bukti_foto ? "✅ Ada Foto" : "❌ Tanpa Foto";

    message += `🔹 <b>ID: ${j.id}</b> (${tgl})\n`;
    message += `📝 ${j.isi_kegiatan}\n`;
    message += `📸 ${adaFoto}\n\n`;
  });

  message += "<i>Ketik /editjurnal atau /hapusjurnal untuk mengubah.</i>";
  ctx.reply(message, { parse_mode: "HTML" });
});

// 3. UPDATE (Edit Caption)
bot.command("editjurnal", async (ctx) => {
  const args = ctx.message.text.split(" ");
  const idJurnal = parseInt(args[1]);
  const textBaru = args.slice(2).join(" ");

  if (!idJurnal || !textBaru)
    return ctx.reply(
      "⚠️ Format: <code>/editjurnal [ID] [Teks Baru]</code>",
      { parse_mode: "HTML" }
    );

  try {
    const count = await prisma.jurnal.count({
      where: { id: idJurnal, userId: ctx.from.id.toString() },
    });

    if (count === 0)
      return ctx.reply("❌ Jurnal tidak ditemukan/bukan milikmu.");

    await prisma.jurnal.update({
      where: { id: idJurnal },
      data: { isi_kegiatan: textBaru },
    });
    ctx.reply("✅ Jurnal berhasil diedit!");
  } catch {
    ctx.reply("❌ Gagal edit.");
  }
});

// 4. DELETE (Hapus Jurnal)
bot.command("hapusjurnal", async (ctx) => {
  const args = ctx.message.text.split(" ");
  const idJurnal = parseInt(args[1]);

  if (!idJurnal)
    return ctx.reply("⚠️ Format: <code>/hapusjurnal [ID]</code>", {
      parse_mode: "HTML",
    });

  try {
    const deleted = await prisma.jurnal.deleteMany({
      where: { id: idJurnal, userId: ctx.from.id.toString() },
    });

    if (deleted.count === 0) return ctx.reply("❌ Gagal hapus (Data tidak ada).");
    ctx.reply("🗑️ Jurnal berhasil dihapus.");
  } catch {
    ctx.reply("❌ Gagal hapus.");
  }
});

// ==========================================
// 📍 SISTEM ABSENSI (LOCATION)
// ==========================================
bot.command(["masuk", "pulang", "absen"], (ctx) => {
  ctx.reply("📍 Klik tombol di bawah untuk absen:", {
    reply_markup: {
      keyboard: [[{ text: "📍 Kirim Lokasi Saya", request_location: true }]],
      one_time_keyboard: true,
      resize_keyboard: true,
    },
  });
});

bot.on("location", async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const { latitude, longitude } = ctx.message.location;

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: { company: true },
    });

    if (!user?.company)
      return ctx.reply("⚠️ Anda belum ditempatkan di kantor magang.");

    const jarak = getDistance(
      latitude,
      longitude,
      user.company.latitude,
      user.company.longitude
    );

    if (jarak > user.company.radius) {
      return ctx.reply(
        `❌ <b>Jarak Terlalu Jauh!</b>\n` +
          `Anda berjarak ${jarak.toFixed(0)}m dari kantor (Max: ${user.company.radius}m).`,
        { parse_mode: "HTML" }
      );
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const absenHariIni = await prisma.absensi.findFirst({
      where: {
        userId: telegramId,
        tanggal: { gte: startOfDay },
      },
    });

    if (!absenHariIni) {
      await prisma.absensi.create({
        data: {
          userId: telegramId,
          jam_masuk: new Date(),
          status: "HADIR",
          lat_masuk: latitude,
          long_masuk: longitude,
          tanggal: new Date(),
        },
      });
      ctx.reply(
        `✅ <b>ABSEN MASUK BERHASIL</b>\n🕒 ${new Date().toLocaleTimeString("id-ID")}`,
        { parse_mode: "HTML" }
      );
    } else {
      if (absenHariIni.jam_keluar)
        return ctx.reply("✅ Anda sudah absen pulang hari ini.");

      await prisma.absensi.update({
        where: { id: absenHariIni.id },
        data: { jam_keluar: new Date() },
      });
      ctx.reply(
        `👋 <b>ABSEN PULANG BERHASIL</b>\n🕒 ${new Date().toLocaleTimeString("id-ID")}`,
        { parse_mode: "HTML" }
      );
    }
  } catch (error) {
    console.error("Error Absen:", error);
    ctx.reply("❌ Gagal memproses lokasi.");
  }
});

// START BOT
bot.launch().then(() => console.log("✅ Bot Siap!"));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));