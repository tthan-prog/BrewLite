import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

// IPv4 mạng nội bộ của máy này: cho phép điện thoại cùng Wi-Fi mở bản dev (Next chặn origin lạ).
function lanAddresses(): string[] {
  const out: string[] = [];
  for (const list of Object.values(networkInterfaces())) {
    for (const a of list ?? []) {
      if (a.family === "IPv4" && !a.internal) out.push(a.address);
    }
  }
  return out;
}

const nextConfig: NextConfig = {
  /* config options here */
  // Cho phép mở bản dev từ thiết bị khác trong mạng LAN (vd điện thoại quét QR):
  // Tự thêm mọi IP LAN của máy; DEV_ORIGINS (nhiều địa chỉ cách nhau bằng dấu phẩy) chỉ để thêm tay.
  allowedDevOrigins: [
    ...lanAddresses(),
    ...(process.env.DEV_ORIGINS ?? "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
  ],
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
