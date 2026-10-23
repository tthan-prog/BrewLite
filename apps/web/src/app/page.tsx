import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="container hero">
        <div>
          <span className="eyebrow">Cà phê ngon, ngày thêm vui</span>
          <h1>Một chút cà phê.<br /><span>Một ngày tuyệt vời.</span></h1>
          <p className="hero-copy">BrewLite giúp bạn đặt món yêu thích nhanh chóng, quản lý đơn hàng rõ ràng và dành nhiều thời gian hơn cho điều bạn thích.</p>
          <div className="hero-actions">
            <Link href="/register" className="btn btn-primary">Bắt đầu ngay</Link>
            <Link href="/orders/history" className="btn btn-outline">Theo dõi đơn hàng</Link>
          </div>
          <div className="health-box"><span className="health-dot" /> API backend có thể được kiểm tra khi backend đang chạy tại cổng 3001.</div>
        </div>
        <div className="hero-art" aria-label="Minh họa cốc cà phê BrewLite" role="img">
          <span className="art-leaf" /><span className="art-bean bean-one" /><span className="art-bean bean-two" /><span className="cup-handle" /><span className="cup" />
        </div>
      </section>
      <section className="container section" id="features">
        <div className="section-head"><div><h2>Đơn giản từ ngụm đầu tiên</h2><p>Những chức năng nền tảng đang được phát triển cho BrewLite.</p></div></div>
        <div className="feature-grid">
          <article className="feature-card"><h3>Tài khoản của bạn</h3><p>Đăng ký và đăng nhập để chuẩn bị cho quy trình đặt hàng cá nhân.</p><Link className="text-link" href="/register">Tạo tài khoản</Link></article>
          <article className="feature-card"><h3>Xác nhận đơn hàng</h3><p>Xem mã đơn và trạng thái đơn sau khi backend hoàn tất API đặt hàng.</p><Link className="text-link" href="/orders/confirmation">Xem trang xác nhận</Link></article>
          <article className="feature-card"><h3>Lịch sử đơn hàng</h3><p>Tra cứu đơn đã đặt qua API được bảo vệ của tài khoản.</p><Link className="text-link" href="/orders/history">Mở lịch sử đơn</Link></article>
        </div>
      </section>
    </main>
  );
}
