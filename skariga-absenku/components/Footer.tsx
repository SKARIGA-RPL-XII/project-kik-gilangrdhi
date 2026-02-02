"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-linear-to-b from-sky-50 via-white to-orange-50 pt-16 pb-10 border-t border-sky-100 relative overflow-hidden">
      <div className="absolute -top-10 left-10 w-60 h-60 bg-sky-200 opacity-20 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-60 h-60 bg-orange-200 opacity-20 blur-[80px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-3xl font-bold bg-linear-to-r from-sky-600 to-orange-500 bg-clip-text text-transparent mb-6">
          Skariga AbsenKu
        </h2>

        <div className="flex flex-wrap justify-center gap-8 text-gray-600 font-medium text-sm mb-10">
          {[
            { name: "Tentang", href: "https://id.wikipedia.org/wiki/SMK_PGRI_3_Malang" },
            { name: "Kurikulum", href: "https://kurikulum.kemendikdasmen.go.id/" },
            { name: "Prestasi", href: "https://radarmalang.jawapos.com/pendidikan/816452960/smk-pgri-3-malang-sabet-emas-dan-perak-di-ajang-lks-tingkat-nasional-2025" },
            { name: "Lowongan Kerja", href: "https://bki-skariga.web.id/loker/" },
            { name: "Kerja Sama", href: "https://bki-skariga.web.id/kerjasama-industri/" }
          ].map((item) => (
            <a
              key={item.name}
              href={item.href}
              target={item.href.startsWith('http') ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="hover:text-sky-600 hover:scale-105 transition-all"
            >
              {item.name}
            </a>
          ))}
        </div>

        <div className="flex justify-center gap-6 mb-8">
          {["school", "menu_book", "groups", "workspace_premium"].map((icon) => (
            <Link key={icon} href="#" className="footer-icon group">
              <span className="material-symbols-rounded text-[28px] group-hover:text-white transition-colors">
                {icon}
              </span>
            </Link>
          ))}
        </div>

        <div className="h-px bg-linear-to-r from-transparent via-gray-300 to-transparent mb-6 opacity-60" />

        <p className="text-gray-500 text-sm">
          © {new Date().getFullYear()} SMK PGRI 3 Malang. All rights reserved.
        </p>
      </div>

      <style jsx>{`
        .footer-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          color: #64748b;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(255,255,255,0.5);
        }
        .footer-icon:hover {
          transform: translateY(-5px) rotate(6deg);
          background: linear-gradient(135deg, #38bdf8, #fb923c);
          box-shadow: 0 10px 20px rgba(56, 189, 248, 0.3);
          border-color: transparent;
        }
      `}</style>
    </footer>
  );
}