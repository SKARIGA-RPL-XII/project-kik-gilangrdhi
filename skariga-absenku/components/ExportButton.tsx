"use client";

import { Download } from "lucide-react";
import { useState } from "react";

export default function ExportButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const searchParams = window.location.search; 
      window.location.href = `/api/export${searchParams}`;
      
    } catch (error) {
      console.error("Gagal download", error);
      alert("Terjadi kesalahan saat mengunduh data.");
    } finally {
      setTimeout(() => setLoading(false), 2000);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-all shadow-sm group disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download className={`w-4 h-4 text-gray-400 group-hover:text-sky-500 ${loading ? "animate-bounce" : ""}`} />
      {loading ? "Mengekspor..." : "Export CSV"}
    </button>
  );
}