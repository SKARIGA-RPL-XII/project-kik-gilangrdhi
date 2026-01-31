import { prisma } from "@/src/lib/db";
import { Prisma } from "@prisma/client";
import { FileText } from "lucide-react";
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
    sort?: string;
  }>;
}

export default async function AttendancePage(props: PageProps) {
  const searchParams = await props.searchParams;

  const page = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 10;
  const query = searchParams?.query || "";
  const dateFilter = searchParams?.date || "";
  const sort = searchParams?.sort || "date_desc";
  const skip = (page - 1) * limit;

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

  let orderBy: Prisma.AbsensiOrderByWithRelationInput = { jam_masuk: "desc" };
  switch (sort) {
    case "date_asc": orderBy = { jam_masuk: "asc" }; break;
    case "name_asc": orderBy = { user: { nama: "asc" } }; break;
    case "name_desc": orderBy = { user: { nama: "desc" } }; break;
    case "status_late": andConditions.push({ status: "TERLAMBAT" }); break;
    case "status_ontime": andConditions.push({ status: "TEPAT WAKTU" }); break;
    default: orderBy = { jam_masuk: "desc" };
  }

  const totalItems = await prisma.absensi.count({ where: whereCondition });
  const dataAbsensi = await prisma.absensi.findMany({
    skip: skip,
    take: limit,
    where: whereCondition,
    orderBy: orderBy,
    include: { user: true },
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50 relative animate-fadeIn">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-0 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-20" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
              <FileText className="w-8 h-8 text-sky-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Data <span className="text-sky-500">Absensi</span>
              </h1>
              <p className="text-gray-500 text-sm">
                Kelola dan pantau kehadiran siswa secara real-time.
              </p>
            </div>
          </div>
          <ExportButton />
        </div>

        <AttendanceToolbar />

        <AttendanceTable 
          data={dataAbsensi} 
          totalItems={totalItems} 
          page={page} 
          limit={limit} 
        />
      </div>
    </div>
  );
}