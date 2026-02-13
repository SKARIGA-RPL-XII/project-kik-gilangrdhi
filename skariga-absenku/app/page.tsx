import { prisma } from "@/src/lib/db";
import { Users, UserCheck, Clock, MapPin, Calendar, CheckCircle, XCircle } from "lucide-react";
import StatsCard from "@/components/StatsCard";
import Link from "next/link";

export default async function Dashboard() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const totalSiswa = await prisma.user.count({
    where: { role: "STUDENT" },
  });

  const hadirHariIni = await prisma.absensi.count({
    where: {
      jam_masuk: { gte: todayStart, lte: todayEnd },
    },
  });

  const terlambat = await prisma.absensi.count({
    where: {
      jam_masuk: { gte: todayStart, lte: todayEnd },
      status: { contains: "TERLAMBAT" }, 
    },
  });

  const totalKantor = await prisma.company.count();

  const recentAbsensi = await prisma.absensi.findMany({
    take: 5,
    orderBy: { jam_masuk: "desc" },
    include: { user: true },
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-30 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-sky-400 rounded-full mix-blend-multiply filter blur-[80px] opacity-30 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Dashboard <span className="text-sky-500">Admin</span>
            </h1>
            <p className="text-gray-500 mt-1">
              Selamat datang kembali, Admin! 👋
            </p>
          </div>
          <div className="text-sm font-medium text-sky-600 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-sky-100 shadow-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard title="Total Siswa" value={totalSiswa} icon={Users} color="sky" />
          <StatsCard title="Hadir Hari Ini" value={hadirHariIni} icon={UserCheck} color="green" />
          <StatsCard title="Terlambat" value={terlambat} icon={Clock} color="orange" />
          <StatsCard title="Lokasi Kantor" value={totalKantor} icon={MapPin} color="red" />
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-linear-to-r from-gray-50 to-white/50">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-sky-500" />
              Absensi Terbaru
            </h3>
            <Link
              href="/attendance"
              className="text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline transition-all"
            >
              Lihat Semua &rarr;
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-sky-50/50 text-gray-600 font-semibold border-b border-sky-100">
                <tr>
                  <th className="px-6 py-4">Nama Siswa</th>
                  <th className="px-6 py-4">Waktu Masuk</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">ID Telegram</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentAbsensi.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Clock className="w-8 h-8 text-gray-300" />
                        <p>Belum ada data absensi hari ini.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentAbsensi.map((item) => {
                    const rawStatus = item.status || "";
                    const status = rawStatus.toUpperCase();
                    
                    let badgeClass = "bg-green-100 text-green-700 border-green-200";
                    let IconComponent = CheckCircle;
                    let statusText = "Hadir"; 

                    if (status.includes("INVALID") || status.includes("GPS MATI")) {
                      badgeClass = "bg-red-100 text-red-700 border-red-200";
                      IconComponent = XCircle;
                      statusText = "Invalid";
                    } else {
                      badgeClass = "bg-green-100 text-green-700 border-green-200";
                      IconComponent = CheckCircle;
                      statusText = "Hadir";
                    }

                    return (
                      <tr key={item.id} className="hover:bg-sky-50/30 transition-colors group">
                        <td className="px-6 py-4 font-medium text-gray-900 group-hover:text-sky-700 transition-colors">
                          {item.user?.nama || "Tanpa Nama"}
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-mono">
                          {item.jam_masuk ? new Date(item.jam_masuk).toLocaleTimeString("id-ID", {
                            hour: "2-digit", minute: "2-digit",
                          }) : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badgeClass}`}>
                            <IconComponent className="w-3.5 h-3.5" />
                            {statusText}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-xs font-mono">
                          {item.user?.telegramId || item.userId}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}