import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="nav-wrap">
        <Link href="/" className="brand" aria-label="BrewLite trang chủ">
          <span className="brand-mark">B</span><span>BrewLite</span>
        </Link>
        <nav className="nav-links" aria-label="Điều hướng chính">
          <Link href="/#features">Giới thiệu</Link>
          <Link href="/orders/history">Đơn hàng của tôi</Link>
        </nav>
        <div className="nav-actions">
          <Link className="btn btn-outline" href="/login">Đăng nhập</Link>
          <Link className="btn btn-primary" href="/register">Tạo tài khoản</Link>
        </div>
      </div>
    </header>
  );
}
