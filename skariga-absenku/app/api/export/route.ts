import { prisma } from "@/src/lib/db";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable, { UserOptions as AutoTableOptions } from "jspdf-autotable";
import fs from "fs";
import path from "path";

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: AutoTableOptions) => jsPDF;
}

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
      if (!isNaN(startDate.getTime())) {
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateFilter);
        endDate.setHours(23, 59, 59, 999);
        andConditions.push({ jam_masuk: { gte: startDate, lte: endDate } });
      }
    }

    const data = await prisma.absensi.findMany({
      where: { AND: andConditions },
      orderBy: { jam_masuk: "desc" },
      include: { user: true },
    });

    const doc = new jsPDF() as jsPDFWithAutoTable;
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginLeft = 15;
    const marginRight = pageWidth - 15;

    let imgBase64 = null;
    try {
      const imagePath = path.join(process.cwd(), "public", "mascot.png");
      const imageBuffer = fs.readFileSync(imagePath);
      imgBase64 = `data:image/png;base64,${imageBuffer.toString("base64")}`;
    } catch (error) {
      console.warn(
        "Mascot image not found or failed to load, skipping image.",
        error,
      );
    }

    let headerTextStartX = marginLeft;
    const headerStartY = 12;

    if (imgBase64) {
      doc.addImage(imgBase64, "PNG", marginLeft, headerStartY, 28, 28);
      headerTextStartX = marginLeft + 32;
    }

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(2, 132, 199);
    doc.text("REKAPITULASI ABSENSI SISWA", headerTextStartX, headerStartY + 10);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(
      "SMK PGRI 3 Malang - Sistem Absenku",
      headerTextStartX,
      headerStartY + 18,
    );
    doc.setDrawColor(2, 132, 199);
    doc.setLineWidth(1);
    doc.line(marginLeft, headerStartY + 32, marginRight, headerStartY + 32);
    doc.setLineWidth(0.1);
    doc.setFontSize(9);
    doc.setTextColor(70);
    const reportDateLabel =
      dateFilter && !isNaN(new Date(dateFilter).getTime())
        ? new Date(dateFilter).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "Semua Waktu";
    doc.text(
      `Filter Periode : ${reportDateLabel}`,
      marginLeft,
      headerStartY + 40,
    );
    doc.text(
      `Total Data : ${data.length} siswa`,
      marginLeft,
      headerStartY + 45,
    );
    doc.text(
      `Dicetak: ${new Date().toLocaleString("id-ID")}`,
      marginRight,
      headerStartY + 40,
      { align: "right" },
    );

    const tableColumn = [
      "No",
      "Nama Siswa",
      "ID Telegram",
      "Waktu Masuk",
      "Status Kehadiran",
    ];
    const tableRows = data.map((item, index) => [
      (index + 1).toString(),
      item.user?.nama || "Tanpa Nama",
      item.userId,
      new Date(item.jam_masuk).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB",
      item.status.toUpperCase(),
    ]);

    autoTable(doc, {
      startY: headerStartY + 52,
      head: [tableColumn],
      body: tableRows,
      theme: "striped",
      headStyles: {
        fillColor: [2, 132, 199],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
        cellPadding: 6,
      },
      styles: {
        fontSize: 9,
        cellPadding: 5,
        valign: "middle",
      },
      alternateRowStyles: {
        fillColor: [240, 249, 255],
      },
      columnStyles: {
        0: {
          cellWidth: 16,
          halign: "center",
          fontStyle: "bold",
          textColor: [100, 100, 100],
        },
        2: { halign: "center" },
        3: { halign: "center" },
        4: { halign: "center", fontStyle: "bold" },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 4) {
          const status = data.cell.raw as string;
          if (status.includes("TERLAMBAT")) {
            data.cell.styles.textColor = [220, 38, 38];
          } else if (status.includes("TEPAT") || status.includes("HADIR")) {
            data.cell.styles.textColor = [22, 163, 74];
          }
        }
      },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Sistem Absensi Skariga | Halaman ${i} dari ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" },
      );
    }

    const pdfOutput = doc.output("arraybuffer");
    const uint8Array = new Uint8Array(pdfOutput);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=Rekap_Absensi_${Date.now()}.pdf`,
      },
    });
  } catch (error) {
    console.error("CRITICAL PDF EXPORT ERROR:", error);
    return NextResponse.json(
      { error: "Gagal membuat PDF. Cek log server." },
      { status: 500 },
    );
  }
}
