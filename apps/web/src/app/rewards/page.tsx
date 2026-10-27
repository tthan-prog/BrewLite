"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

type Reward = { id: number; name: string; description: string; pointsCost: number };
type Me = {
  points: number;
  history: { id: number; orderId: number; type: "EARN" | "REVERSAL"; points: number; createdAt: string }[];
  redemptions: { id: number; code: string; rewardName: string; pointsSpent: number; createdAt: string }[];
};

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const token = sessionStorage.getItem("brewlite_token");
    try {
      setRewards(await apiRequest<Reward[]>("/rewards"));
      if (token) {
        setMe(await apiRequest<Me>("/rewards/me", { headers: { Authorization: `Bearer ${token}` } }));
        setError("");
      } else {
        setError("Hãy đăng nhập để xem điểm và đổi quà.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được dữ liệu điểm thưởng.");
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => { void load(); });
  }, [load]);

  async function redeem(reward: Reward) {
    const token = sessionStorage.getItem("brewlite_token");
    if (!token) return;
    setBusyId(reward.id);
    setMessage("");
    try {
      const r = await apiRequest<{ code: string; rewardName: string; pointsSpent: number; pointsBalance: number }>(
        `/rewards/${reward.id}/redeem`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage(`Đổi thành công "${r.rewardName}". Mã quà: ${r.code} (đã trừ ${r.pointsSpent} điểm, còn ${r.pointsBalance} điểm). Đưa mã này cho nhân viên khi nhận quà.`);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Đổi quà thất bại.");
    } finally {
      setBusyId(null);
    }
  }

  const points = me?.points ?? 0;
  const next = rewards.find((r) => r.pointsCost > points);

  return (
    <main className="page-shell">
      <div className="container">
        <span className="eyebrow">Tích điểm BrewLite</span>
        <h1 className="page-title" style={{ marginTop: 16 }}>Điểm thưởng và đổi quà</h1>
        <p className="page-intro">Mỗi 10.000 ₫ thanh toán thành công được 1 điểm. Hủy đơn đã thanh toán thì điểm tương ứng bị trừ lại.</p>

        {error && <div className="notice" role="alert">{error} <Link className="text-link" href="/login">Đăng nhập</Link></div>}
        {message && <div className="form-success" role="status" style={{ margin: "12px 0" }}>{message}</div>}

        {me && (
          <div className="content-card" style={{ margin: "16px 0" }}>
            <div className="detail-label">Điểm hiện có</div>
            <div className="order-number">{points} điểm</div>
            {next ? <p className="subtext">Còn {next.pointsCost - points} điểm nữa để đổi &quot;{next.name}&quot;.</p> : <p className="subtext">Bạn đủ điểm đổi mọi quà hiện có.</p>}
          </div>
        )}

        <h2>Quà có thể đổi</h2>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))" }}>
          {rewards.map((r) => (
            <div className="content-card" key={r.id}>
              <h3>{r.name}</h3>
              <p className="subtext">{r.description}</p>
              <strong>{r.pointsCost} điểm</strong>
              <button
                className="btn btn-primary full"
                style={{ marginTop: 12 }}
                disabled={!me || points < r.pointsCost || busyId === r.id}
                onClick={() => redeem(r)}
              >
                {!me ? "Đăng nhập để đổi" : points < r.pointsCost ? "Chưa đủ điểm" : busyId === r.id ? "Đang đổi..." : "Đổi quà"}
              </button>
            </div>
          ))}
        </div>

        {me && (
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", marginTop: 24 }}>
            <section className="content-card">
              <h3>Quà đã đổi</h3>
              {me.redemptions.length === 0 ? <p className="subtext">Chưa đổi quà nào.</p> : (
                <ul>{me.redemptions.map((x) => <li key={x.id}><strong>{x.code}</strong> · {x.rewardName} (−{x.pointsSpent} điểm)</li>)}</ul>
              )}
            </section>
            <section className="content-card">
              <h3>Lịch sử điểm</h3>
              {me.history.length === 0 ? <p className="subtext">Chưa có giao dịch điểm.</p> : (
                <ul>{me.history.map((h) => <li key={h.id}>Đơn #{h.orderId}: {h.points > 0 ? "+" : ""}{h.points} điểm ({h.type === "EARN" ? "tích điểm" : "hoàn điểm do hủy"})</li>)}</ul>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
