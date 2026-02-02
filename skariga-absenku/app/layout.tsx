/* eslint-disable @next/next/no-page-custom-font */
/* eslint-disable @next/next/google-font-display */
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Poppins } from "next/font/google";
import { getServerSession } from "next-auth"; 
import { authOptions } from "@/src/lib/authOptions";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata = {
  title: "Skariga AbsenKu",
  description: "Sistem Absensi Modern SMK PGRI 3 Malang",
};

interface NavbarUser {
  nama: string | null;
  email: string | null;
  role: string;
}

interface SessionUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  const session = await getServerSession(authOptions);
  
  let user: NavbarUser | null = null;
  
  if (session?.user) {
    const sessionUser = session.user as SessionUser;

    user = {
      nama: sessionUser.name || null,
      email: sessionUser.email || null,
      role: sessionUser.role || "USER",
    };
  }

  return (
    <html lang="id">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@48,400,0,0"
          rel="stylesheet"
        />
      </head>
      <body className={`${poppins.className} bg-gray-50 text-gray-800`}>
        
        {user && <Navbar user={user} />}

        <main className={user ? "pt-20 min-h-screen" : "min-h-screen"}>
          {children}
        </main>

        {user && <Footer />}
      </body>
    </html>
  );
}