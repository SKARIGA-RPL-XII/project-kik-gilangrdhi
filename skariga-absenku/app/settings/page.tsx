import { prisma } from "@/src/lib/db";
import { Settings } from "lucide-react";
import SettingsForm from "@/components/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const admin = await prisma.user.findFirst({
    where: { 
      role: "ADMIN"
    }
  });

  if (!admin) {
    return (
      <div className="p-10 text-center text-red-500">
        Error: Akun Admin tidak ditemukan di Database.
      </div>
    );
  }

  const adminData = {
    id: admin.id,
    nama: admin.nama || "Admin",
    email: admin.email || "",
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50 relative animate-fadeIn">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gray-100 rounded-full mix-blend-multiply filter blur-[100px] opacity-50" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <Settings className="w-8 h-8 text-sky-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pengaturan & Profil</h1>
            <p className="text-gray-500">
              Kelola informasi akun admin dan keamanan sistem.
            </p>
          </div>
        </div>
        <SettingsForm admin={adminData} />
      </div>
    </div>
  );
}