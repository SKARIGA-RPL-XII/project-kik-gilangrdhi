"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  totalItems: number;
  currentPage: number;
  limit: number;
}

export default function Pagination({ totalItems, currentPage, limit }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const totalPages = Math.ceil(totalItems / limit);

  const createPageURL = (pageNumber: number | string, newLimit?: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    if (newLimit) params.set("limit", newLimit.toString());
    return `${pathname}?${params.toString()}`;
  };

  const handleLimitChange = (newLimit: number) => {
    router.push(createPageURL(1, newLimit));
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalItems);

  return (
    <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>
          Menampilkan <span className="font-semibold text-gray-900">{startItem}-{endItem}</span> dari <span className="font-semibold text-gray-900">{totalItems}</span> data
        </span>
        
        <div className="flex items-center gap-2">
          <span>Tampil:</span>
          <select
            value={limit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block p-1 outline-none"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push(createPageURL(currentPage - 1))}
          disabled={currentPage <= 1}
          className="flex items-center justify-center px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Prev
        </button>
        
        <span className="text-sm font-medium text-gray-700 px-2">
          Hal {currentPage} / {totalPages || 1}
        </span>

        <button
          onClick={() => router.push(createPageURL(currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="flex items-center justify-center px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
}