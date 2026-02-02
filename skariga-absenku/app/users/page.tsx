import { prisma } from "@/src/lib/db";
import { Users } from "lucide-react";
import UserList from "@/components/UserList";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      company: {
        select: { id: true, nama: true }
      }
    }
  });

  const companies = await prisma.company.findMany({
    select: { id: true, nama: true },
    orderBy: { nama: "asc" }
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50 relative animate-fadeIn">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-100 rounded-full mix-blend-multiply filter blur-[100px] opacity-30" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-100 rounded-full mix-blend-multiply filter blur-[100px] opacity-30" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <Users className="w-8 h-8 text-sky-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manajemen Pengguna</h1>
            <p className="text-gray-500">
              Verifikasi pendaftaran pengguna baru & kelola penempatan kantor.
            </p>
          </div>
        </div>
        <UserList users={users} companies={companies} />
      </div>
    </div>
  );
}