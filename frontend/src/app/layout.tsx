import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BrewLite",
  description: "Đặt cà phê không dùng tiền mặt",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
