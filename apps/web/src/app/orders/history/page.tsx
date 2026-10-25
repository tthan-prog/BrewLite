"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

type Order = { id?: string | number; orderCode?: string; code?: string; status?: string; total?: number; createdAt?: string; created_at?: string };
export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    const token = sessionStorage.getItem("brewlite_token");
    const request: Promise<Order[]> = token
      ? apiRequest<Order[]>("/orders/me", { headers: { Authorization: `Bearer ${token}` } })
      : Promise.reject(new Error("Bạn cần đăng nhập trước khi xem lịch sử đơn hàng."));
    request
      .then(data => { if (alive) setOrders(Array.isArray(data) ? data : []); })
      .catch(err => { if (alive) setError(err instanceof Error ? err.message : "Không thể tải lịch sử đơn hàng."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  return <main className="page-shell"><div className="container">
    <span className="eyebrow">Tài khoản BrewLite</span><h1 className="page-title" style={{marginTop:16}}>Lịch sử đơn hàng</h1><p className="page-intro">Theo dõi trạng thái những đơn hàng của bạn.</p>
    <div className="orders-layout"><section className="content-card">
      {loading ? <div className="empty-state"><h3>Đang tải đơn hàng...</h3><p>Đang lấy dữ liệu từ backend.</p></div>
      : error ? <div className="empty-state"><h3>Chưa thể tải lịch sử</h3><p>{error}</p><Link className="btn btn-primary" href="/login">Đăng nhập</Link></div>
      : orders.length === 0 ? <div className="empty-state"><h3>Bạn chưa có đơn hàng</h3><p>Khi bạn hoàn tất đơn đầu tiên, thông tin sẽ được hiển thị ở đây.</p><Link className="btn btn-primary" href="/">Về trang chủ</Link></div>
      : <div className="table-wrap"><table><thead><tr><th>Mã đơn</th><th>Ngày đặt</th><th>Trạng thái</th><th>Tổng tiền</th></tr></thead><tbody>{orders.map((order, index) => <tr key={order.id ?? order.orderCode ?? index}><td>{order.orderCode ?? order.code ?? `#${order.id ?? index + 1}`}</td><td>{(order.createdAt ?? order.created_at) ? new Date((order.createdAt ?? order.created_at) as string).toLocaleDateString("vi-VN") : "—"}</td><td><span className="status-pill">{order.status ?? "PENDING"}</span></td><td>{typeof order.total === "number" ? `${order.total.toLocaleString("vi-VN")} ₫` : "—"}</td></tr>)}</tbody></table></div>}
    </section><aside className="content-card"><h3>Thông tin riêng tư</h3><p className="subtext" style={{marginBottom:18}}>Lịch sử chỉ hiển thị đơn của tài khoản đang đăng nhập.</p><Link className="btn btn-primary full" href="/menu">Đặt đồ uống</Link></aside></div>
  </div></main>;
}
