import { prisma } from "@/src/lib/db";
import { Prisma } from "@prisma/client";
import { FileText, CalendarX } from "lucide-react";
import AttendanceToolbar from "@/components/AttendanceToolbar";
import AttendanceTable from "@/components/AttendanceTable";
import ExportButton from "@/components/ExportButton";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    query?: string;
    date?: string;
  }>;
}

type SafeAbsensi = Prisma.AbsensiGetPayload<{
  include: { user: true };
}> & { telat_menit: number };

export default async function AttendancePage(props: PageProps) {
  const searchParams = await props.searchParams;

  const page = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 10;
  const query = searchParams?.query || "";
  const dateFilter = searchParams?.date || "";
  const skip = (page - 1) * limit;
  const isWaitingForInput = !dateFilter;

  let totalItems = 0;
  let safeData: SafeAbsensi[] = [];

  if (!isWaitingForInput) {
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
      andConditions.push({ jam_masuk: { gte: startDate, lte: endDate } });
    }

    const whereCondition: Prisma.AbsensiWhereInput = { AND: andConditions };

    totalItems = await prisma.absensi.count({ where: whereCondition });
    const dataAbsensi = await prisma.absensi.findMany({
      skip: skip,
      take: limit,
      where: whereCondition,
      orderBy: { jam_masuk: "desc" },
      include: { user: true },
    });

    safeData = dataAbsensi.map(item => ({
      ...item,
      telat_menit: item.telat_menit ?? 0,
    }));
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50 relative animate-fadeIn">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-0 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-20" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-white rounded-2xl shadow-sm border border-gray-100">
              <FileText className="w-8 h-8 text-sky-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Data <span className="text-sky-500">Absensi</span>
              </h1>
              <p className="text-gray-500 text-sm mt-1.5">
                Kelola dan pantau kehadiran siswa secara real-time.
              </p>
            </div>
          </div>

          {!isWaitingForInput && <ExportButton />}

        </div>

        <AttendanceToolbar />

        {isWaitingForInput ? (
          <div className="mt-6 flex flex-col items-center justify-center py-24 bg-white/40 backdrop-blur-sm rounded-3xl border-2 border-dashed border-gray-200 shadow-sm animate-in fade-in zoom-in-95 duration-500">
            <CalendarX className="w-16 h-16 text-sky-200 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">Laporan Belum Siap</h3>
            <p className="text-gray-400 mt-2 text-center max-w-md">Pilih tanggal pada periode laporan di atas terlebih dahulu untuk menampilkan data kehadiran.</p>
          </div>
        ) : (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <AttendanceTable data={safeData} totalItems={totalItems} page={page} limit={limit} />
          </div>
        )}
      </div>
    </div>
  );
}