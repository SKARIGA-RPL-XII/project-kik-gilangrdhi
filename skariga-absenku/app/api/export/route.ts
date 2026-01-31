import { prisma } from "@/src/lib/db";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("query") || "";
    const dateFilter = searchParams.get("date") || "";
    const andConditions: Prisma.AbsensiWhereInput[] = [];

    if (query) {
      andConditions.push({
        OR: [
          { user: { nama: { contains: query } } }, 
          { userId: { contains: query } },
        ],
      });
    }

    if (dateFilter) {
      const startDate = new Date(dateFilter);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(dateFilter);
      endDate.setHours(23, 59, 59, 999);
      
      andConditions.push({
        jam_masuk: { gte: startDate, lte: endDate },
      });
    }

    const whereCondition: Prisma.AbsensiWhereInput = {
      AND: andConditions,
    };

    const data = await prisma.absensi.findMany({
      where: whereCondition,
      orderBy: { jam_masuk: "desc" },
      include: { user: true },
    });

    const csvHeader = "ID Telegram,Nama Siswa,Tanggal,Jam Masuk,Status,Latitude,Longitude\n";

    const csvRows = data.map(item => {
      const tgl = new Date(item.tanggal).toLocaleDateString("id-ID");
      const jam = new Date(item.jam_masuk).toLocaleTimeString("id-ID", { hour: '2-digit', minute:'2-digit' });
      const cleanName = item.user?.nama ? item.user.nama.replace(/"/g, '""') : "Tanpa Nama";
      
      return `${item.userId},"${cleanName}",${tgl},${jam},${item.status},${item.lat_masuk},${item.long_masuk}`;
    });

    const csvString = csvHeader + csvRows.join("\n");

    return new NextResponse(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=absensi_export_${Date.now()}.csv`,
      },
    });

  } catch (error) {
    console.error("Export Error:", error);
    return NextResponse.json({ error: "Gagal export data" }, { status: 500 });
  }
}