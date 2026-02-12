"use client";

import Link from "next/link";

export default function Footer() {
  const links = [
    { name: "Tentang", href: "https://id.wikipedia.org/wiki/SMK_PGRI_3_Malang" },
    { name: "Kurikulum", href: "https://kurikulum.kemendikdasmen.go.id/" },
    { name: "Prestasi", href: "https://radarmalang.jawapos.com/pendidikan/816452960/smk-pgri-3-malang-sabet-emas-dan-perak-di-ajang-lks-tingkat-nasional-2025" },
    { name: "Lowongan Kerja", href: "https://bki-skariga.web.id/loker/" },
    { name: "Kerja Sama", href: "https://bki-skariga.web.id/kerjasama-industri/" }
  ];

  return (
    <footer className="relative w-full pt-20 pb-10 bg-white border-t border-slate-200 overflow-hidden">
      <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-0.5 bg-sky-500" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-orange-500 rounded-b-lg shadow-sm" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col items-center">
        <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-slate-800">
              Skariga<span className="text-orange-500">AbsenKu</span>
              <span className="text-sky-500">.</span>
            </h2>
            <div className="flex items-center justify-center gap-3">
               <span className="h-px w-12 bg-slate-300"></span>
               <p className="text-slate-500 font-medium text-sm tracking-wide uppercase">
                  Sistem Absensi Terintegrasi
               </p>
               <span className="h-px w-12 bg-slate-300"></span>
            </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-14">
          {links.map((item) => (
            <a
              key={item.name}
              href={item.href}
              target={item.href.startsWith('http') ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 border-2 border-slate-100 bg-white hover:border-sky-500 hover:text-sky-600 hover:-translate-y-1 transition-all duration-200"
            >
              {item.name}
            </a>
          ))}
        </div>
        <div className="flex gap-6 mb-12">
          {["school", "menu_book", "groups", "workspace_premium"].map((icon, index) => (
            <Link key={index} href="#" className="group relative">
              <div className="relative flex items-center justify-center w-14 h-14 bg-white border-2 border-slate-200 rounded-xl text-slate-400 transition-all duration-300 
                group-hover:border-orange-500 group-hover:bg-orange-50 group-hover:text-orange-600 group-hover:-translate-y-1 group-hover:shadow-[4px_4px_0px_0px_rgba(249,115,22,1)]">
                
                <span className="material-symbols-rounded text-[28px]">
                  {icon}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="w-full border-t-2 border-dashed border-slate-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-500">
          <p className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-md">
            © {new Date().getFullYear()} SMK PGRI 3 Malang
          </p>
          
          <div className="flex items-center gap-6">
            <span className="hover:text-sky-600 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-sky-600 cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>

      </div>
    </footer>
  );
}