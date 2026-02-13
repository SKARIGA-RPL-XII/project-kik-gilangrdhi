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

interface MonitoringSession {
  attendanceId: number;
  startTime: number;
  lastSeen: number;
  warned: boolean;
  isInvalid: boolean;
  originalStatus: string; 
}

const prisma = new PrismaClient();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN as string);
const monitoringMap = new Map<string, MonitoringSession>();

console.log("🔄 Bot Telegram sedang berjalan...");

setInterval(() => {
  const now = Date.now();
  
  monitoringMap.forEach(async (session, userId) => {
    const duration = now - session.startTime;
    const silence = now - session.lastSeen;

    if (duration >= 15 * 60 * 1000) {
      if (!session.warned) {
         bot.telegram.sendMessage(userId, "✅ <b>Waktu 15 Menit Tercapai.</b>\nTerima kasih, kehadiran Anda valid.", { parse_mode: "HTML" }).catch(() => {});
      }
      monitoringMap.delete(userId);
      return;
    }

    if (silence > 20 * 1000 && !session.isInvalid) {
      try {
        await prisma.absensi.update({
          where: { id: session.attendanceId },
          data: { status_kehadiran: "INVALID (GPS MATI)" }
        });

        bot.telegram.sendMessage(
          userId, 
          "⚠️ <b>PERINGATAN KERAS!</b>\n\n" +
          "Sinyal GPS Anda hilang > 20 detik.\n" +
          "Status Absensi di Admin diubah menjadi: <b>INVALID (GPS MATI)</b>.\n\n" +
          "Segera nyalakan Live Location atau ketik /masuk lagi untuk memulihkan status.", 
          { parse_mode: "HTML" }
        ).catch(() => {});
        
        session.isInvalid = true;
        session.warned = true;
        monitoringMap.set(userId, session);
      } catch (e) {
        console.error("Gagal update DB Invalid:", e);
      }
    }
  });
}, 5000);

bot.use(async (ctx, next) => {
  if (!ctx.from) return next();

  const msg = ctx.message || ctx.editedMessage;
  const telegramId = ctx.from.id.toString();
  const messageText = msg && "text" in msg ? msg.text : "";

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
      if (ctx.message) {
         return ctx.reply("⛔ Kamu belum terdaftar. Ketik /daftar emailmu@sekolah.sch.id");
      }
      return;
    }
    if (user.status_akun === "PENDING") {
      if (ctx.message) return ctx.reply("⏳ Akun Pending. Tunggu verifikasi.");
      return;
    }

    ctx.state.user = user;
    return next();
  } catch (error) {
    console.error(error);
  }
});

bot.command(["start", "mulai"], async (ctx) => {
  const user = await prisma.user.findUnique({ where: { telegramId: ctx.from.id.toString() } });
  if (!user) {
    ctx.reply(`👋 <b>Selamat Datang!</b>\nSilakan daftar: <code>/daftar email@sekolah.sch.id</code>`, { parse_mode: "HTML" });
  } else {
    ctx.reply(`Halo <b>${user.nama}</b>! Gunakan /masuk untuk absen.`, { parse_mode: "HTML" });
  }
});

bot.command("bantuan", (ctx) => {
  ctx.reply("Gunakan /masuk untuk absen masuk dan /pulang untuk absen pulang.");
});

bot.command("daftar", async (ctx) => {
  const emailInput = ctx.message.text.replace("/daftar", "").trim();
  const telegramId = ctx.from.id.toString();
  const fullName = `${ctx.from.first_name} ${ctx.from.last_name || ""}`.trim();

  if (!emailInput.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return ctx.reply("⚠️ Format email salah.");

  try {
    const existingUser = await prisma.user.findUnique({ where: { telegramId } });
    if (existingUser) return ctx.reply(`✅ Sudah terdaftar a.n ${existingUser.nama}`);

    await prisma.user.create({
      data: { telegramId, nama: fullName, email: emailInput, status_akun: "PENDING", role: "STUDENT" },
    });
    ctx.reply("🎉 Pendaftaran Berhasil! Tunggu verifikasi guru.");
  } catch {
    ctx.reply("❌ Email sudah digunakan.");
  }
});

bot.command("profil", async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const user = await prisma.user.findUnique({ where: { telegramId }, include: { company: true } });
  if (!user) return ctx.reply("❌ Belum terdaftar.");
  ctx.reply(`👤 <b>PROFIL</b>\nNama: ${user.nama}\nMagang: ${user.company?.nama || "-"}\nStatus: ${user.status_akun}`, { parse_mode: "HTML" });
});

bot.command("rekap", async (ctx) => {
    const year = new Date().getFullYear();
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    const buttons = [];
    let row = [];
    for (let i = 0; i < months.length; i++) {
      row.push(Markup.button.callback(months[i], `rekap_bulan_${i}_${year}`));
      if (row.length === 4 || i === months.length - 1) { buttons.push(row); row = []; }
    }
    ctx.reply(`📅 Pilih Bulan Rekap ${year}:`, Markup.inlineKeyboard(buttons));
});
  
bot.action(/rekap_bulan_(\d+)_(\d+)/, async (ctx) => {
    if (!ctx.match) return;
    const [, m, y] = ctx.match;
    const start = new Date(parseInt(y), parseInt(m), 1);
    const end = new Date(parseInt(y), parseInt(m) + 1, 0); end.setHours(23, 59, 59);
    
    const history = await prisma.absensi.findMany({
      where: { userId: ctx.from!.id.toString(), tanggal: { gte: start, lte: end } },
      orderBy: { tanggal: "asc" }
    });
  
    if (!history.length) return ctx.editMessageText("📂 Tidak ada data.");
    
    let msg = `📊 <b>Rekap ${start.toLocaleDateString("id-ID", {month:"long"})}</b>\n`;
    history.forEach(d => {
        const dateWIB = new Date(d.jam_masuk.getTime() + (7*3600000));
        const tgl = dateWIB.getDate();
        const inTime = dateWIB.toLocaleTimeString("id-ID", {hour:"2-digit", minute:"2-digit", timeZone:"UTC"});
        const outTime = d.jam_keluar ? new Date(d.jam_keluar.getTime() + (7*3600000)).toLocaleTimeString("id-ID", {hour:"2-digit", minute:"2-digit", timeZone:"UTC"}) : "--:--";
        msg += `${d.status_kehadiran==="TERLAMBAT"?"⚠️":"✅"} ${tgl} | ${inTime}-${outTime}\n`;
    });
    ctx.editMessageText(msg, { parse_mode: "HTML" });
});

bot.on("photo", async (ctx) => {
  if (!ctx.state.user) return; 
  const telegramId = ctx.from.id.toString();
  const caption = ctx.message.caption;

  if (!caption) return ctx.reply("⚠️ <b>Gagal Upload</b>\nMohon sertakan caption.", { parse_mode: "HTML" });

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

    const nowUTC = new Date();
    const nowWIB = new Date(nowUTC.getTime() + (7 * 60 * 60 * 1000));

    await prisma.jurnal.create({
      data: {
        userId: telegramId,
        isi_kegiatan: caption,
        bukti_foto: fileName,
        tanggal: nowWIB,
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
    const dateWIB = new Date(j.tanggal.getTime() + (7 * 60 * 60 * 1000));
    const tgl = dateWIB.toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "UTC" });
    return [Markup.button.callback(`📅 ${tgl} - ${j.isi_kegiatan.substring(0, 15)}...`, `view_jurnal_${j.id}`)];
  });

  ctx.reply("📚 <b>Pilih Jurnal:</b>", {
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
    const dateWIB = new Date(jurnal.tanggal.getTime() + (7 * 60 * 60 * 1000));
    const tgl = dateWIB.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
    
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
    "📍 <b>ABSENSI LIVE LOCATION</b>\n\n" +
    "1. Klik 📎 > 📍 Location.\n" +
    "2. Pilih <b>'Share My Live Location'</b>.\n" +
    "3. Pilih durasi <b>15 Menit</b>.\n\n" +
    "⚠️ <b>JANGAN STOP LIVE LOCATION!</b>\nSistem akan memantau posisi Anda.",
    { parse_mode: "HTML", reply_markup: { remove_keyboard: true } }
  );
});

bot.on(["location", "edited_message"], async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const msg = ctx.message || ctx.editedMessage;
  
  if (!msg || !("location" in msg)) return;

  const { latitude, longitude, horizontal_accuracy, live_period } = msg.location as ExtendedLocation;

  if ("forward_date" in msg) return ctx.reply("⛔ Jangan forward lokasi!");

  if (!live_period) {
     if (ctx.message) ctx.reply("⚠️ Gunakan <b>Live Location</b> (Peta Bergerak).", { parse_mode: "HTML" });
     return;
  }

  if (horizontal_accuracy !== undefined && horizontal_accuracy === 0) {
    if (ctx.message) ctx.reply("⛔ <b>FAKE GPS TERDETEKSI!</b>", { parse_mode: "HTML" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { telegramId }, include: { company: true } });
    if (!user?.company) return;

    const jarak = getDistance(latitude, longitude, user.company.latitude, user.company.longitude);
    const radiusKantor = user.company.radius;

    const nowUTC = new Date();
    const updateTime = "edit_date" in msg ? new Date((msg as { edit_date: number }).edit_date * 1000) : nowUTC;
    const offsetWIB = 7 * 60 * 60 * 1000;
    const nowWIB = new Date(updateTime.getTime() + offsetWIB);
    const startOfDayWIB = new Date(nowWIB); startOfDayWIB.setUTCHours(0, 0, 0, 0);

    const absenHariIni = await prisma.absensi.findFirst({
      where: { userId: telegramId, tanggal: { gte: startOfDayWIB } },
      orderBy: { jam_masuk: "desc" }
    });

    if (!absenHariIni || (absenHariIni && (absenHariIni.status_kehadiran || "").includes("INVALID") && jarak <= radiusKantor)) {
      
      if (jarak > radiusKantor) {
         if (ctx.message && !absenHariIni) ctx.reply(`❌ Jarak terlalu jauh: ${jarak.toFixed(0)}m.`);
         return; 
      }

      const [targetJam, targetMenit] = (user.company.jam_masuk_kantor || "07:00").split(":").map(Number);
      const deadlineWIB = new Date(nowWIB); deadlineWIB.setUTCHours(targetJam, targetMenit, 0, 0);

      let statusKehadiran = "HADIR";
      let telatMenit = 0;

      if (nowWIB > deadlineWIB) {
        statusKehadiran = "TERLAMBAT";
        telatMenit = Math.floor((nowWIB.getTime() - deadlineWIB.getTime()) / 60000);
      }

      if (absenHariIni && (absenHariIni.status_kehadiran || "").includes("INVALID")) {
        await prisma.absensi.update({
          where: { id: absenHariIni.id },
          data: { status_kehadiran: statusKehadiran }
        });
        
        const session = monitoringMap.get(telegramId);
        if (session) {
           session.isInvalid = false;
           session.lastSeen = Date.now();
           monitoringMap.set(telegramId, session);
        } else {
           monitoringMap.set(telegramId, { 
             attendanceId: absenHariIni.id,
             startTime: Date.now(), 
             lastSeen: Date.now(), 
             warned: false, 
             isInvalid: false,
             originalStatus: statusKehadiran
           });
        }
        
        ctx.reply("✅ <b>GPS KEMBALI NORMAL!</b>\nStatus absensi dipulihkan menjadi Valid.", { parse_mode: "HTML", reply_parameters: { message_id: msg.message_id } });
      } 
      else {
        const newAbsen = await prisma.absensi.create({
          data: {
            userId: telegramId,
            jam_masuk: nowUTC,
            status: "HADIR",
            lat_masuk: latitude,
            long_masuk: longitude,
            tanggal: nowUTC,
            status_kehadiran: statusKehadiran,
            telat_menit: telatMenit,
          },
        });
        
        monitoringMap.set(telegramId, { 
          attendanceId: newAbsen.id,
          startTime: Date.now(), 
          lastSeen: Date.now(), 
          warned: false, 
          isInvalid: false,
          originalStatus: statusKehadiran
        });

        let pesan = `✅ <b>ABSEN MASUK BERHASIL</b>\n`;
        pesan += `🕒 ${nowWIB.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} WIB\n`;
        pesan += `📍 Jarak: ${jarak.toFixed(0)}m\n\n`;
        pesan += `⚠️ <b>JANGAN MATIKAN LIVE LOCATION!</b>\nSistem memantau posisi Anda selama 15 menit.`;
        
        ctx.reply(pesan, { parse_mode: "HTML", reply_parameters: { message_id: msg.message_id } });
      }
    }
    else if (!absenHariIni.jam_keluar) {
      const session = monitoringMap.get(telegramId);
      
      if (session) {
        session.lastSeen = Date.now();
        if (session.isInvalid) {
            if (jarak <= radiusKantor) {
               await prisma.absensi.update({ where: { id: session.attendanceId }, data: { status_kehadiran: session.originalStatus || "HADIR" } });
               session.isInvalid = false;
               ctx.reply("✅ Sinyal kembali. Status dipulihkan.");
            }
        }
        monitoringMap.set(telegramId, session);
      } else {
        monitoringMap.set(telegramId, { 
          attendanceId: absenHariIni.id,
          startTime: Date.now(), 
          lastSeen: Date.now(), 
          warned: false, 
          isInvalid: false, 
          originalStatus: absenHariIni.status_kehadiran || "HADIR"
        });
      }

      if (jarak > radiusKantor) {
        ctx.reply(
          `⚠️ <b>PERINGATAN!</b> Anda keluar area kantor (${jarak.toFixed(0)}m). Segera kembali!`,
          { parse_mode: "HTML", reply_parameters: { message_id: msg.message_id } }
        ).catch(() => {});
      }
    }
    else {
       monitoringMap.delete(telegramId);
       ctx.stopMessageLiveLocation().catch(() => {});
    }
  } catch (error) {
    console.error("Error:", error);
  }
});

bot.launch().then(() => console.log("✅ Bot Siap!"));
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));