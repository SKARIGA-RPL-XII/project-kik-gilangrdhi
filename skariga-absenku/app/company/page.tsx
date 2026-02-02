import { prisma } from "@/src/lib/db";
import { Building, Inbox } from "lucide-react";
import CompanyList from "@/components/CompanyList";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    q?: string;
    sort?: string;
  }>;
}

export default async function CompanyPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q || "";
  const sort = params.sort || "newest";

  let orderBy: Prisma.CompanyOrderByWithRelationInput = { createdAt: "desc" };
  
  if (sort === "oldest") orderBy = { createdAt: "asc" };
  if (sort === "asc") orderBy = { nama: "asc" };
  if (sort === "desc") orderBy = { nama: "desc" };

  const companies = await prisma.company.findMany({
    where: {
      OR: [
        { nama: { contains: query } }, 
        { alamat: { contains: query } },
      ],
    },
    orderBy: orderBy,
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50 relative animate-fadeIn">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-100 rounded-full mix-blend-multiply filter blur-[100px] opacity-30" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-100 rounded-full mix-blend-multiply filter blur-[100px] opacity-30" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <Building className="w-8 h-8 text-sky-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profil Perusahaan</h1>
            <p className="text-gray-500">
              Kelola informasi kantor dan lokasi validasi absensi.
            </p>
          </div>
        </div>

        {companies.length > 0 ? (
          <CompanyList companies={companies} />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300 text-center animate-in fade-in zoom-in-95">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <Inbox className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Data tidak ditemukan</h3>
            <p className="text-gray-500 max-w-sm mt-1">
              Tidak ada perusahaan yang cocok dengan pencarian <strong>{query}</strong>.
            </p>
          </div>
        )}
        
      </div>
    </div>
  );
}