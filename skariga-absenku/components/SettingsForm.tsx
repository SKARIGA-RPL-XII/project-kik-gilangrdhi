"use client";

import { useState } from "react";
import { User, Lock, Save, ShieldCheck } from "lucide-react";
import { Button, Form, Input, message, Tabs, ConfigProvider, Alert } from "antd";
import { signOut } from "next-auth/react";
import { updateProfile, changePassword } from "@/app/actions/settings";

interface AdminData {
  id: number;
  nama: string;
  email: string;
}

interface ProfileValues {
  nama: string;
  email: string;
}

interface PasswordValues {
  oldPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export default function SettingsForm({ admin }: { admin: AdminData }) {
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [formProfile] = Form.useForm();
  const [formPassword] = Form.useForm();

  const onFinishProfile = async (values: ProfileValues) => {
    setLoading(true);
    const res = await updateProfile(admin.id, values);
    setLoading(false);

    if (res.success) {
      messageApi.success("Profil berhasil diperbarui!");
    } else {
      messageApi.error(res.error || "Gagal update.");
    }
  };

  const onFinishPassword = async (values: PasswordValues) => {
    setLoading(true);
    const res = await changePassword(admin.id, {
      oldPass: values.oldPassword,
      newPass: values.newPassword,
    });
    setLoading(false);

    if (res.success) {
      messageApi.success("Password berhasil diganti! Mohon login ulang...");
      setTimeout(() => {
        signOut({ callbackUrl: "/login" });
      }, 1000);
      
      formPassword.resetFields();
    } else {
      messageApi.error(res.error || "Gagal ganti password.");
    }
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#0ea5e9", borderRadius: 8 } }}>
      {contextHolder}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm min-h-125">
        <Tabs
          defaultActiveKey="1"
          size="large"
          items={[
            {
              key: '1',
              label: <span className="flex items-center gap-2"><User size={18} /> Profil Saya</span>,
              children: (
                <Form
                  form={formProfile}
                  layout="vertical"
                  initialValues={{ nama: admin.nama, email: admin.email }}
                  onFinish={onFinishProfile}
                  className="mt-4 max-w-lg"
                >
                  <Form.Item name="nama" label="Nama Lengkap" rules={[{ required: true }]}>
                    <Input size="large" prefix={<User size={18} className="text-gray-400" />} />
                  </Form.Item>

                  <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                    <Input size="large" prefix={<User size={18} className="text-gray-400" />} />
                  </Form.Item>

                  <div className="pt-4">
                    <Button type="primary" htmlType="submit" size="large" icon={<Save size={18} />} loading={loading}>
                      Simpan Profil
                    </Button>
                  </div>
                </Form>
              ),
            },
            {
              key: '2',
              label: <span className="flex items-center gap-2"><Lock size={18} /> Keamanan</span>,
              children: (
                <Form
                  form={formPassword}
                  layout="vertical"
                  onFinish={onFinishPassword}
                  className="mt-4 max-w-lg"
                >
                  <Alert 
                    title="Keamanan Akun" 
                    description="Gunakan password yang kuat (minimal 8 karakter) demi keamanan data."
                    type="info"
                    showIcon
                    className="mb-6"
                  />
                  
                  <Form.Item 
                    name="oldPassword" 
                    label="Password Lama" 
                    rules={[{ required: true, message: "Harap isi password lama" }]}
                  >
                    <Input.Password size="large" prefix={<Lock size={18} className="text-gray-400" />} />
                  </Form.Item>

                  <Form.Item 
                    name="newPassword" 
                    label="Password Baru" 
                    rules={[{ required: true, min: 6, message: "Minimal 6 karakter" }]}
                  >
                    <Input.Password size="large" prefix={<ShieldCheck size={18} className="text-gray-400" />} />
                  </Form.Item>

                  <Form.Item 
                    name="confirmPassword" 
                    label="Konfirmasi Password Baru"
                    dependencies={['newPassword']}
                    rules={[
                      { required: true, message: 'Harap ulangi password baru' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Password tidak cocok!'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password size="large" prefix={<ShieldCheck size={18} className="text-gray-400" />} />
                  </Form.Item>

                  <div className="pt-4">
                    <Button danger type="primary" htmlType="submit" size="large" icon={<Save size={18} />} loading={loading}>
                      Update Password
                    </Button>
                  </div>
                </Form>
              ),
            },
          ]}
        />
      </div>
    </ConfigProvider>
  );
}