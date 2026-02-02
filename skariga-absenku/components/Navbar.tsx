"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Menu, X, User, Settings, LogOut, ChevronDown, AlertTriangle } from "lucide-react"; // Tambah AlertTriangle
import { signOut } from "next-auth/react";
import Image from "next/image";
import Logo from "@/public/mascot.png";
import { Modal, ConfigProvider, Button } from "antd"; // Import Modal & ConfigProvider

interface NavbarProps {
    user?: {
        nama: string | null;
        email: string | null;
        role: string;
    } | null;
}

export default function Navbar({ user }: NavbarProps) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);

    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        setLogoutLoading(true);
        await signOut({ callbackUrl: "/login" });
    };

    const navItems = [
        { label: "Dashboard", href: "/" },
        { label: "Attendance", href: "/attendance" },
        { label: "Jurnal", href: "/jurnal" },
        { label: "Company", href: "/company" },
        { label: "Users", href: "/users" },
    ];

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: "#ef4444",
                    borderRadius: 8,
                }
            }}
        >
            <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm border-b-4 border-sky-400">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="relative flex h-20 items-center justify-between">
                        <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                            <button
                                type="button"
                                onClick={() => setMobileOpen(!mobileOpen)}
                                className="relative inline-flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-sky-50 hover:text-sky-500 transition"
                            >
                                <span className="sr-only">Open main menu</span>
                                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                        <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                            <div className="flex shrink-0 items-center">
                                <Link href="/">
                                    <Image
                                        src={Logo}
                                        alt="Skariga AbsenKu"
                                        width={50}
                                        height={50}
                                        className="h-12 w-auto hover:scale-105 transition-transform duration-200"
                                        priority
                                    />
                                </Link>
                            </div>

                            <div className="hidden sm:ml-10 sm:flex sm:items-center">
                                <div className="flex space-x-1">
                                    {navItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${pathname === item.href
                                                    ? "bg-linear-to-r from-sky-400 to-sky-500 text-white shadow-lg shadow-sky-200"
                                                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-500"
                                                }`}
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="relative ml-4" ref={profileRef}>
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="group flex items-center gap-2 outline-none transition-all"
                            >
                                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-tr from-sky-400 to-blue-600 shadow-lg shadow-sky-200 transition-transform duration-300 group-hover:scale-105 group-active:scale-95 ring-2 ring-white">
                                    {user?.nama ? (
                                        <span className="text-white font-bold">{user.nama.charAt(0).toUpperCase()}</span>
                                    ) : (
                                        <User className="h-5 w-5 text-white" />
                                    )}
                                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white"></span>
                                </div>

                                <ChevronDown
                                    size={16}
                                    className={`text-gray-400 transition-transform duration-300 ${profileOpen ? "rotate-180 text-sky-500" : "group-hover:text-gray-600"
                                        }`}
                                />
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 top-full z-50 mt-3 w-64 origin-top-right transform rounded-2xl bg-white/90 p-2 shadow-2xl shadow-sky-100 ring-1 ring-gray-100 backdrop-blur-xl transition-all duration-200 animate-in fade-in zoom-in-95 slide-in-from-top-2">

                                    <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-sky-50 to-white p-4 mb-2 border border-sky-100">
                                        <p className="font-bold text-gray-800 truncate">{user?.nama || "Admin"}</p>
                                        <p className="text-xs text-gray-500 font-medium truncate">
                                            {user?.email || "admin@skariga.sch.id"}
                                        </p>
                                        <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-sky-200/30 blur-xl"></div>
                                    </div>

                                    <div className="space-y-1">
                                        <Link
                                            href="/settings"
                                            onClick={() => setProfileOpen(false)}
                                            className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 hover:bg-sky-50 hover:text-sky-600 transition-all"
                                        >
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 group-hover:bg-sky-200 group-hover:text-sky-600 transition-colors">
                                                <Settings size={16} />
                                            </div>
                                            <span className="group-hover:translate-x-1 transition-transform">Pengaturan Akun</span>
                                        </Link>

                                        <button
                                            onClick={() => {
                                                setProfileOpen(false);
                                                setIsLogoutModalOpen(true);
                                            }}
                                            className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
                                        >
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 group-hover:bg-red-200 group-hover:text-red-600 transition-colors">
                                                <LogOut size={16} />
                                            </div>
                                            <span className="group-hover:translate-x-1 transition-transform">Keluar Aplikasi</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {mobileOpen && (
                    <div className="sm:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100 absolute w-full shadow-lg">
                        <div className="space-y-1 px-4 pb-4 pt-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`block rounded-lg px-4 py-3 text-base font-semibold transition ${pathname === item.href
                                            ? "bg-linear-to-r from-sky-400 to-sky-500 text-white shadow-md"
                                            : "text-gray-700 hover:bg-orange-50 hover:text-orange-500"
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <Modal
                    open={isLogoutModalOpen}
                    title={null}
                    footer={null}
                    onCancel={() => setIsLogoutModalOpen(false)}
                    centered
                    width={400}
                    className="rounded-2xl overflow-hidden"
                >
                    <div className="flex flex-col items-center text-center pt-4 pb-2">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-500 animate-in zoom-in duration-300">
                            <AlertTriangle size={32} />
                        </div>

                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                            Konfirmasi Keluar
                        </h3>
                        <p className="text-gray-500 text-sm mb-8 px-4">
                            Apakah Anda yakin ingin keluar dari aplikasi? Sesi Anda akan diakhiri.
                        </p>

                        <div className="flex w-full gap-3">
                            <Button
                                size="large"
                                className="flex-1 rounded-xl h-12 text-gray-600 font-medium"
                                onClick={() => setIsLogoutModalOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="primary"
                                danger
                                size="large"
                                className="flex-1 rounded-xl h-12 font-semibold shadow-lg shadow-red-200"
                                loading={logoutLoading}
                                onClick={handleLogout}
                            >
                                Ya, Keluar
                            </Button>
                        </div>
                    </div>
                </Modal>

            </nav>
        </ConfigProvider>
    );
}