/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import {
    BookOpen, Calendar, User, Search, CheckCircle2, XCircle, Eye, ImageOff, Filter, Clock,
} from "lucide-react";
import { Modal, message, Select, ConfigProvider, Popconfirm } from "antd";
import { approveJurnal, deleteJurnal } from "@/app/actions/jurnal";

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
    const [searchTerm, setSearchTerm] = useState("");
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

    // --- LOGIKA FILTER ---
    const filteredData = jurnals.filter((item) => {
        const matchSearch =
            (item.user.nama && item.user.nama.toLowerCase().includes(searchTerm.toLowerCase())) ||
            item.isi_kegiatan.toLowerCase().includes(searchTerm.toLowerCase());

        let matchStatus = true;
        if (filterStatus === "APPROVED") matchStatus = item.is_approved === true;
        if (filterStatus === "PENDING") matchStatus = item.is_approved === false;

        return matchSearch && matchStatus;
    });

    const handleApprove = async (id: number) => {
        const res = await approveJurnal(id);
        if (res.success) messageApi.success("Jurnal disetujui!");
        else messageApi.error("Gagal update data.");
    };

    const handleDelete = async (id: number) => {
        const res = await deleteJurnal(id);
        if (res.success) messageApi.success("Jurnal dihapus/ditolak.");
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
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 transition-all shadow-sm"
                            placeholder="Cari Nama Siswa atau Isi Kegiatan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="w-full md:w-48">
                        <Select
                            className="w-full h-10.5"
                            value={filterStatus}
                            onChange={(val) => setFilterStatus(val)}
                            options={[
                                {
                                    value: "",
                                    label: (
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Filter size={16} />
                                            <span>Semua</span>
                                        </div>
                                    )
                                },
                                {
                                    value: "PENDING",
                                    label: (
                                        <div className="flex items-center gap-2 text-orange-500 font-medium">
                                            <Clock size={16} />
                                            <span>Menunggu</span>
                                        </div>
                                    )
                                },
                                {
                                    value: "APPROVED",
                                    label: (
                                        <div className="flex items-center gap-2 text-emerald-600 font-medium">
                                            <CheckCircle2 size={16} />
                                            <span>Disetujui</span>
                                        </div>
                                    )
                                },
                            ]}
                        />
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredData.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300">
                            <div className="flex flex-col items-center text-gray-400 gap-2">
                                <BookOpen size={48} className="opacity-20" />
                                <p>Tidak ada jurnal yang ditemukan.</p>
                            </div>
                        </div>
                    ) : (
                        filteredData.map((item) => {
                            const imageUrl = getImageUrl(item.bukti_foto);

                            return (
                                <div key={item.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col h-full">

                                    <div className={`h-2 ${item.is_approved ? "bg-emerald-500" : "bg-orange-400"}`} />
                                    <div className="p-5 flex-1 flex flex-col gap-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-white shadow-sm">
                                                    {item.user.nama ? item.user.nama.charAt(0).toUpperCase() : <User size={18} />}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-800 text-sm">{item.user.nama || "Tanpa Nama"}</h3>
                                                    <p className="text-xs text-gray-500 truncate max-w-37.5">{item.user.company?.nama || "Belum ada kantor"}</p>
                                                </div>
                                            </div>
                                            {item.is_approved ? (
                                                <div className="text-emerald-500 bg-emerald-50 p-1.5 rounded-full" title="Disetujui">
                                                    <CheckCircle2 size={18} />
                                                </div>
                                            ) : (
                                                <div className="text-orange-400 bg-orange-50 p-1.5 rounded-full animate-pulse" title="Menunggu Review">
                                                    <div className="w-4 h-4 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                                                <Calendar size={12} />
                                                {new Date(item.tanggal).toLocaleDateString("id-ID", {
                                                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                                                })}
                                            </div>
                                            <p className="text-gray-700 text-sm leading-relaxed line-clamp-4">
                                                {item.isi_kegiatan}
                                            </p>
                                        </div>
                                        <div className="mt-auto">
                                            {imageUrl ? (
                                                <div
                                                    onClick={() => openImage(imageUrl)}
                                                    className="group relative h-40 w-full rounded-xl overflow-hidden cursor-pointer border border-gray-200 bg-gray-100"
                                                >
                                                    <img
                                                        src={imageUrl}
                                                        alt="Bukti Kegiatan"
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            e.currentTarget.parentElement?.classList.add('hidden');
                                                            e.currentTarget.src = "https://placehold.co/600x400?text=Error+Load";
                                                            e.currentTarget.style.display = 'block';
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                        <div className="bg-white/90 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                                            <Eye size={16} className="text-gray-700" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-40 w-full rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
                                                    <div className="p-3 bg-white rounded-full shadow-sm">
                                                        <ImageOff size={24} className="opacity-50" />
                                                    </div>
                                                    <span className="text-xs font-medium">Tidak ada foto bukti</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {!item.is_approved && (
                                        <div className="p-3 border-t border-gray-100 bg-gray-50/50 flex gap-2">
                                            <button
                                                onClick={() => handleApprove(item.id)}
                                                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm shadow-emerald-200"
                                            >
                                                <CheckCircle2 size={16} /> Approve
                                            </button>

                                            <Popconfirm
                                                title="Tolak Jurnal?"
                                                description="Data ini akan dihapus permanen."
                                                onConfirm={() => handleDelete(item.id)}
                                                okText="Ya, Tolak"
                                                cancelText="Batal"
                                                okButtonProps={{ danger: true }}
                                            >
                                                <button className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-500 hover:border-red-200 py-2 rounded-lg text-sm font-medium transition-all">
                                                    <XCircle size={16} /> Tolak
                                                </button>
                                            </Popconfirm>
                                        </div>
                                    )}

                                    {item.is_approved && (
                                        <div className="p-3 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                                            <Popconfirm
                                                title="Hapus Jurnal?"
                                                description="Data jurnal ini akan dihapus."
                                                onConfirm={() => handleDelete(item.id)}
                                                okText="Hapus"
                                                cancelText="Batal"
                                                okButtonProps={{ danger: true }}
                                            >
                                                <button className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1">
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

                <Modal
                    open={isPreviewOpen}
                    footer={null}
                    onCancel={() => setIsPreviewOpen(false)}
                    centered
                    width={600}
                    className="[&_.ant-modal-content]:p-0! [&_.ant-modal-content]:overflow-hidden! [&_.ant-modal-content]:rounded-2xl!"
                >
                    {previewImage && (
                        <div className="relative bg-black flex items-center justify-center min-h-75">
                            <img
                                src={previewImage}
                                alt="Full Preview"
                                className="w-full h-auto max-h-[80vh] object-contain"
                            />
                        </div>
                    )}
                </Modal>

            </div>
        </ConfigProvider>
    );
}