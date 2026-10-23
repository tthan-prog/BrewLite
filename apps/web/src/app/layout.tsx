import type { Metadata, Viewport } from "next";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "BrewLite | Đặt cà phê dễ dàng", template: "%s | BrewLite" },
  description: "BrewLite - giao diện đặt đồ uống trực tuyến, đăng nhập và theo dõi đơn hàng.",
};

export const viewport: Viewport = {
  themeColor: "#176b45",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
