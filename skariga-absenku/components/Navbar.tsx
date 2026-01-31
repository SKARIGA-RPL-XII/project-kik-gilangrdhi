"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, User } from "lucide-react";
import Image from "next/image";
import Logo from "@/public/mascot.png";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/" },
    { label: "Attendance", href: "/attendance" },
    { label: "Company", href: "/company" },
    { label: "Users", href: "/users" },
  ];

  return (
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
                    className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      pathname === item.href
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

          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="relative flex rounded-full bg-linear-to-r from-sky-400 to-orange-400 p-1.5 hover:from-sky-500 hover:to-orange-500 transition shadow-md"
              >
                <span className="sr-only">Open user menu</span>
                <User className="h-5 w-5 text-white" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-xl bg-white py-1 shadow-xl ring-1 ring-black ring-opacity-5 animate-fadeIn">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">Admin</p>
                      <p className="text-xs text-gray-500 truncate">admin@skariga.sch.id</p>
                    </div>
                    <Link
                      href="/profile"
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-500 transition"
                      onClick={() => setProfileOpen(false)}
                    >
                      Your Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-500 transition"
                      onClick={() => setProfileOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition rounded-b-xl"
                      onClick={() => setProfileOpen(false)}
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
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
                className={`block rounded-lg px-4 py-3 text-base font-semibold transition ${
                  pathname === item.href
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
    </nav>
  );
}