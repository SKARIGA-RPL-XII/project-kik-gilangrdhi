"use client";

import { Printer, Loader2 } from "lucide-react";
import { useState } from "react";

export default function ExportButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = () => {
    setLoading(true);
    const searchParams = window.location.search; 
    window.location.href = `/api/export${searchParams}`;
    
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-medium hover:bg-sky-700 transition-all shadow-md disabled:opacity-70"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Printer className="w-4 h-4" />
      )}
      {loading ? "Menyiapkan PDF..." : "Cetak Laporan"}
    </button>
  );
}