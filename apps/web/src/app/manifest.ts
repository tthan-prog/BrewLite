import type { MetadataRoute } from "next";

// PWA cơ bản: trình duyệt cho phép "Thêm vào màn hình chính". Chưa có service worker/offline.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BrewLite",
    short_name: "BrewLite",
    description: "Đặt đồ uống, thanh toán và theo dõi đơn hàng BrewLite.",
    start_url: "/menu",
    display: "standalone",
    background_color: "#f7f8fa",
    theme_color: "#176b45",
    lang: "vi",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
