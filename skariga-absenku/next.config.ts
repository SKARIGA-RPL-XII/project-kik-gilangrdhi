import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Hilangkan warning "Cross origin" saat akses via HP/IP WiFi
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000", 
        "192.168.110.197:3000" // Sesuaikan dengan IP WiFi-mu jika berubah
      ], 
    },
  },
  
  // 2. Mencegah error build karena library backend ini
  serverExternalPackages: ["@prisma/client", "telegraf"], 
};

export default nextConfig;