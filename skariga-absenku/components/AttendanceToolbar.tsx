"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/id";
import {
  Search,
  X,
  CalendarDays
} from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

dayjs.locale("id");

export default function AttendanceToolbar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const dateParam = searchParams.get("date") || "";
  const [searchTerm, setSearchTerm] = useState(searchParams.get("query") || "");

  const hasDate = !!dateParam;

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (value) params.set(key, value);
    else params.delete(key);
    replace(`${pathname}?${params.toString()}`);
  };

  const handleSearch = useDebouncedCallback((term) => {
    updateParams("query", term);
  }, 300);

  const handleReset = () => {
    setSearchTerm("");
    replace(pathname);
  };

  return (
    <div className={`mb-8 relative z-30 ${poppins.className}`}>
      <div className="flex flex-col md:flex-row items-center gap-8 bg-white/40 p-3 rounded-2xl backdrop-blur-sm border border-white/20 shadow-sm">
        <div className="relative min-w-65 shrink-0 w-full md:w-auto">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-2.5 block ml-1">
            Periode Laporan
          </label>
          <DatePicker
            size="large"
            format="DD MMMM YYYY"
            placeholder="Pilih Tanggal"
            value={hasDate ? dayjs(dateParam) : null}
            inputReadOnly={true}
            allowClear={false}
            suffixIcon={
              <CalendarDays
                className={`w-5 h-5 transition-all duration-300 ${hasDate ? "text-sky-500 scale-110" : "text-gray-400"
                  }`}
              />
            }
            onChange={(date) => {
              const selectedDate = date ? date.format("YYYY-MM-DD") : "";
              if (selectedDate) updateParams("date", selectedDate);
            }}
            style={{ fontFamily: "inherit" }}
            className={`w-full h-13 rounded-2xl transition-all duration-300 shadow-xs cursor-pointer hover:shadow-md active:scale-[0.98]
              [&_input]:cursor-pointer 
              ${hasDate
                ? "bg-sky-50 border-2 border-sky-400 [&_input]:text-sky-700 [&_input]:font-bold [&_input]:text-base"
                : "bg-white border border-gray-200 hover:border-sky-300 [&_input]:text-gray-500 [&_input]:font-medium"
              }
            `}
          />
        </div>

        {hasDate && (
          <div className="hidden md:block h-12 w-px bg-gray-200 self-end mb-1" />
        )}

        {hasDate && (
          <div className="flex-1 flex gap-3 w-full animate-in fade-in zoom-in-95 slide-in-from-left-6 duration-500 items-end">
            <div className="relative flex-1 group">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-2.5 block ml-1">
                Filter Siswa
              </label>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none mt-7">
                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-sky-500 transition-colors" />
              </div>
              <input
                type="text"
                style={{ fontFamily: "inherit" }}
                className="block w-full pl-12 pr-4 border border-gray-200 rounded-2xl bg-white focus:outline-none focus:ring-4 focus:ring-sky-50 focus:border-sky-400 transition-all shadow-xs text-sm text-gray-700 h-13"
                placeholder="Cari berdasarkan Nama atau ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleSearch(e.target.value);
                }}
              />
            </div>

            <button
              onClick={handleReset}
              className="flex items-center justify-center px-5 h-13 bg-white text-red-500 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all border border-gray-200 hover:border-red-200 shadow-xs group active:scale-90"
              title="Reset Semua Filter"
            >
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}