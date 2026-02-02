"use client";

import { useState } from "react";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Map as MapIcon
} from "lucide-react";
import { Modal, Tag } from "antd";
import Pagination from "@/components/Pagination";

type AbsensiWithUser = {
  id: number;
  userId: string;
  tanggal: Date;
  jam_masuk: Date;
  jam_keluar: Date | null;
  lat_masuk: number;
  long_masuk: number;
  status: string;
  user: {
    nama: string | null;
  } | null;
};

interface AttendanceTableProps {
  data: AbsensiWithUser[];
  totalItems: number;
  page: number;
  limit: number;
}

export default function AttendanceTable({ data, totalItems, page, limit }: AttendanceTableProps) {
  const [selectedItem, setSelectedItem] = useState<AbsensiWithUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenDetail = (item: AbsensiWithUser) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedItem(null), 300);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-sky-50/50 text-gray-700 font-semibold border-b border-sky-100">
            <tr>
              <th className="px-6 py-4">Siswa</th>
              <th className="px-6 py-4">Tanggal & Waktu</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Lokasi</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-gray-300" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-900 font-medium">Data tidak ditemukan</p>
                      <p className="text-xs">Coba ubah kata kunci pencarian atau filter tanggal.</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const statusRaw = item.status ? item.status.toUpperCase() : "UNKNOWN";
                const isLate = statusRaw.includes("TERLAMBAT");
                const isOnTime = statusRaw.includes("TEPAT") || statusRaw.includes("HADIR");

                return (
                  <tr key={item.id} className="hover:bg-sky-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-sky-100 to-sky-200 flex items-center justify-center text-sky-600 font-bold shadow-sm ring-2 ring-white">
                          {item.user?.nama ? item.user.nama.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-sky-600 transition-colors">
                            {item.user?.nama || "Tanpa Nama"}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">{item.userId}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="w-3.5 h-3.5 text-orange-400" />
                          <span className="font-medium">
                            {new Date(item.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 text-xs">
                          <Clock className="w-3.5 h-3.5 text-sky-400" />
                          <span>
                            {new Date(item.jam_masuk).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border shadow-sm ${
                        isLate
                          ? "bg-orange-50 text-orange-700 border-orange-200"
                          : isOnTime
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-50 text-gray-700 border-gray-200"
                      }`}>
                        {isLate && <AlertCircle className="w-3.5 h-3.5 text-orange-500" />}
                        {isOnTime && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                        {!isLate && !isOnTime && <Clock className="w-3.5 h-3.5 text-gray-400" />}
                        {item.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100 w-fit text-gray-500 font-mono group-hover:border-gray-200 transition-colors">
                        <MapPin className="w-3 h-3 text-red-400" />
                        <span>{item.lat_masuk.toFixed(4)}, {item.long_masuk.toFixed(4)}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleOpenDetail(item)}
                        className="text-sky-600 hover:text-sky-700 hover:bg-sky-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination totalItems={totalItems} currentPage={page} limit={limit} />

      <Modal
        title={
          <div className="flex items-center gap-2 text-lg font-bold text-gray-800 pb-2 border-b border-gray-100">
            <User className="w-5 h-5 text-sky-500" />
            Detail Absensi
          </div>
        }
        open={isModalOpen}
        onCancel={handleCloseDetail}
        footer={null}
        centered
        width={500}
      >
        {selectedItem && (
          <div className="space-y-6 pt-4">
            
            <div className="flex items-center gap-4 bg-sky-50 p-4 rounded-xl border border-sky-100">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-sky-600 text-xl font-bold shadow-sm">
                {selectedItem.user?.nama ? selectedItem.user.nama.charAt(0).toUpperCase() : "?"}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">{selectedItem.user?.nama || "Tanpa Nama"}</h3>
                <p className="text-sm text-gray-500 font-mono">ID: {selectedItem.userId}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Tanggal</p>
                <div className="flex items-center gap-2 text-gray-700 font-medium">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  {new Date(selectedItem.tanggal).toLocaleDateString("id-ID", { dateStyle: 'long' })}
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Status</p>
                <Tag color={selectedItem.status.includes("TERLAMBAT") ? "orange" : "success"} className="px-3 py-1 text-sm rounded-full">
                  {selectedItem.status}
                </Tag>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Jam Masuk</p>
                <div className="flex items-center gap-2 text-gray-700 font-medium">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  {new Date(selectedItem.jam_masuk).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

               <div className="space-y-1">
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Jam Keluar</p>
                <div className="flex items-center gap-2 text-gray-700 font-medium">
                  <Clock className="w-4 h-4 text-red-400" />
                  {selectedItem.jam_keluar 
                    ? new Date(selectedItem.jam_keluar).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }) 
                    : "-"}
                </div>
              </div>
            </div>

            <div className="space-y-2">
               <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider flex items-center gap-1">
                  <MapIcon className="w-3.5 h-3.5" /> Lokasi Masuk
               </p>
               <div className="bg-gray-100 rounded-xl p-3 text-sm text-gray-600 font-mono border border-gray-200 flex justify-between items-center">
                  <span>{selectedItem.lat_masuk}, {selectedItem.long_masuk}</span>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${selectedItem.lat_masuk},${selectedItem.long_masuk}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-sky-600 hover:underline text-xs font-semibold"
                  >
                    Buka di Maps ↗
                  </a>
               </div>
            </div>

          </div>
        )}
      </Modal>
    </div>
  );
}