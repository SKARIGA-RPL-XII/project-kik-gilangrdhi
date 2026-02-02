"use client";

import { useState } from "react";
import { Building2, MapPin, Edit, Trash2, Save, Plus } from "lucide-react";
import { Modal, Input, Button, Form, message, ConfigProvider } from "antd";
import dynamic from "next/dynamic";
import { updateCompany, deleteCompany, createCompany } from "@/app/actions/company";
import ConfirmDelete from "@/components/ConfirmDelete";
import CompanyToolbar from "@/components/CompanyToolbar";

const CompanyMap = dynamic(() => import("./CompanyMap"), { ssr: false });

interface Company {
  id: number;
  nama: string;
  deskripsi: string | null;
  alamat: string | null;
  latitude: number;
  longitude: number;
  radius: number;
}

interface CompanyFormValues {
  nama: string;
  deskripsi?: string;
  alamat: string;
  radius: string | number;
}

export default function CompanyList({ companies }: { companies: Company[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const defaultLat = -7.952086;
  const defaultLng = 112.612502;

  const [tempLat, setTempLat] = useState(defaultLat);
  const [tempLng, setTempLng] = useState(defaultLng);
  const [tempRadius, setTempRadius] = useState(100);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAdd = () => {
    setEditingCompany(null); 
    setTempLat(defaultLat);
    setTempLng(defaultLng);
    setTempRadius(100);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setTempLat(company.latitude);
    setTempLng(company.longitude);
    setTempRadius(company.radius);
    
    form.setFieldsValue({
      nama: company.nama,
      deskripsi: company.deskripsi,
      alamat: company.alamat,
      radius: company.radius,
    });
    setIsModalOpen(true);
  };

  const onFinish = async (values: CompanyFormValues) => {
    const payload = {
      ...values,
      latitude: tempLat,
      longitude: tempLng,
      radius: Number(values.radius),
    };

    let res;

    if (editingCompany) {
      res = await updateCompany(editingCompany.id, payload);
    } else {
      res = await createCompany(payload);
    }

    if (res.success) {
      messageApi.success(editingCompany ? "Berhasil diperbarui!" : "Perusahaan berhasil dibuat!");
      setIsModalOpen(false);
    } else {
      messageApi.error("Gagal menyimpan data");
    }
  };

  const openDeleteModal = (id: number) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    const res = await deleteCompany(deleteId);
    setIsDeleting(false);

    if (res.success) {
      messageApi.success("Perusahaan berhasil dihapus.");
      setIsDeleteOpen(false);
      setDeleteId(null);
    } else {
      messageApi.error("Gagal menghapus data.");
    }
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#0ea5e9", borderRadius: 8 } }}>
      {contextHolder}

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="text-gray-500 text-sm hidden md:block">
            Total {companies.length} perusahaan terdaftar
          </div>
          <button
            onClick={handleAdd}
            className="group relative flex items-center gap-2 px-6 py-3 bg-linear-to-r from-sky-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-sky-200 hover:shadow-sky-300 hover:scale-[1.02] active:scale-95 transition-all duration-200"
          >
            <div className="bg-white/20 p-1 rounded-lg group-hover:bg-white/30 transition-colors">
              <Plus size={18} className="text-white" />
            </div>
            <span>Tambah Perusahaan</span>
          </button>
        </div>
        
         <CompanyToolbar />
         
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {companies.map((company) => (
            <div key={company.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <div className="h-24 bg-linear-to-r from-sky-400 to-sky-600 relative">
                <div className="absolute -bottom-8 left-6">
                  <div className="w-20 h-20 bg-white rounded-2xl p-1 shadow-lg">
                    <div className="w-full h-full bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                      <Building2 size={32} />
                    </div>
                  </div>
                </div>
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEdit(company)}
                    className="p-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/40 transition"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => openDeleteModal(company.id)}
                    className="p-2 bg-white/20 backdrop-blur-sm text-red-100 rounded-lg hover:bg-red-500/50 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="pt-10 px-6 pb-6 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{company.nama}</h3>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">{company.deskripsi || "Tidak ada deskripsi."}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <MapPin className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="block font-medium text-gray-800 mb-1">Alamat Kantor</span>
                      {company.alamat || "Belum diatur"}
                      <div className="text-xs text-gray-400 mt-1 font-mono">
                        {company.latitude.toFixed(6)}, {company.longitude.toFixed(6)} • Radius: {company.radius}m
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Modal
          title={
            <div className="text-lg font-bold">
              {editingCompany ? "Edit Perusahaan" : "Tambah Perusahaan Baru"}
            </div>
          }
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
          width={700}
          centered
          styles={{ 
            body: { maxHeight: '65vh', overflowY: 'auto', paddingRight: '10px' } 
          }}
        >
          <Form form={form} layout="vertical" onFinish={onFinish} className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item name="nama" label="Nama Perusahaan" rules={[{ required: true, message: 'Wajib diisi' }]}>
                <Input size="large" placeholder="Contoh: PT. Sukses Jaya" />
              </Form.Item>
              <Form.Item name="radius" label="Radius Validasi (Meter)" rules={[{ required: true, message: 'Wajib diisi' }]}>
                <Input type="number" size="large" onChange={(e) => setTempRadius(Number(e.target.value))} placeholder="100" />
              </Form.Item>
            </div>

            <Form.Item name="deskripsi" label="Deskripsi Singkat">
              <Input.TextArea rows={2} placeholder="Keterangan singkat tentang perusahaan..." />
            </Form.Item>

            <Form.Item name="alamat" label="Alamat Lengkap" rules={[{ required: true, message: 'Wajib diisi' }]}>
              <Input.TextArea rows={2} placeholder="Jl. Raya..." />
            </Form.Item>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titik Lokasi Kantor
                <span className="text-xs font-normal text-gray-400 ml-2">(Geser peta / klik lokasi)</span>
              </label>
              
              <CompanyMap 
                lat={tempLat} 
                lng={tempLng} 
                radius={tempRadius}
                setLat={setTempLat} 
                setLng={setTempLng} 
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button type="primary" htmlType="submit" icon={<Save size={16} />}>
                {editingCompany ? "Simpan Perubahan" : "Buat Perusahaan"}
              </Button>
            </div>
          </Form>
        </Modal>

        <ConfirmDelete
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Hapus Perusahaan?"
          description="Tindakan ini tidak dapat dibatalkan. Data absensi dan user yang terkait dengan perusahaan ini mungkin akan mengalami error atau ikut terhapus."
          isLoading={isDeleting}
        />

      </div>
    </ConfigProvider>
  );
}