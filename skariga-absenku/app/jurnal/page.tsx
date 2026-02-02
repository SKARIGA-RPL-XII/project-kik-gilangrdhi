import { prisma } from "@/src/lib/db";
import { BookOpenCheck } from "lucide-react";
import JurnalList from "@/components/JurnalList";

export const dynamic = "force-dynamic";

export default async function JurnalPage() {
  const jurnals = await prisma.jurnal.findMany({
    orderBy: { tanggal: "desc" },
    include: {
      user: {
        select: {
          nama: true,
          telegramId: true,
          company: {
            select: { nama: true }
          }
        }
      }
    }
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50 relative animate-fadeIn">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-0 w-96 h-96 bg-emerald-100 rounded-full mix-blend-multiply filter blur-[100px] opacity-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-100 rounded-full mix-blend-multiply filter blur-[100px] opacity-20" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <BookOpenCheck className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Jurnal Kegiatan</h1>
            <p className="text-gray-500">
              Pantau dan validasi laporan kegiatan harian siswa magang.
            </p>
          </div>
        </div>
        <JurnalList jurnals={jurnals} />
        
      </div>
    </div>
  );
}