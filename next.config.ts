import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ย้ายมาไว้ด้านนอกตามที่ Log แนะนำ
  allowedDevOrigins: [
    "192.168.1.155",
    "localhost",
    "0.0.0.0",
    "planet-project.thepokkung.space",
  ],

  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  experimental: {
      serverActions: {
      allowedOrigins: [
        "192.168.1.155:3000",
        "localhost:3000",
        "0.0.0.0:3000",
        "planet-project.thepokkung.space:3000",
      ],
    }
  }
  
};

export default nextConfig;