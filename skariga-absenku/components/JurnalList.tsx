/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import {
    BookOpen, Calendar, User, CheckCircle2, Eye, ImageOff, Filter,
    Clock, LayoutList, Search
} from "lucide-react";
import { Modal, message, ConfigProvider, Popconfirm, DatePicker } from "antd";
import { approveJurnal, deleteJurnal } from "@/app/actions/jurnal";
import dayjs from "dayjs";
import 'dayjs/locale/id';
import Link from "next/link";

dayjs.locale('id');

interface JurnalData {
    id: number;
    tanggal: Date;
    isi_kegiatan: string;
    bukti_foto: string | null;
    is_approved: boolean;
    user: {
        nama: string | null;
        telegramId: string;
        company: { nama: string } | null;
    };
}

export default function JurnalList({ jurnals }: { jurnals: JurnalData[] }) {
    const [filterDate, setFilterDate] = useState<dayjs.Dayjs | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>("PENDING");

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const [messageApi, contextHolder] = message.useMessage();

    const getImageUrl = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith("http")) return path;
        if (path.startsWith("/")) return path;
        return `/uploads/${path}`;
    };

    const filteredData = jurnals.filter((item) => {
        let matchDate = true;
        if (filterDate) {
            matchDate = dayjs(item.tanggal).isSame(filterDate, 'day');
        }

        let matchStatus = true;
        if (filterStatus === "APPROVED") matchStatus = item.is_approved === true;
        if (filterStatus === "PENDING") matchStatus = item.is_approved === false;

        return matchDate && matchStatus;
    });

    const handleApprove = async (id: number) => {
        const res = await approveJurnal(id);
        if (res.success) messageApi.success("Jurnal disetujui!");
        else messageApi.error("Gagal update data.");
    };

    const handleDelete = async (id: number) => {
        const res = await deleteJurnal(id);
        if (res.success) messageApi.success("Jurnal dihapus.");
        else messageApi.error("Gagal menghapus data.");
    };

    const openImage = (url: string) => {
        setPreviewImage(url);
        setIsPreviewOpen(true);
    };

    return (
        <ConfigProvider theme={{ token: { colorPrimary: "#0ea5e9", borderRadius: 8 } }}>
            {contextHolder}

            <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex bg-slate-100/80 p-1 rounded-xl w-full md:w-auto border border-slate-200/50">
                        <button
                            onClick={() => setFilterStatus("")}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${filterStatus === ""
                                ? "bg-white text-sky-600 shadow-md ring-1 ring-black/5"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                }`}
                        >
                            <LayoutList size={14} strokeWidth={2.5} />
                            <span>Semua</span>
                        </button>
                        <button
                            onClick={() => setFilterStatus("PENDING")}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${filterStatus === "PENDING"
                                ? "bg-white text-orange-500 shadow-md ring-1 ring-black/5"
                                : "text-slate-500 hover:text-orange-600 hover:bg-slate-200/50"
                                }`}
                        >
                            <Clock size={14} strokeWidth={2.5} />
                            <span>Menunggu</span>
                        </button>
                        <button
                            onClick={() => setFilterStatus("APPROVED")}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${filterStatus === "APPROVED"
                                ? "bg-white text-emerald-600 shadow-md ring-1 ring-black/5"
                                : "text-slate-500 hover:text-emerald-600 hover:bg-slate-200/50"
                                }`}
                        >
                            <CheckCircle2 size={14} strokeWidth={2.5} />
                            <span>Disetujui</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto pr-2">
                        <DatePicker
                            size="large"
                            className="w-full md:w-56 rounded-xl border-slate-200 hover:border-sky-400 focus:border-sky-500 cursor-pointer [&_input]:cursor-pointer"
                            placeholder="Filter tanggal..."
                            format="DD MMM YYYY"
                            onChange={(date) => setFilterDate(date)}
                            allowClear
                            inputReadOnly={true}
                            suffixIcon={<Calendar size={14} className="text-slate-400" />}
                        />
                        <div className="hidden sm:flex flex-col items-end px-3 border-l border-slate-100">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total</span>
                            <span className="text-sm font-black text-sky-600">{filteredData.length}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredData.length === 0 ? (
                        <div className="col-span-full py-24 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Search size={32} className="text-slate-200" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Tidak ada jurnal ditemukan</h3>
                            <p className="text-slate-400 text-sm max-w-xs text-center mt-2">
                                Coba ubah filter status atau pilih tanggal lain untuk menemukan data yang dicari.
                            </p>
                            <button
                                onClick={() => { setFilterStatus(""); setFilterDate(null); }}
                                className="mt-6 text-sky-600 font-bold text-xs hover:bg-sky-100/80 transition-colors flex items-center gap-1.5 bg-sky-50 px-4 py-2 rounded-full border border-sky-100"
                            >
                                <Filter size={14} /> Reset Semua Filter
                            </button>
                        </div>
                    ) : (
                        filteredData.map((item) => {
                            const imageUrl = getImageUrl(item.bukti_foto);
                            return (
                                <div key={item.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col h-full">
                                    <div className={`h-1.5 ${item.is_approved ? "bg-emerald-500" : "bg-orange-400"}`} />
                                    <div className="p-5 flex-1 flex flex-col gap-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-white shadow-xs text-xs">
                                                    {item.user.nama ? item.user.nama.charAt(0).toUpperCase() : <User size={16} />}
                                                </div>
                                                <div>
                                                    <Link
                                                        href={`/users?q=${item.user.nama || ""}`}
                                                        className="font-bold text-gray-800 text-sm hover:text-sky-600 hover:underline block"
                                                    >
                                                        {item.user.nama || "Tanpa Nama"}
                                                    </Link>
                                                    {item.user.company ? (
                                                        <Link
                                                            href={`/company?q=${item.user.company.nama}`}
                                                            className="text-[11px] text-gray-400 truncate max-w-30 hover:text-sky-500 hover:underline block"
                                                        >
                                                            {item.user.company.nama}
                                                        </Link>
                                                    ) : (
                                                        <p className="text-[11px] text-gray-400 truncate max-w-30">Belum ada kantor</p>
                                                    )}
                                                </div>
                                            </div>
                                            {item.is_approved ? (
                                                <CheckCircle2 size={18} className="text-emerald-500" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
                                            )}
                                        </div>

                                        <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200/50">
                                                <div className="flex items-center gap-1.5 text-[10px] text-sky-600 font-bold uppercase tracking-wider">
                                                    <BookOpen size={12} strokeWidth={2.5} />
                                                    Catatan Jurnal
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold tracking-wider">
                                                    <Calendar size={10} />
                                                    {dayjs(item.tanggal).format('DD MMM YYYY')}
                                                </div>
                                            </div>
                                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                                                {item.isi_kegiatan}
                                            </p>
                                        </div>

                                        <div className="mt-auto">
                                            {imageUrl ? (
                                                <div
                                                    onClick={() => openImage(imageUrl)}
                                                    className="group relative h-32 w-full rounded-xl overflow-hidden cursor-pointer border border-gray-100 bg-gray-50"
                                                >
                                                    <img
                                                        src={imageUrl}
                                                        alt="Bukti"
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                        <Eye size={16} className="text-white" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-32 w-full rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 gap-1">
                                                    <ImageOff size={20} className="opacity-30" />
                                                    <span className="text-[10px] font-medium">No Photo</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {!item.is_approved && (
                                        <div className="p-3 border-t border-gray-50 bg-gray-50/30 flex gap-2">
                                            <button
                                                onClick={() => handleApprove(item.id)}
                                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-1.5 rounded-lg text-xs font-bold transition-colors"
                                            >
                                                Approve
                                            </button>
                                            <Popconfirm title="Tolak Jurnal?" onConfirm={() => handleDelete(item.id)} okText="Ya" cancelText="Tidak" okButtonProps={{ danger: true }}>
                                                <button className="flex-1 bg-white border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 py-1.5 rounded-lg text-xs font-bold transition-all">
                                                    Tolak
                                                </button>
                                            </Popconfirm>
                                        </div>
                                    )}
                                    {item.is_approved && (
                                        <div className="p-2 border-t border-gray-50 bg-gray-50/30 flex justify-end">
                                            <Popconfirm title="Hapus?" onConfirm={() => handleDelete(item.id)} okText="Hapus" okButtonProps={{ danger: true }}>
                                                <button className="text-[10px] text-gray-300 hover:text-red-400 transition-colors px-2">
                                                    Hapus Data
                                                </button>
                                            </Popconfirm>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                <Modal open={isPreviewOpen} footer={null} onCancel={() => setIsPreviewOpen(false)} centered width={550}>
                    {previewImage && <img src={previewImage} alt="Preview" className="w-full h-auto rounded-lg" />}
                </Modal>
            </div>
        </ConfigProvider>
    );
}