import { prisma } from "@/src/lib/db";
import { Book, User } from "lucide-react";
import JurnalList from "@/components/JurnalList";
import JurnalUserSelect from "@/components/JurnalUserSelect";
import { Alert } from "antd";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    userId?: string;
  }>;
}

type JurnalWithRelations = Prisma.JurnalGetPayload<{
  include: {
    user: {
      select: {
        nama: true;
        telegramId: true;
        company: {
          select: { nama: true };
        };
      };
    };
  };
}>;

export default async function JurnalPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const selectedUserId = searchParams?.userId;

  const users = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: { id: true, nama: true },
    orderBy: { nama: "asc" },
  });

  const userOptions = users.map((u) => ({
    id: String(u.id),
    nama: u.nama,
    kelas: "-",
  }));

  let jurnals: JurnalWithRelations[] = [];
  let selectedUserName = "";

  if (selectedUserId) {
    const userIdInt = parseInt(selectedUserId);

    if (!isNaN(userIdInt)) {
      const currentUser = await prisma.user.findUnique({
        where: { id: userIdInt },
        select: { nama: true, telegramId: true },
      });

      if (currentUser && currentUser.telegramId) {
        selectedUserName = currentUser.nama || "Siswa";

        jurnals = await prisma.jurnal.findMany({
          where: {
            userId: currentUser.telegramId,
          },
          orderBy: { tanggal: "desc" },
          include: {
            user: {
              select: {
                nama: true,
                telegramId: true,
                company: {
                  select: { nama: true },
                },
              },
            },
          },
        });
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
          <Book className="w-8 h-8 text-sky-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Jurnal <span className="text-sky-500">Kegiatan</span>
          </h1>
          <p className="text-gray-500 text-sm">
            Pantau aktivitas dan laporan harian siswa PKL.
          </p>
        </div>
      </div>

      <JurnalUserSelect users={userOptions} />

      {!selectedUserId ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Belum ada siswa dipilih</h3>
          <p className="text-gray-500 text-sm max-w-md text-center mt-1">
            Silakan pilih nama siswa pada kolom pencarian di atas untuk menampilkan data jurnal.
          </p>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-700">
              Jurnal milik: <span className="text-sky-600">{selectedUserName}</span>
            </h2>
            <span className="bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-xs font-bold">
              {jurnals.length} Laporan
            </span>
          </div>

          {jurnals.length > 0 ? (
            <JurnalList jurnals={jurnals} />
          ) : (
            <Alert
              title="Data Kosong"
              description="Siswa ini belum mengisi jurnal kegiatan apapun atau data tidak ditemukan."
              type="warning"
              showIcon
            />
          )}
        </div>
      )}
    </div>
  );
}