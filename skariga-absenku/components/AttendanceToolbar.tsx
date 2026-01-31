"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { 
  Search, 
  Calendar as CalendarIcon, 
  ChevronDown, 
  Check, 
  X,
  ArrowUpAZ,     
  ArrowDownZA,   
  Clock,         
  AlertCircle,   
  CheckCircle2,
  History        
} from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

export default function AttendanceToolbar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("query") || "");
  const [date, setDate] = useState(searchParams.get("date") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "date_desc");
  
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    setDate("");
    setSort("date_desc");
    replace(pathname);
  };

  const sortOptions = [
    { value: "date_desc", label: "Terbaru", icon: Clock },
    { value: "date_asc", label: "Terlama", icon: History },
    { value: "name_asc", label: "Nama (A-Z)", icon: ArrowUpAZ },
    { value: "name_desc", label: "Nama (Z-A)", icon: ArrowDownZA },
    { value: "status_late", label: "Terlambat", icon: AlertCircle },
    { value: "status_ontime", label: "Tepat Waktu", icon: CheckCircle2 },
  ];

  const currentSortOption = sortOptions.find(o => o.value === sort);

  return (
    <div className="space-y-4 mb-6 relative z-30"> 
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-sky-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 transition-all shadow-sm text-sm text-gray-700"
            placeholder="Cari siswa (Nama/ID)..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              handleSearch(e.target.value);
            }}
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative group min-w-40">
            <input
              type="date"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                updateParams("date", e.target.value);
              }}
              onClick={(e) => e.currentTarget.showPicker?.()} 
            />

            <div className={`flex items-center justify-between px-4 py-2.5 border rounded-xl text-sm font-medium transition-all shadow-sm group-hover:shadow-md relative z-10 ${
              date 
                ? "bg-linear-to-r from-orange-50 to-white border-orange-200 text-orange-700 ring-2 ring-orange-100" 
                : "bg-white border-gray-200 text-gray-600 group-hover:border-gray-300"
            }`}>
              <div className="flex items-center gap-2">
                <CalendarIcon className={`w-4 h-4 ${date ? "text-orange-500" : "text-gray-400"}`} />
                <span className="whitespace-nowrap">
                  {date 
                    ? new Date(date).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' }) 
                    : "Pilih Tanggal"}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-gray-300 ml-2" />
            </div>
          </div>

          <div className="relative min-w-45" ref={sortRef}>
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md ${
                isSortOpen 
                  ? "bg-sky-50 border-sky-300 text-sky-700 ring-2 ring-sky-100" 
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {currentSortOption && (
                  <currentSortOption.icon className={`w-4 h-4 ${isSortOpen ? "text-sky-600" : "text-gray-400"}`} />
                )}
                <span className="truncate">{currentSortOption?.label || "Urutkan"}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isSortOpen ? "rotate-180 text-sky-600" : ""}`} />
            </button>

            {isSortOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-100 z-100 animate-in fade-in zoom-in-95 duration-100 overflow-hidden ring-1 ring-black/5 origin-top-right">
                <div className="p-1.5 space-y-0.5">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Urutkan Berdasarkan
                  </div>
                  {sortOptions.map((option) => {
                    const isActive = sort === option.value;
                    const Icon = option.icon;
                    
                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSort(option.value);
                          updateParams("sort", option.value);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 text-sm flex items-center justify-between rounded-lg transition-colors group ${
                          isActive 
                            ? "bg-sky-50 text-sky-700 font-medium" 
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? "text-sky-500" : "text-gray-400 group-hover:text-gray-500"}`} />
                          <span>{option.label}</span>
                        </div>
                        {isActive && <Check className="w-4 h-4 text-sky-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {(searchTerm || date || sort !== "date_desc") && (
            <button
              onClick={handleReset}
              className="flex items-center justify-center px-3 py-2.5 bg-white text-red-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors border border-gray-200 hover:border-red-200 shadow-sm"
              title="Reset Filter"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}