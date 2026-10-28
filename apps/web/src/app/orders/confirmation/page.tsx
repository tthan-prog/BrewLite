"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type OrderSummary = { id?: string | number; orderCode?: string; code?: string; status?: string; total?: number; createdAt?: string; pointsEarned?: number; pointsBalance?: number | null; method?: string };
export default function OrderConfirmationPage() {
  const [order, setOrder] = useState<OrderSummary | null>(null);
  useEffect(() => {
    let alive = true;
    // Đọc phiên ở microtask để không setState đồng bộ trong thân effect.
    queueMicrotask(() => {
      if (!alive) return;
      const params = new URLSearchParams(window.location.search);
      const queryOrder = params.get("orderCode") || params.get("id");
      const saved = sessionStorage.getItem("brewlite_last_order");
      if (saved) { try { setOrder(JSON.parse(saved) as OrderSummary); return; } catch { /* bỏ qua dữ liệu phiên không hợp lệ */ } }
      if (queryOrder) setOrder({ orderCode: queryOrder, status: "PENDING" });
    });
    return () => { alive = false; };
  }, []);
  return <main className="page-shell"><div className="container" style={{maxWidth:850}}>
    <div className="content-card" style={{textAlign:"center",padding:"42px 28px"}}>
      
      <span className="eyebrow">Thông tin đơn hàng</span><h1 className="page-title" style={{marginTop:16}}>Xác nhận đơn hàng</h1>
      <p className="page-intro" style={{maxWidth:550,margin:"0 auto"}}>Cảm ơn bạn đã đặt hàng. Thanh toán là mô phỏng/sandbox nên không có giao dịch tiền thật.</p>
      {order ? <div style={{maxWidth:480,margin:"28px auto 0",textAlign:"left"}} className="content-card">
        <span className="status-pill">{order.status ?? "PENDING"}</span><div className="detail-label" style={{marginTop:18}}>Mã đơn hàng</div><div className="order-number">{order.orderCode ?? order.code ?? (order.id ? `#${order.id}` : "Đang cập nhật")}</div>
        <div className="order-details"><div className="detail-box"><div className="detail-label">Trạng thái</div><div className="detail-value">{order.status ?? "Đang chờ xử lý"}</div></div><div className="detail-box"><div className="detail-label">Tổng tiền</div><div className="detail-value">{typeof order.total === "number" ? `${order.total.toLocaleString("vi-VN")} ₫` : "Chưa có dữ liệu"}</div></div></div>
        {typeof order.pointsEarned === "number" && order.status === "PAID" && <div className="form-success" role="status" style={{marginTop:16}}><strong>+{order.pointsEarned} điểm</strong> đã được cộng vào tài khoản{typeof order.pointsBalance === "number" ? <> (tổng: {order.pointsBalance} điểm)</> : null}. <Link className="text-link" href="/rewards">Đổi quà</Link></div>}
      </div> : <div className="notice" style={{maxWidth:560,margin:"26px auto 0",textAlign:"left"}}>Chưa có đơn hàng nào vừa được đặt. Hãy chọn đồ uống ở trang Thực đơn.</div>}
      <div className="hero-actions" style={{justifyContent:"center",marginTop:28}}><Link className="btn btn-primary" href="/orders/history">Xem lịch sử đơn hàng</Link><Link className="btn btn-outline" href="/">Về trang chủ</Link></div>
    </div>
  </div></main>;
}
