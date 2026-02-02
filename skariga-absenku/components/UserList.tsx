"use client";

import { useState } from "react";
import { 
  User as UserIcon, 
  Mail, 
  Building2, 
  Check, 
  X, 
  Search, 
  Hash, 
  Filter, 
  ArrowUpDown,
  Clock,       
  History,    
  ArrowDownAZ,
  ArrowUpZA    
} from "lucide-react";
import { Modal, Button, Form, message, Select, Tag, Tabs, ConfigProvider, Popconfirm } from "antd";
import { approveUser, rejectUser, updateUserCompany } from "@/app/actions/user";

interface Company {
  id: number;
  nama: string;
}

interface UserData {
  id: number;
  telegramId: string;
  nama: string | null;
  email: string | null;
  status_akun: string;
  companyId: number | null;
  company?: Company | null;
}

interface UserFormValues {
  companyId: number;
}

const UserTable = ({ 
  data, 
  type, 
  onApprove, 
  onReject, 
  onEdit 
}: { 
  data: UserData[]; 
  type: "ACTIVE" | "PENDING";
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onEdit: (user: UserData) => void;
}) => (
  <div className="bg-white rounded-b-2xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-sky-50/50 text-gray-700 font-semibold border-b border-sky-100">
          <tr>
            <th className="px-6 py-4">User Info</th>
            <th className="px-6 py-4">Telegram ID</th>
            <th className="px-6 py-4">Perusahaan</th>
            <th className="px-6 py-4">Status Akun</th>
            <th className="px-6 py-4 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                Tidak ada user {type === "ACTIVE" ? "aktif" : "pending"} dengan filter ini.
              </td>
            </tr>
          ) : (
            data.map((user) => (
              <tr key={user.id} className="hover:bg-sky-50/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 font-bold border border-white shadow-sm">
                      {user.nama ? user.nama.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.nama || "Tanpa Nama"}</p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Mail size={12} />
                        {user.email || "-"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-gray-600 font-mono text-xs bg-gray-50 px-2 py-1 rounded w-fit border border-gray-100">
                    <Hash size={12} className="text-sky-500" />
                    {user.telegramId}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building2 size={16} className={user.company ? "text-orange-400" : "text-gray-300"} />
                    <span className="font-medium">
                      {user.company?.nama || <span className="text-gray-400 italic">Belum diset</span>}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Tag color={type === "ACTIVE" ? "green" : "gold"} className="rounded-full px-3 border-0 bg-opacity-20 font-medium capitalize">
                    {user.status_akun}
                  </Tag>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {type === "PENDING" ? (
                      <>
                        <button 
                          onClick={() => onApprove(user.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition shadow-sm border border-emerald-100 text-xs font-semibold"
                          title="Setujui"
                        >
                          <Check size={14} />
                          Approve
                        </button>
                        <Popconfirm
                          title="Tolak User?"
                          description="User ini akan dihapus permanen dari database."
                          onConfirm={() => onReject(user.id)}
                          okText="Ya, Tolak"
                          cancelText="Batal"
                          okButtonProps={{ danger: true }}
                        >
                          <button 
                            className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition shadow-sm border border-red-100"
                            title="Tolak"
                          >
                            <X size={16} />
                          </button>
                        </Popconfirm>
                      </>
                    ) : (
                      <button 
                        onClick={() => onEdit(user)}
                        className="px-3 py-1.5 text-xs font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-lg transition-all border border-sky-100"
                      >
                        Detail / Ganti Kantor
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default function UserList({ users, companies }: { users: UserData[], companies: Company[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCompany, setFilterCompany] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState("newest");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();

  const processedUsers = users
    .filter(user => 
      (user.nama && user.nama.toLowerCase().includes(searchTerm.toLowerCase())) ||
      user.telegramId.includes(searchTerm)
    )
    .filter(user => 
      filterCompany ? user.companyId === filterCompany : true
    )
    .sort((a, b) => {
      switch (sortOption) {
        case "newest": return b.id - a.id; 
        case "oldest": return a.id - b.id;
        case "az": return (a.nama || "").localeCompare(b.nama || "");
        case "za": return (b.nama || "").localeCompare(a.nama || "");
        default: return 0;
      }
    });

  const activeUsers = processedUsers.filter(u => u.status_akun === "ACTIVE");
  const pendingUsers = processedUsers.filter(u => u.status_akun === "PENDING");

  const handleApprove = async (id: number) => {
    const res = await approveUser(id);
    if (res.success) messageApi.success("User berhasil diaktifkan!");
    else messageApi.error("Gagal aktivasi user.");
  };

  const handleReject = async (id: number) => {
    const res = await rejectUser(id);
    if (res.success) messageApi.success("Permintaan user ditolak.");
    else messageApi.error("Gagal menolak user.");
  };

  const handleEditClick = (user: UserData) => {
    setEditingUser(user);
    form.setFieldsValue({ companyId: user.companyId });
    setIsModalOpen(true);
  };

  const onFinish = async (values: UserFormValues) => {
    if (!editingUser) return;
    const res = await updateUserCompany(editingUser.id, Number(values.companyId));
    if (res.success) {
      messageApi.success("Perusahaan user berhasil diperbarui!");
      setIsModalOpen(false);
    } else {
      messageApi.error("Gagal update data.");
    }
  };

  const sortOptions = [
    { 
      value: "newest", 
      label: (
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-sky-500" />
          <span>Terbaru</span>
        </div>
      )
    },
    { 
      value: "oldest", 
      label: (
        <div className="flex items-center gap-2">
          <History size={16} className="text-orange-500" />
          <span>Terlama</span>
        </div>
      )
    },
    { 
      value: "az", 
      label: (
        <div className="flex items-center gap-2">
          <ArrowDownAZ size={16} className="text-emerald-500" />
          <span>Nama (A-Z)</span>
        </div>
      )
    },
    { 
      value: "za", 
      label: (
        <div className="flex items-center gap-2">
          <ArrowUpZA size={16} className="text-red-500" />
          <span>Nama (Z-A)</span>
        </div>
      )
    },
  ];

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
              className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-sky-100 focus:border-sky-400 outline-none transition-all shadow-sm"
              placeholder="Cari Nama atau Telegram ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-full md:w-64">
            <Select
              className="w-full h-10.5"
              placeholder={
                <div className="flex items-center gap-2 text-gray-500">
                  <Filter size={16} /> Filter Kantor
                </div>
              }
              allowClear
              onChange={(val) => setFilterCompany(val)}
              options={companies.map(c => ({ label: c.nama, value: c.id }))}
              size="large"
            />
          </div>
          
          <div className="w-full md:w-48">
             <Select
              className="w-full h-10.5"
              defaultValue="newest"
              onChange={(val) => setSortOption(val)}
              size="large"
              suffixIcon={<ArrowUpDown size={16} className="text-gray-400" />}
              options={sortOptions}
            />
          </div>
        </div>

        <div className="bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
          <Tabs
            defaultActiveKey="active"
            type="card"
            size="large"
            items={[
              {
                key: 'active',
                label: (
                  <div className="flex items-center gap-2 px-4">
                    <UserIcon size={16} />
                    <span>User Aktif</span>
                    <span className="bg-sky-100 text-sky-600 text-xs px-2 py-0.5 rounded-full font-bold ml-1">{activeUsers.length}</span>
                  </div>
                ),
                children: (
                  <UserTable 
                    data={activeUsers} type="ACTIVE" 
                    onApprove={handleApprove} onReject={handleReject} onEdit={handleEditClick}
                  />
                ),
              },
              {
                key: 'pending',
                label: (
                  <div className="flex items-center gap-2 px-4">
                    <div className="relative">
                      <Mail size={16} />
                      {pendingUsers.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    <span>Request Pending</span>
                    <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full font-bold ml-1">{pendingUsers.length}</span>
                  </div>
                ),
                children: (
                  <UserTable 
                    data={pendingUsers} type="PENDING" 
                    onApprove={handleApprove} onReject={handleReject} onEdit={handleEditClick}
                  />
                ),
              },
            ]}
          />
        </div>

        <Modal
          title={
            <div className="flex items-center gap-2 text-lg font-bold text-gray-800 pb-2 border-b border-gray-100">
              <UserIcon className="w-5 h-5 text-sky-500" />
              Detail User
            </div>
          }
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
          centered
        >
          {editingUser && (
            <div className="mt-4 space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-gray-500 text-xs uppercase font-bold">Nama User</span>
                  <span className="text-gray-800 font-medium">{editingUser.nama || "-"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-gray-500 text-xs uppercase font-bold">Telegram ID</span>
                  <span className="text-gray-800 font-mono text-sm bg-white px-2 rounded border border-gray-200">{editingUser.telegramId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-gray-500 text-xs uppercase font-bold">Email</span>
                  <span className="text-gray-800 text-sm">{editingUser.email || "-"}</span>
                </div>
                 <div className="flex justify-between">
                  <span className="text-gray-500 text-xs uppercase font-bold">Status Akun</span>
                  <Tag color="green">{editingUser.status_akun}</Tag>
                </div>
              </div>

              <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item 
                  name="companyId" 
                  label={<span className="font-semibold text-gray-700">Tempatkan di Perusahaan (Kantor)</span>}
                  rules={[{ required: true, message: 'Harap pilih perusahaan' }]}
                >
                  <Select 
                    size="large" 
                    placeholder="Pilih kantor user ini..." 
                    options={companies.map(c => ({ label: c.nama, value: c.id }))}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <Button onClick={() => setIsModalOpen(false)}>Tutup</Button>
                  <Button type="primary" htmlType="submit">Simpan Perubahan</Button>
                </div>
              </Form>
            </div>
          )}
        </Modal>

      </div>
    </ConfigProvider>
  );
}