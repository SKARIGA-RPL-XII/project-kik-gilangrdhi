"use client";

import { Input, Select, ConfigProvider } from "antd";
import { 
  Search, 
  ArrowUpDown, 
  CalendarDays, 
  CalendarClock, 
  ArrowDownAZ, 
  ArrowUpAZ 
} from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function CompanyToolbar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const currentSearch = searchParams.get("q")?.toString();
  const currentSort = searchParams.get("sort")?.toString();

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    replace(`${pathname}?${params.toString()}`);
  };

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("sort", value);
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#0ea5e9", borderRadius: 8 } }}>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            size="large"
            placeholder="Cari nama perusahaan atau alamat..."
            prefix={<Search size={18} className="text-gray-400 mr-2" />}
            defaultValue={currentSearch}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
            className="rounded-xl shadow-sm hover:border-sky-400 focus:border-sky-500"
          />
        </div>

        {/* DROPDOWN SORT (DENGAN ICON) */}
        <div className="w-full md:w-64">
          <Select
            size="large"
            defaultValue={currentSort || "newest"}
            onChange={handleSort}
            style={{ width: "100%" }}
            suffixIcon={<ArrowUpDown size={16} className="text-gray-400" />}
            className="shadow-sm rounded-xl"
            options={[
              { 
                value: "newest", 
                label: (
                  <div className="flex items-center gap-2 text-gray-600">
                    <CalendarDays size={16} className="text-sky-500" />
                    <span>Terbaru</span>
                  </div>
                ) 
              },
              { 
                value: "oldest", 
                label: (
                  <div className="flex items-center gap-2 text-gray-600">
                    <CalendarClock size={16} className="text-orange-400" />
                    <span>Terlama</span>
                  </div>
                ) 
              },
              { 
                value: "asc", 
                label: (
                  <div className="flex items-center gap-2 text-gray-600">
                    <ArrowDownAZ size={16} className="text-emerald-500" />
                    <span>Nama (A-Z)</span>
                  </div>
                ) 
              },
              { 
                value: "desc", 
                label: (
                  <div className="flex items-center gap-2 text-gray-600">
                    <ArrowUpAZ size={16} className="text-emerald-500" />
                    <span>Nama (Z-A)</span>
                  </div>
                ) 
              },
            ]}
          />
        </div>

      </div>
    </ConfigProvider>
  );
}