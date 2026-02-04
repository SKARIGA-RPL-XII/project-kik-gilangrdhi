import { Telegraf, Markup } from "telegraf";
import { PrismaClient } from "@prisma/client";
import { getDistance } from "../lib/distance";
import fs from "fs";
import path from "path";
import axios from "axios";

interface ExtendedLocation {
  latitude: number;
  longitude: number;
  horizontal_accuracy?: number;
  live_period?: number;
}

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
    messageText.startsWith("/mulai") ||
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
        "⛔ <b>AKSES DITOLAK</b>\n" +
        "Kamu belum terdaftar di sistem.\n" +
        "Silakan ketik: <code>/daftar emailmu@sekolah.sch.id</code>",
        { parse_mode: "HTML" }
      );
    }
    if (user.status_akun === "PENDING") {
      return ctx.reply("⏳ <b>Akun Pending</b>\nMohon tunggu verifikasi admin/guru.");
    }

    ctx.state.user = user;
    return next();
  } catch (error) {
    console.error("Middleware Error:", error);
  }
});

bot.command(["start", "mulai"], async (ctx) => {
  const user = await prisma.user.findUnique({
    where: { telegramId: ctx.from.id.toString() },
  });

  if (!user) {
    ctx.reply(
      `👋 <b>Halo! Selamat datang di Skariga Absenku.</b>\n\n` +
      `Bot ini digunakan untuk absensi magang dan jurnal harian.\n\n` +
      `🚀 <b>Langkah Pertama:</b>\n` +
      `Silakan daftarkan diri Anda dengan format:\n` +
      `👉 <code>/daftar emailmu@sekolah.sch.id</code>`,
      { parse_mode: "HTML" }
    );
  } else {
    ctx.reply(
      `Halo <b>${user.nama}</b>! 👋\n` +
      `Akun Anda sudah aktif.\n` +
      `Gunakan /bantuan untuk melihat daftar perintah.`,
      { parse_mode: "HTML" }
    );
  }
});

bot.command("bantuan", (ctx) => {
  ctx.reply(
    `🛠️ <b>PANDUAN PENGGUNAAN</b>\n\n` +
      `📍 <b>Absensi (Wajib Live Location)</b>\n` +
      `/masuk - Panduan Absen Masuk\n` +
      `/pulang - Panduan Absen Pulang\n\n` +
      `📝 <b>Jurnal PKL</b>\n` +
      `• <b>Upload:</b> Kirim FOTO + CAPTION langsung.\n` +
      `/jurnal - Lihat & Kelola Jurnal (Edit/Hapus)\n\n` +
      `📂 <b>Akun</b>\n` +
      `/rekap - Cek Rekap Absensi Bulanan\n` +
      `/profil - Cek Data Diri & Status`,
    { parse_mode: "HTML" }
  );
});

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
      `🎉 <b>Pendaftaran Berhasil!</b>\n` +
      `Status akun: <b>PENDING</b>.\n` +
      `Silakan hubungi guru pembimbing untuk aktivasi.`,
      { parse_mode: "HTML" }
    );
  } catch {
    ctx.reply("❌ Email mungkin sudah digunakan oleh siswa lain.");
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
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Gagal memuat profil.");
  }
});

bot.command("rekap", async (ctx) => {
  const year = new Date().getFullYear();
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
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
        { parse_mode: "HTML" }
      );
    }

    let message = `📊 <b>Rekap Absensi: ${namaBulan} ${year}</b>\n\n`;
    history.forEach((data) => {
      const tgl = new Date(data.jam_masuk).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      const jamMasuk = new Date(data.jam_masuk).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      const jamKeluar = data.jam_keluar
        ? new Date(data.jam_keluar).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        : "--:--";
      const iconStatus = data.status_kehadiran === "TERLAMBAT" ? "⚠️" : "✅";
      message += `${iconStatus} <b>${tgl}</b> | ${jamMasuk} - ${jamKeluar}\n`;
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

  if (!caption) return ctx.reply("⚠️ <b>Gagal Upload</b>\nMohon sertakan caption/keterangan kegiatan pada foto.", { parse_mode: "HTML" });

  try {
    ctx.reply("⏳ Mengunggah jurnal...");
    const photoFile = ctx.message.photo.pop();
    if (!photoFile) return;

    const fileLink = await ctx.telegram.getFileLink(photoFile.file_id);
    const fileName = `JURNAL-${telegramId}-${Date.now()}.jpg`;

    const folderPath = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(folderPath, fileName);

    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

    const response = await axios({ url: fileLink.href, responseType: "stream" });
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

    ctx.reply("✅ <b>Jurnal Tersimpan!</b>\nCek riwayat di /jurnal", { parse_mode: "HTML" });
  } catch {
    ctx.reply("❌ Gagal upload foto.");
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
    const tgl = new Date(j.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    return [Markup.button.callback(`📅 ${tgl} - ${j.isi_kegiatan.substring(0, 15)}...`, `view_jurnal_${j.id}`)];
  });

  ctx.reply("📚 <b>Pilih Jurnal untuk Detail/Edit:</b>", {
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
    const tgl = new Date(jurnal.tanggal).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const caption = `<b>DETAIL JURNAL</b>\n\n🗓 <b>Tanggal:</b> ${tgl}\n📝 <b>Kegiatan:</b>\n${jurnal.isi_kegiatan}\n\n<i>Status: ${jurnal.is_approved ? "✅ Disetujui" : "⏳ Menunggu"}</i>`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("✏️ Edit Teks", `edit_jurnal_${idJurnal}`), Markup.button.callback("🗑️ Hapus", `conf_del_jurnal_${idJurnal}`)],
      [Markup.button.callback("🔙 Kembali", "back_list_jurnal")],
    ]);

    await ctx.deleteMessage().catch(() => {});

    if (!namaFileFoto) {
      return ctx.reply(`⚠️ [Foto Tidak Tersedia]\n\n${caption}`, { parse_mode: "HTML", ...keyboard });
    }

    const filePath = path.join(process.cwd(), "public", "uploads", namaFileFoto);
    if (fs.existsSync(filePath)) {
      await ctx.replyWithPhoto({ source: filePath }, { caption: caption, parse_mode: "HTML", ...keyboard });
    } else {
      await ctx.reply(`⚠️ [File Foto Terhapus]\n\n${caption}`, { parse_mode: "HTML", ...keyboard });
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
  await ctx.reply(`Silakan ketik keterangan baru untuk Jurnal ID: ${idJurnal}`, Markup.forceReply());
  await ctx.answerCbQuery();
});

bot.action("back_list_jurnal", async (ctx) => {
  await ctx.deleteMessage();
  ctx.reply("Ketik /jurnal untuk melihat daftar kembali.");
});

bot.on("text", async (ctx, next) => {
  const replyTo = ctx.message.reply_to_message;
  if (replyTo && "text" in replyTo && replyTo.text.startsWith("Silakan ketik keterangan baru untuk Jurnal ID:")) {
    const textBaru = ctx.message.text;
    const idJurnalStr = replyTo.text.split("ID: ")[1];
    const idJurnal = parseInt(idJurnalStr);
    if (idJurnal && textBaru) {
      await prisma.jurnal.update({ where: { id: idJurnal }, data: { isi_kegiatan: textBaru } });
      return ctx.reply(`✅ Jurnal berhasil diupdate!`);
    }
  }
  next();
});

bot.command(["masuk", "pulang"], (ctx) => {
  ctx.reply(
    "📍 <b>ABSENSI WAJIB LIVE LOCATION</b>\n\n" +
      "Mohon maaf, tombol 'Kirim Lokasi' ditiadakan untuk mencegah kecurangan.\n\n" +
      "👇 <b>CARA ABSEN YANG BENAR:</b>\n" +
      "1. Klik ikon 📎 <b>(Klip Kertas)</b> di pojok kiri bawah.\n" +
      "2. Pilih menu 📍 <b>Location</b>.\n" +
      "3. Pilih <b>'Share My Live Location for...'</b> (Bagikan Lokasi Terkini).\n" +
      "4. Pilih durasi <b>15 Menit</b> (atau 1 jam).\n\n" +
      "<i>Sistem akan otomatis mendeteksi dan memvalidasi lokasi Anda.</i>",
    {
      parse_mode: "HTML",
      reply_markup: { remove_keyboard: true },
    }
  );
});

bot.on("location", async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const msg = ctx.message;

  const { latitude, longitude, horizontal_accuracy, live_period } = msg.location as ExtendedLocation;

  if ("forward_date" in msg) {
    return ctx.reply("⛔ <b>AKSES DITOLAK</b>\nTerdeteksi lokasi Forward. Kirim lokasi langsung.", { parse_mode: "HTML" });
  }

  if (!live_period) {
    ctx.deleteMessage().catch(() => {});
    return ctx.reply(
      "⚠️ <b>JENIS LOKASI SALAH!</b>\nAnda mengirim Peta Diam (Static).\nSistem hanya menerima <b>Live Location</b> (Peta Bergerak).",
      { parse_mode: "HTML" }
    );
  }

  if (horizontal_accuracy !== undefined) {
    if (horizontal_accuracy === 0) {
      return ctx.reply("⛔ <b>FAKE GPS TERDETEKSI!</b>\nAkurasi 0m tidak wajar.", { parse_mode: "HTML" });
    }
    if (horizontal_accuracy > 200) {
      return ctx.reply(`⚠️ <b>GPS TIDAK AKURAT (±${horizontal_accuracy}m)</b>\nMohon cari sinyal yang lebih baik.`, { parse_mode: "HTML" });
    }
  }

  try {
    const user = await prisma.user.findUnique({ where: { telegramId }, include: { company: true } });
    if (!user?.company) return ctx.reply("⚠️ Anda belum ditempatkan di kantor magang.");

    // Cek Jarak
    const jarak = getDistance(latitude, longitude, user.company.latitude, user.company.longitude);
    
    if (jarak > user.company.radius) {
      ctx.stopMessageLiveLocation().catch(() => {});
      return ctx.reply(
        `❌ <b>POSISI DI LUAR JANGKAUAN!</b>\n` +
        `Jarak: <b>${jarak.toFixed(0)}m</b> (Max: ${user.company.radius}m).\n` +
        `Pastikan Anda berada di kantor.`,
        { parse_mode: "HTML" }
      );
    }

    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const absenHariIni = await prisma.absensi.findMany({
      where: { userId: telegramId, tanggal: { gte: startOfDay } },
      orderBy: { jam_masuk: "desc" },
      take: 1,
    });
    const dataAbsen = absenHariIni[0];

    const now = new Date();
    const jamSekarangStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).replace(".", ":");

    if (!dataAbsen) {
      const [targetJam, targetMenit] = (user.company.jam_masuk_kantor || "07:00").split(":").map(Number);
      const targetTime = new Date(); targetTime.setHours(targetJam, targetMenit, 0, 0);

      let statusKehadiran = "HADIR";
      let telatMenit = 0;

      if (now > targetTime) {
        statusKehadiran = "TERLAMBAT";
        const diffMs = now.getTime() - targetTime.getTime();
        telatMenit = Math.floor(diffMs / 60000);
      }

      await prisma.absensi.create({
        data: {
          userId: telegramId,
          jam_masuk: now,
          status: "HADIR",
          lat_masuk: latitude,
          long_masuk: longitude,
          tanggal: now,
          status_kehadiran: statusKehadiran,
          telat_menit: telatMenit,
        },
      });

      ctx.stopMessageLiveLocation().catch(() => {});
      
      let pesan = `✅ <b>ABSEN MASUK BERHASIL</b>\n🕒 Pukul: ${jamSekarangStr}\n`;
      if (statusKehadiran === "TERLAMBAT") {
        pesan += `⚠️ <b>Status:</b> TERLAMBAT (${telatMenit} Menit)`;
      } else {
        pesan += `✨ <b>Status:</b> HADIR (Tepat Waktu)`;
      }
      ctx.reply(pesan, { parse_mode: "HTML" });

    }
    else if (!dataAbsen.jam_keluar) {
      const [pulangJam, pulangMenit] = (user.company.jam_pulang_kantor || "15:00").split(":").map(Number);
      const jadwalPulang = new Date(); jadwalPulang.setHours(pulangJam, pulangMenit, 0, 0);

      if (now < jadwalPulang) {
        return ctx.reply(
          `⛔ <b>BELUM WAKTUNYA PULANG!</b>\nJadwal: <b>${user.company.jam_pulang_kantor}</b>\nSekarang: ${jamSekarangStr}`,
          { parse_mode: "HTML" }
        );
      }

      await prisma.absensi.update({ where: { id: dataAbsen.id }, data: { jam_keluar: now } });
      ctx.stopMessageLiveLocation().catch(() => {});
      ctx.reply(`👋 <b>ABSEN PULANG BERHASIL</b>\n🕒 ${jamSekarangStr}\nHati-hati di jalan!`, { parse_mode: "HTML" });
    } 
    else {
      ctx.stopMessageLiveLocation().catch(() => {});
      ctx.reply("✅ Anda sudah absen lengkap hari ini.");
    }

  } catch (error) {
    console.error("Absen Error:", error);
    ctx.reply("❌ Gagal memproses absen.");
  }
});

bot.on("message", (ctx) => {
  if ("text" in ctx.message) {
     ctx.reply("❓ Perintah tidak dikenali.\nSilakan ketik /bantuan untuk melihat menu.");
  }
});

bot.launch().then(() => console.log("✅ Bot Siap!"));
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));