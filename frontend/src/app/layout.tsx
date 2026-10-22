import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "BrewLite | Đặt cà phê dễ dàng", template: "%s | BrewLite" },
  description: "BrewLite - giao diện đặt đồ uống trực tuyến, đăng nhập và theo dõi đơn hàng.",
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
