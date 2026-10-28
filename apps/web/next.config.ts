import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Cho phép mở bản dev từ thiết bị khác trong mạng LAN (vd điện thoại quét QR):
  // đặt DEV_ORIGINS=10.0.0.5 trong .env.local (nhiều địa chỉ cách nhau bằng dấu phẩy).
  allowedDevOrigins: (process.env.DEV_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
