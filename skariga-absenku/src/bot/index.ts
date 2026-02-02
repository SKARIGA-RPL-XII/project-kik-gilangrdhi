import { Telegraf, Markup } from "telegraf";
import { PrismaClient } from "@prisma/client";
import { getDistance } from "../lib/distance"; 
import fs from "fs";
import path from "path";
import axios from "axios";

const prisma = new PrismaClient();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN as string);

console.log("🔄 Bot Telegram sedang berjalan...");

bot.use(async (ctx, next) => {
  if (!ctx.from) return next();

  const telegramId = ctx.from.id.toString();
  const messageText =
    ctx.message && "text" in ctx.message ? ctx.message.text : "";

  if (
    messageText.startsWith("/start") ||
    messageText.startsWith("/daftar") ||
    messageText.startsWith("/bantuan") ||
    ctx.callbackQuery
  ) {
    return next();
  }

  try {
    const user = await prisma.user.findUnique({ where: { telegramId } });

    if (!user) {
      return ctx.reply(
        "⛔ Akses Ditolak. Silakan daftar dulu: /daftar [email]",
      );
    }
    if (user.status_akun === "PENDING") {
      return ctx.reply("⏳ Akun masih menunggu verifikasi admin/guru.");
    }

    ctx.state.user = user;
    return next();
  } catch (error) {
    console.error("Middleware Error:", error);
  }
});

bot.start(async (ctx) => {
  const user = await prisma.user.findUnique({
    where: { telegramId: ctx.from.id.toString() },
  });
  if (!user) {
    ctx.reply(
      `👋 Halo! Selamat datang di <b>Skariga Absenku</b>.\n\nSilakan registrasi:\n👉 <code>/daftar emailmu@sekolah.sch.id</code>`,
      { parse_mode: "HTML" },
    );
  } else {
    ctx.reply(
      `Halo <b>${user.nama}</b>! 👋\nGunakan menu /bantuan untuk melihat daftar perintah.`,
      { parse_mode: "HTML" },
    );
  }
});

bot.command("bantuan", (ctx) => {
  ctx.reply(
    `🛠️ <b>DAFTAR PERINTAH</b>\n\n` +
      `📍 <b>Absensi</b>\n` +
      `/masuk - Absen Datang (Kirim Lokasi)\n` +
      `/pulang - Absen Pulang (Kirim Lokasi)\n\n` +
      `📝 <b>Jurnal PKL</b>\n` +
      `• <b>Isi Jurnal:</b> Kirim FOTO + CAPTION langsung.\n` +
      `/jurnal - Lihat & Kelola Jurnal (Edit/Hapus)\n\n` +
      `📂 <b>Lainnya</b>\n` +
      `/rekap - Rekap Absensi Bulanan\n` +
      `/profil - Cek Data Diri & Status`,
    { parse_mode: "HTML" },
  );
});

bot.command("daftar", async (ctx) => {
  const emailInput = ctx.message.text.replace("/daftar", "").trim();
  const telegramId = ctx.from.id.toString();
  const fullName = `${ctx.from.first_name} ${ctx.from.last_name || ""}`.trim();

  if (!emailInput.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return ctx.reply(
      "⚠️ Format email salah. Contoh: <code>/daftar budi@smk.sch.id</code>",
      { parse_mode: "HTML" },
    );
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { telegramId },
    });
    if (existingUser)
      return ctx.reply(
        `✅ Akun sudah terdaftar a.n <b>${existingUser.nama}</b>.`,
        { parse_mode: "HTML" },
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
      `🎉 Pendaftaran berhasil! Status: <b>PENDING</b>. Hubungi guru pembimbing.`,
      { parse_mode: "HTML" },
    );
  } catch {
    ctx.reply("❌ Email mungkin sudah digunakan.");
  }
});

bot.command("profil", async (ctx) => {
  const telegramId = ctx.from.id.toString();
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: { company: true },
    });

    if (!user) return ctx.reply("❌ Kamu belum terdaftar.");

    const companyName = user.company ? user.company.nama : "Belum ditempatkan";
    const status = user.status_akun === "PENDING" ? "⏳ Pending" : "✅ Aktif";

    ctx.reply(
      `👤 <b>PROFIL SISWA</b>\n\n` +
        `📛 <b>Nama:</b> ${user.nama}\n` +
        `📧 <b>Email:</b> ${user.email}\n` +
        `🏢 <b>Magang:</b> ${companyName}\n` +
        `🏷 <b>Status:</b> ${status}`,
      { parse_mode: "HTML" },
    );
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Gagal memuat profil.");
  }
});

bot.command("rekap", async (ctx) => {
  const year = new Date().getFullYear();
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const buttons = [];
  let row = [];
  for (let i = 0; i < months.length; i++) {
    row.push(Markup.button.callback(months[i], `rekap_bulan_${i}_${year}`));
    if (row.length === 3 || i === months.length - 1) {
      buttons.push(row);
      row = [];
    }
  }

  ctx.reply(`📅 <b>Pilih Bulan Rekap Tahun ${year}:</b>`, {
    parse_mode: "HTML",
    ...Markup.inlineKeyboard(buttons),
  });
});

bot.action(/rekap_bulan_(\d+)_(\d+)/, async (ctx) => {
  if (!ctx.match) return;
  const monthIndex = parseInt(ctx.match[1]);
  const year = parseInt(ctx.match[2]);
  const telegramId = ctx.from!.id.toString();
  const startDate = new Date(year, monthIndex, 1);
  const endDate = new Date(year, monthIndex + 1, 0);
  endDate.setHours(23, 59, 59);

  const namaBulan = startDate.toLocaleDateString("id-ID", { month: "long" });

  try {
    const history = await prisma.absensi.findMany({
      where: { userId: telegramId, tanggal: { gte: startDate, lte: endDate } },
      orderBy: { tanggal: "asc" },
    });

    if (history.length === 0) {
      return ctx.editMessageText(
        `📂 Tidak ada data absensi di bulan <b>${namaBulan} ${year}</b>.`,
        { parse_mode: "HTML" },
      );
    }

    let message = `📊 <b>Rekap Absensi: ${namaBulan} ${year}</b>\n\n`;
    history.forEach((data) => {
      const tgl = new Date(data.jam_masuk).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });
      const jamMasuk = new Date(data.jam_masuk).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const jamKeluar = data.jam_keluar
        ? new Date(data.jam_keluar).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "--:--";
      message += `🗓 ${tgl} | 🟢 ${jamMasuk} - 🔴 ${jamKeluar}\n`;
    });

    await ctx.editMessageText(message, { parse_mode: "HTML" });
  } catch {
    ctx.reply("❌ Gagal mengambil data.");
  }
});


bot.on("photo", async (ctx) => {
  if (!ctx.state.user) return;

  const telegramId = ctx.from.id.toString();
  const caption = ctx.message.caption;

  if (!caption) return ctx.reply("⚠️ Mohon sertakan caption/keterangan.");

  try {
    ctx.reply("⏳ Mengunggah...");
    const photoFile = ctx.message.photo.pop();
    if (!photoFile) return;

    const fileLink = await ctx.telegram.getFileLink(photoFile.file_id);
    const fileName = `JURNAL-${telegramId}-${Date.now()}.jpg`;

    // Simpan folder
    const folderPath = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(folderPath, fileName);

    if (!fs.existsSync(folderPath))
      fs.mkdirSync(folderPath, { recursive: true });

    const response = await axios({
      url: fileLink.href,
      responseType: "stream",
    });
    response.data.pipe(fs.createWriteStream(filePath));

    await prisma.jurnal.create({
      data: {
        userId: telegramId,
        isi_kegiatan: caption,
        bukti_foto: fileName,
        tanggal: new Date(),
        is_approved: false,
      },
    });

    ctx.reply("✅ Jurnal berhasil disimpan! Cek di /jurnal");
  } catch {
    ctx.reply("❌ Gagal upload.");
  }
});

bot.command(["jurnal", "listjurnal"], async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const listJurnal = await prisma.jurnal.findMany({
    where: { userId: telegramId },
    orderBy: { tanggal: "desc" },
    take: 5,
  });

  if (listJurnal.length === 0) return ctx.reply("📂 Belum ada jurnal.");

  const buttons = listJurnal.map((j) => {
    const tgl = new Date(j.tanggal).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
    return [
      Markup.button.callback(
        `📅 ${tgl} - ${j.isi_kegiatan.substring(0, 15)}...`,
        `view_jurnal_${j.id}`,
      ),
    ];
  });

  ctx.reply("📚 <b>Pilih Jurnal untuk Melihat Detail/Edit:</b>", {
    parse_mode: "HTML",
    ...Markup.inlineKeyboard(buttons),
  });
});

bot.action(/view_jurnal_(\d+)/, async (ctx) => {
  if (!ctx.match) return;
  const idJurnal = parseInt(ctx.match[1]);

  try {
    const jurnal = await prisma.jurnal.findUnique({ where: { id: idJurnal } });
    if (!jurnal) return ctx.reply("❌ Jurnal tidak ditemukan.");

    const namaFileFoto = jurnal.bukti_foto || "";

    const tgl = new Date(jurnal.tanggal).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const caption = `<b>DETAIL JURNAL</b>\n\n🗓 <b>Tanggal:</b> ${tgl}\n📝 <b>Kegiatan:</b>\n${jurnal.isi_kegiatan}\n\n<i>Status: ${jurnal.is_approved ? "✅ Disetujui" : "⏳ Menunggu"}</i>`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback("✏️ Edit Teks", `edit_jurnal_${idJurnal}`),
        Markup.button.callback("🗑️ Hapus", `conf_del_jurnal_${idJurnal}`),
      ],
      [Markup.button.callback("🔙 Kembali ke List", "back_list_jurnal")],
    ]);

    await ctx.deleteMessage().catch(() => {});

    if (!namaFileFoto) {
      return ctx.reply(`⚠️ [Foto Tidak Tersedia]\n\n${caption}`, {
        parse_mode: "HTML",
        ...keyboard,
      });
    }

    const filePath = path.join(
      process.cwd(),
      "public",
      "uploads",
      namaFileFoto,
    );
    if (fs.existsSync(filePath)) {
      await ctx.replyWithPhoto(
        { source: filePath },
        { caption: caption, parse_mode: "HTML", ...keyboard },
      );
    } else {
      await ctx.reply(`⚠️ [File Foto Terhapus]\n\n${caption}`, {
        parse_mode: "HTML",
        ...keyboard,
      });
    }
  } catch (error) {
    console.error(error);
    ctx.reply("❌ Error memuat jurnal.");
  }
});

bot.action(/conf_del_jurnal_(\d+)/, async (ctx) => {
  if (!ctx.match) return;
  const idJurnal = parseInt(ctx.match[1]);
  await prisma.jurnal.delete({ where: { id: idJurnal } });
  await ctx.deleteMessage();
  await ctx.reply("🗑️ Jurnal berhasil dihapus.");
});

bot.action(/edit_jurnal_(\d+)/, async (ctx) => {
  if (!ctx.match) return;
  const idJurnal = ctx.match[1];
  await ctx.reply(
    `Silakan ketik keterangan baru untuk Jurnal ID: ${idJurnal}`,
    Markup.forceReply(),
  );
  await ctx.answerCbQuery();
});

bot.action("back_list_jurnal", async (ctx) => {
  await ctx.deleteMessage();
  ctx.reply("Ketik /jurnal untuk melihat daftar kembali.");
});

bot.on("text", async (ctx, next) => {
  const replyTo = ctx.message.reply_to_message;
  if (
    replyTo &&
    "text" in replyTo &&
    replyTo.text.startsWith("Silakan ketik keterangan baru untuk Jurnal ID:")
  ) {
    const textBaru = ctx.message.text;
    const idJurnalStr = replyTo.text.split("ID: ")[1];
    const idJurnal = parseInt(idJurnalStr);
    if (idJurnal && textBaru) {
      await prisma.jurnal.update({
        where: { id: idJurnal },
        data: { isi_kegiatan: textBaru },
      });
      return ctx.reply(`✅ Jurnal berhasil diupdate!`);
    }
  }
  next();
});

bot.command(["masuk", "pulang"], (ctx) => {
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
      return ctx.reply("⚠️ Anda belum ditempatkan di kantor.");

    const jarak = getDistance(
      latitude,
      longitude,
      user.company.latitude,
      user.company.longitude,
    );
    if (jarak > user.company.radius) {
      return ctx.reply(
        `❌ <b>Jarak Terlalu Jauh!</b>\nAnda berjarak ${jarak.toFixed(0)}m dari kantor (Max: ${user.company.radius}m).`,
        { parse_mode: "HTML" },
      );
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const absenHariIni = await prisma.absensi.findFirst({
      where: { userId: telegramId, tanggal: { gte: startOfDay } },
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
        { parse_mode: "HTML" },
      );
    } else {
      if (absenHariIni.jam_keluar)
        return ctx.reply("✅ Sudah absen pulang hari ini.");
      await prisma.absensi.update({
        where: { id: absenHariIni.id },
        data: { jam_keluar: new Date() },
      });
      ctx.reply(
        `👋 <b>ABSEN PULANG BERHASIL</b>\n🕒 ${new Date().toLocaleTimeString("id-ID")}`,
        { parse_mode: "HTML" },
      );
    }
  } catch (error) {
    console.error(error);
    ctx.reply("❌ Gagal absen.");
  }
});

// Start Bot
bot.launch().then(() => console.log("✅ Bot Siap!"));
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
