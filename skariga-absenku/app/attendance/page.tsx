import { prisma } from "@/src/lib/db";
import { Prisma } from "@prisma/client";
import {
    MapPin,
    Calendar,
    Clock,
    User,
    FileText,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import Pagination from "@/components/Pagination";
import AttendanceToolbar from "@/components/AttendanceToolbar";
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

        andConditions.push({
            jam_masuk: {
                gte: startDate,
                lte: endDate,
            },
        });
    }

    const whereCondition: Prisma.AbsensiWhereInput = {
        AND: andConditions,
    };

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

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-sky-50/50 text-gray-700 font-semibold border-b border-sky-100">
                                <tr>
                                    <th className="px-6 py-4">Siswa</th>
                                    <th className="px-6 py-4">Tanggal & Waktu</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Lokasi</th>
                                    <th className="px-6 py-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {dataAbsensi.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                                    <AlertCircle className="w-8 h-8 text-gray-300" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-gray-900 font-medium">Data tidak ditemukan</p>
                                                    <p className="text-xs">Coba ubah kata kunci pencarian atau filter tanggal.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    dataAbsensi.map((item) => (
                                        <tr key={item.id} className="hover:bg-sky-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-sky-100 to-sky-200 flex items-center justify-center text-sky-600 font-bold shadow-sm ring-2 ring-white">
                                                        {item.user?.nama ? item.user.nama.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 group-hover:text-sky-600 transition-colors">
                                                            {item.user?.nama || "Tanpa Nama"}
                                                        </p>
                                                        <p className="text-xs text-gray-400 font-mono">{item.userId}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2 text-gray-700">
                                                        <Calendar className="w-3.5 h-3.5 text-orange-400" />
                                                        <span className="font-medium">
                                                            {new Date(item.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                                                        <Clock className="w-3.5 h-3.5 text-sky-400" />
                                                        <span>
                                                            {new Date(item.jam_masuk).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {(() => {
                                                    const statusRaw = item.status ? item.status.toUpperCase() : "UNKNOWN";

                                                    const isLate = statusRaw.includes("TERLAMBAT");
                                                    const isOnTime = statusRaw.includes("TEPAT") || statusRaw.includes("HADIR");

                                                    return (
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border shadow-sm ${isLate
                                                                ? "bg-orange-50 text-orange-700 border-orange-200" // Style Terlambat
                                                                : isOnTime
                                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" // Style Tepat Waktu
                                                                    : "bg-gray-50 text-gray-700 border-gray-200" // Style Lainnya (Izin/Sakit/Unknown)
                                                                }`}
                                                        >
                                                            {isLate && <AlertCircle className="w-3.5 h-3.5 text-orange-500" />}
                                                            {isOnTime && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                                                            {!isLate && !isOnTime && <Clock className="w-3.5 h-3.5 text-gray-400" />}
                                                            {item.status}
                                                        </span>
                                                    );
                                                })()}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-xs bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100 w-fit text-gray-500 font-mono group-hover:border-gray-200 transition-colors">
                                                    <MapPin className="w-3 h-3 text-red-400" />
                                                    <span>{item.lat_masuk.toFixed(4)}, {item.long_masuk.toFixed(4)}</span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <button className="text-sky-600 hover:text-sky-700 hover:bg-sky-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all">
                                                    Detail
                                                </button>
                                            </td>

                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        totalItems={totalItems}
                        currentPage={page}
                        limit={limit}
                    />
                </div>
            </div>
        </div>
    );
}