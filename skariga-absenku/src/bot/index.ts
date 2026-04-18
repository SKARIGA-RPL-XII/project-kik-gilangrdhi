import { Telegraf, Markup } from "telegraf";
import { PrismaClient } from "@prisma/client";
import { getDistance } from "../lib/distance";
import fs from "fs";
import path from "path";
import axios from "axios";

const MIN_DURASI_MENIT = 15;
const MAX_DIAM_DETIK = 60;
const CHECK_INTERVAL = 3000;

interface LiveSession {
  userId: string;
  dbId: number;
  startTime: number;
  lastUpdate: number;
  companyLat: number;
  companyLong: number;
  radius: number;
  type: "MASUK" | "PULANG";
  isInvalid: boolean;
}

interface ExtendedLocation {
  latitude: number;
  longitude: number;
  horizontal_accuracy?: number;
  live_period?: number;
}

const sessions = new Map<string, LiveSession>();
const userIntents = new Map<string, "MASUK" | "PULANG">();
const prisma = new PrismaClient();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN as string);

console.log("🚀 Bot Absensi Ultimate Ready!");

bot.use(async (ctx, next) => {
  if (!ctx.from) return next();
  const text = ctx.message && "text" in ctx.message ? ctx.message.text : "";

  if (
    text.startsWith("/start") ||
    text.startsWith("/bantuan") ||
    text.startsWith("/daftar")
  ) {
    return next();
  }

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: ctx.from.id.toString() },
      include: { company: true },
    });

    if (!user)
      return ctx.reply(
        "⛔ Akses Ditolak. Anda belum terdaftar. Silakan ketik /daftar [email] untuk mendaftar.",
      );
    ctx.state.user = user;
    return next();
  } catch (err) {
    console.error("DB Error:", err);
  }
});

bot.command(["start", "mulai"], (ctx) =>
  ctx.reply(
    "👋 Halo! Gunakan /masuk untuk absen masuk atau /pulang untuk pulang.",
  ),
);

bot.command("bantuan", (ctx) => {
  ctx.reply(
    `🛠️ <b>PANDUAN PENGGUNAAN</b>\n\n` +
      `<code>/daftar</code> - Mendaftarkan Akun\n\n` +
      `📍 <b>Absensi (Wajib Live Location)</b>\n` +
      `<code>/masuk</code> - Panduan Absen Masuk\n` +
      `<code>/pulang</code> - Panduan Absen Pulang\n\n` +
      `📝 <b>Jurnal PKL</b>\n` +
      `<b>Upload:</b> Kirim FOTO + CAPTION langsung.\n` +
      `<code>/jurnal</code> - Lihat & Kelola Jurnal (Edit/Hapus)\n\n` +
      `📂 <b>Akun</b>\n` +
      `<code>/rekap</code> - Cek Rekap Absensi Bulanan\n` +
      `<code>/profil</code> - Cek Data Diri & Status`,
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
      `🎉 <b>Pendaftaran Berhasil!</b>\n` +
        `Status akun: <b>PENDING</b>.\n` +
        `Silakan hubungi guru pembimbing untuk aktivasi.`,
      { parse_mode: "HTML" },
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
      const iconStatus = (data.telat_menit ?? 0) > 0 ? "⚠️" : "✅";

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

  if (!caption)
    return ctx.reply(
      "⚠️ <b>Gagal Upload</b>\nMohon sertakan caption/keterangan kegiatan pada foto.",
      { parse_mode: "HTML" },
    );

  try {
    ctx.reply("⏳ Mengunggah jurnal...");
    const photoFile = ctx.message.photo.pop();
    if (!photoFile) return;

    const fileLink = await ctx.telegram.getFileLink(photoFile.file_id);
    const fileName = `JURNAL-${telegramId}-${Date.now()}.jpg`;

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

    ctx.reply("✅ <b>Jurnal Tersimpan!</b>\nCek riwayat di /jurnal", {
      parse_mode: "HTML",
    });
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
      [Markup.button.callback("🔙 Kembali", "back_list_jurnal")],
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

bot.command("masuk", (ctx) => {
  userIntents.set(ctx.from.id.toString(), "MASUK");
  ctx.reply(
    `📍 <b>ABSEN MASUK</b>\n\n` +
      `Silakan kirim <b>Live Location</b> sekarang.\n` +
      `Pilih 📎 (Klip) > Location > <b>Share My Live Location</b>.`,
    { parse_mode: "HTML" },
  );
});

bot.command("pulang", (ctx) => {
  userIntents.set(ctx.from.id.toString(), "PULANG");
  ctx.reply(
    `📍 <b>ABSEN PULANG</b>\n\n` +
      `Silakan kirim <b>Live Location</b> sekarang.\n` +
      `Pilih 📎 (Klip) > Location > <b>Share My Live Location</b>.`,
    { parse_mode: "HTML" },
  );
});

bot.on("location", async (ctx) => {
  const user = ctx.state.user;
  const msg = ctx.message;
  const loc = msg.location;
  const extLoc = loc as ExtendedLocation;
  const intent = userIntents.get(user.telegramId);

  if (!intent) {
    return ctx.reply(
      "⚠️ <b>Perintah Belum Jelas</b>\n" +
        "Silakan ketik <code>/masuk</code> atau <code>/pulang</code> terlebih dahulu sebelum mengirim lokasi.",
      { parse_mode: "HTML" },
    );
  }

  if (!("live_period" in extLoc)) {
    return ctx.reply(
      "❌ <b>SALAH!</b>\nAnda mengirim lokasi diam (Static).\nMohon kirim <b>Live Location</b> (Peta Bergerak).",
      { parse_mode: "HTML" },
    );
  }

  if (!user.company)
    return ctx.reply("⚠️ Anda belum ditempatkan di kantor manapun.");

  const jarak = getDistance(
    loc.latitude,
    loc.longitude,
    user.company.latitude,
    user.company.longitude,
  );
  if (jarak > user.company.radius) {
    return ctx.reply(
      `⛔ <b>DILUAR JANGKAUAN!</b>\nJarak: ${jarak.toFixed(0)}m (Max: ${user.company.radius}m).\nSilakan masuk ke area kantor.`,
    );
  }

  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));

  try {
    const lastAbsen = await prisma.absensi.findFirst({
      where: { userId: user.telegramId, tanggal: { gte: todayStart } },
      orderBy: { jam_masuk: "desc" },
    });

    let absenId = 0;

    if (intent === "MASUK") {
      if (lastAbsen && !lastAbsen.status.includes("INVALID")) {
        return ctx.reply("⚠️ Anda sudah melakukan absen masuk hari ini.");
      }

      const [tJam, tMenit] = (user.company.jam_masuk_kantor || "07:00")
        .split(":")
        .map(Number);
      const target = new Date();
      target.setHours(tJam, tMenit, 0, 0);

      let telat = 0;
      if (new Date() > target) {
        telat = Math.floor((new Date().getTime() - target.getTime()) / 60000);
      }

      if (lastAbsen && lastAbsen.status.includes("INVALID")) {
        const updateRecord = await prisma.absensi.update({
          where: { id: lastAbsen.id },
          data: {
            jam_masuk: new Date(),
            lat_masuk: loc.latitude,
            long_masuk: loc.longitude,
            status: "VALIDATING (15 Menit)",
            telat_menit: telat,
          },
        });
        absenId = updateRecord.id;
        ctx.reply(
          `✅ <b>ABSEN MASUK (ULANG) DICATAT</b>\n⏳ Pertahankan Live Location selama ${MIN_DURASI_MENIT} menit.`,
          { parse_mode: "HTML" },
        );
      } else {
        const newRecord = await prisma.absensi.create({
          data: {
            userId: user.telegramId,
            jam_masuk: new Date(),
            tanggal: new Date(),
            lat_masuk: loc.latitude,
            long_masuk: loc.longitude,
            status: "VALIDATING (15 Menit)",
            telat_menit: telat,
          },
        });
        absenId = newRecord.id;
        ctx.reply(
          `✅ <b>ABSEN MASUK DICATAT</b>\n⏳ Pertahankan Live Location selama ${MIN_DURASI_MENIT} menit.`,
          { parse_mode: "HTML" },
        );
      }
    } else if (intent === "PULANG") {
      if (!lastAbsen) {
        return ctx.reply("⚠️ Anda belum melakukan absen masuk hari ini.");
      }

      if (lastAbsen.jam_keluar && !lastAbsen.status.includes("INVALID")) {
        return ctx.reply("✅ Anda sudah absen pulang hari ini.");
      }

      const updateRecord = await prisma.absensi.update({
        where: { id: lastAbsen.id },
        data: {
          jam_keluar: new Date(),
          status: "VALIDATING (15 Menit)",
        },
      });
      absenId = updateRecord.id;
      ctx.reply(
        `👋 <b>ABSEN PULANG DICATAT</b>\n⏳ Pertahankan Live Location selama ${MIN_DURASI_MENIT} menit.`,
        { parse_mode: "HTML" },
      );
    }

    sessions.set(user.telegramId, {
      userId: user.telegramId,
      dbId: absenId,
      startTime: Date.now(),
      lastUpdate: Date.now(),
      companyLat: user.company.latitude,
      companyLong: user.company.longitude,
      radius: user.company.radius,
      type: intent,
      isInvalid: false,
    });

    userIntents.delete(user.telegramId);
  } catch (err) {
    console.error("Absen Start Error:", err);
    ctx.reply("❌ Terjadi kesalahan sistem.");
  }
});

bot.on("edited_message", async (ctx) => {
  const msg = ctx.editedMessage;
  if (!msg || !("location" in msg) || !msg.location) return;

  const telegramId = ctx.from?.id.toString();
  if (!telegramId) return;

  const session = sessions.get(telegramId);

  if (!session || session.isInvalid) return;

  const loc = msg.location;

  const jarak = getDistance(
    loc.latitude,
    loc.longitude,
    session.companyLat,
    session.companyLong,
  );

  if (jarak > session.radius) {
    session.isInvalid = true;
    sessions.set(telegramId, session);

    await prisma.absensi.update({
      where: { id: session.dbId },
      data: { status: "INVALID (KELUAR RADIUS)" },
    });

    return ctx.reply(
      `⚠️ <b>PERINGATAN: ANDA KELUAR RADIUS KANTOR!</b>\n` +
        `Jarak Anda saat ini: ${jarak.toFixed(0)}m (Maksimal: ${session.radius}m).\n\n` +
        `❌ <b>Proses absensi dibatalkan otomatis.</b>\n` +
        `🔄 <b>Silakan kembali ke dalam area kantor dan ketik /${session.type.toLowerCase()} untuk mengulang absen dari awal.</b>`,
      {
        parse_mode: "HTML",
        reply_parameters: { message_id: msg.message_id },
      },
    );
  }

  session.lastUpdate = Date.now();
  sessions.set(telegramId, session);
});

setInterval(async () => {
  const now = Date.now();

  for (const [telegramId, session] of sessions.entries()) {
    if (session.isInvalid) {
      sessions.delete(telegramId);
      continue;
    }

    const durasiJalan = now - session.startTime;
    const durasiDiam = now - session.lastUpdate;

    if (durasiJalan >= MIN_DURASI_MENIT * 60 * 1000) {
      await prisma.absensi.update({
        where: { id: session.dbId },
        data: { status: "VALID (VERIFIED)" },
      });

      bot.telegram
        .sendMessage(
          telegramId,
          `✅ <b>VALIDASI SUKSES!</b>\n` +
            `Terima kasih, lokasi Anda valid selama ${MIN_DURASI_MENIT} menit.\n` +
            `Data telah tersimpan aman. Anda boleh mematikan Live Location sekarang.`,
          { parse_mode: "HTML" },
        )
        .catch(() => {});

      sessions.delete(telegramId);
    } else if (durasiDiam > MAX_DIAM_DETIK * 1000) {
      await prisma.absensi.update({
        where: { id: session.dbId },
        data: { status: "INVALID (LIVE MATI)" },
      });

      bot.telegram
        .sendMessage(
          telegramId,
          `❌ <b>VALIDASI GAGAL!</b>\n` +
            `Sinyal hilang atau Live Location dimatikan sebelum 15 menit.\n\n` +
            `🔄 <b>Silakan ketik /${session.type.toLowerCase()} lagi</b> untuk mengulang.`,
          { parse_mode: "HTML" },
        )
        .catch(() => {});

      sessions.delete(telegramId);
    }
  }
}, CHECK_INTERVAL);

bot.launch().then(() => console.log("✅ Bot Started!"));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));