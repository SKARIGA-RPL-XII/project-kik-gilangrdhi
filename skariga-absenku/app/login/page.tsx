"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { message, Form, Input, ConfigProvider } from "antd";
import { Lock, Mail, ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Logo from "@/public/mascot.png";

interface LoginValues {
    email: string;
    password: string;
}

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    const handleLogin = async (values: LoginValues) => {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 800));

        const res = await signIn("credentials", {
            email: values.email,
            password: values.password,
            redirect: false,
        });

        if (res?.error) {
            messageApi.error("Email atau password salah!");
            setLoading(false);
        } else {
            messageApi.success("Login berhasil! Mengalihkan...");
            router.push("/");
            router.refresh();
        }
    };

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: "#0ea5e9",
                    borderRadius: 16,
                    colorBgContainer: "rgba(255, 255, 255, 0.7)",
                    colorBorder: "rgba(0, 0, 0, 0.1)",
                    colorTextPlaceholder: "rgba(0, 0, 0, 0.4)",
                    colorText: "#1f2937",
                    fontFamily: "var(--font-poppins)",
                },
                components: {
                    Input: {
                        paddingBlockLG: 12,
                        hoverBorderColor: "#38bdf8",
                        activeBorderColor: "#f97316",
                        activeShadow: "0 0 0 2px rgba(14, 165, 233, 0.1)",
                    },
                }
            }}
        >
            {contextHolder}
            <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-sky-50 via-white to-blue-50 relative overflow-hidden">
                <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-175 h-175 bg-sky-300/30 rounded-full mix-blend-multiply filter blur-[120px] opacity-60 animate-pulse-slow"></div>
                    <div className="absolute -bottom-[20%] -right-[10%] w-175 h-175 bg-orange-300/30 rounded-full mix-blend-multiply filter blur-[120px] opacity-50 animate-pulse-slow delay-1000"></div>
                    <div className="absolute top-[30%] left-[30%] w-125 h-125 bg-cyan-400/20 rounded-full mix-blend-multiply filter blur-[150px] opacity-40"></div>
                </div>
                <div className="absolute inset-0 bg-grid-slate-900/[0.02] bg-size-[30px_30px]" />
                <div className="relative z-10 w-full max-w-120 mx-4">
                    <div className="absolute -inset-3 bg-linear-to-r from-sky-400/20 to-orange-400/20 rounded-[40px] blur-2xl opacity-40"></div>
                    <div className="bg-white/70 backdrop-blur-2xl border border-white/40 p-8 sm:p-12 rounded-4xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] relative overflow-hidden">
                        <Sparkles className="absolute top-6 right-6 text-orange-400 w-6 h-6 animate-bounce-slow" />
                        <div className="text-center mb-10">
                            <div className="inline-flex p-4 bg-linear-to-tr from-sky-100 to-orange-100 rounded-2xl mb-6 ring-1 ring-black/5 shadow-lg shadow-sky-500/5 relative group">
                                <div className="absolute inset-0 bg-sky-400/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-50"></div>
                                <Image src={Logo} alt="Logo" width={64} height={64} className="w-16 h-auto relative z-10 drop-shadow-sm" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-3 tracking-tight drop-shadow-sm">
                                Selamat Datang
                            </h1>
                            <p className="text-gray-600 text-base">
                                Masuk ke Sistem Absensi Digital <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-500 to-orange-700 font-bold">Skariga</span>
                            </p>
                        </div>

                        <Form
                            name="login_form"
                            layout="vertical"
                            onFinish={handleLogin}
                            size="large"
                            className="space-y-5"
                        >
                            <Form.Item
                                name="email"
                                rules={[{ required: true, message: "Email wajib diisi!", type: "email" }]}
                            >
                                <Input
                                    prefix={<Mail className="text-sky-500 mr-3" size={20} />}
                                    placeholder="Email Admin"
                                    className="bg-white/60! border-gray-200! text-gray-800! placeholder:text-gray-400! rounded-2xl backdrop-blur-md transition-all focus:bg-white/90! hover:border-sky-400!"
                                />
                            </Form.Item>

                            <Form.Item
                                name="password"
                                rules={[{ required: true, message: "Password wajib diisi!" }]}
                            >
                                <Input.Password
                                    prefix={<Lock className="text-orange-500 mr-3" size={20} />}
                                    placeholder="Kata Sandi"
                                    className="bg-white/60! border-gray-200! text-gray-800! placeholder:text-gray-400! rounded-2xl backdrop-blur-md transition-all focus:bg-white/90! hover:border-orange-400!"
                                />
                            </Form.Item>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full group relative overflow-hidden rounded-2xl p-0.75 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-white mt-6 transition-all hover:scale-[1.02] active:scale-[0.98] ${loading ? 'opacity-80' : ''}`}
                            >
                                <span className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#0ea5e9_0%,#e0f2fe_50%,#0ea5e9_100%)]" />
                                <span className={`flex h-full w-full cursor-pointer items-center justify-center rounded-[14px] bg-linear-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 px-8 py-4 text-base font-bold text-white transition-all gap-2 relative z-10 backdrop-blur-xl shadow-md shadow-sky-500/20`}>
                                    {loading ? (
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <>
                                            Masuk Dashboard
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </span>
                            </button>
                        </Form>
                    </div>
                    <p className="text-center text-gray-500 text-sm mt-8">
                        &copy; {new Date().getFullYear()} SMK PGRI 3 Malang. Sistem Terenkripsi.
                    </p>
                </div>
            </div>
        </ConfigProvider>
    );
}