"use client";

import { Select } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { User } from "lucide-react";

interface UserOption {
  id: string;
  nama: string | null;
  kelas?: string | null;
}

export default function JurnalUserSelect({ users }: { users: UserOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUserId = searchParams.get("userId");

  const handleChange = (value: string) => {
    router.push(`/jurnal?userId=${value}`);
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex items-center gap-4">
      <div className="bg-sky-100 p-2 rounded-lg">
        <User className="w-5 h-5 text-sky-600" />
      </div>
      <div className="flex-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
          Pilih Siswa
        </label>
        <Select
          showSearch
          placeholder="Cari nama siswa..."
          optionFilterProp="children"
          onChange={handleChange}
          defaultValue={currentUserId || undefined}
          style={{ width: "100%", maxWidth: "400px" }}
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
          options={users.map((u) => ({
            value: u.id,
            label: `${u.nama || "Tanpa Nama"}`,
          }))}
        />
      </div>
    </div>
  );
}