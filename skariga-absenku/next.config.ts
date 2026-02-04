import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000", 
        "192.168.110.197:3000"
      ], 
    },
  },
  
  serverExternalPackages: ["@prisma/client", "telegraf"], 
};

export default nextConfig;