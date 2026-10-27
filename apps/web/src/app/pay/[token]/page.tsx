"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

type IntentView = {
  status: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
  provider: "BANK" | "MOMO" | "VNPAY";
  mode: "SIMULATED" | "SANDBOX";
  amount: number;
  orderId: number;
  expiresAt: string;
  items: { name: string; quantity: number; size: string }[];
  pointsEarned: number;
  pointsBalance: number | null;
};
type TestAccount = { provider: string; identifier: string; holderName: string; balance: number };

const NAME: Record<string, string> = { BANK: "Ngân hàng", MOMO: "Ví MoMo", VNPAY: "VNPay" };
const money = (v: number) => `${new Intl.NumberFormat("vi-VN").format(v)} ₫`;

/** Trang mở khi quét mã QR (thường trên điện thoại). Không cần đăng nhập: mã trong URL là bằng chứng quyền. */
function PayContent() {
  const { token } = useParams<{ token: string }>();
  const [view, setView] = useState<IntentView | null>(null);
  const [accounts, setAccounts] = useState<TestAccount[]>([]);
  const [account, setAccount] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    apiRequest<IntentView>(`/payments/intents/${token}`)
      .then((v) => { setView(v); setError(""); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Không tải được phiên thanh toán."));
  }, [token]);

  useEffect(() => {
    load();
    const id = window.setInterval(load, 3000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    apiRequest<TestAccount[]>("/payments/test-accounts").then(setAccounts).catch(() => undefined);
  }, []);

  async function confirm(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const v = await apiRequest<IntentView>(`/payments/intents/${token}/confirm`, {
        method: "POST",
        body: JSON.stringify({ accountNumber: account, pin }),
      });
      setView(v);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Thanh toán không thành công.");
    } finally {
      setBusy(false);
    }
  }

  const mine = accounts.filter((a) => a.provider === view?.provider);

  return (
    <main className="page-shell">
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="content-card">
          <span className="eyebrow">Thanh toán BrewLite</span>
          <h1 className="page-title" style={{ marginTop: 12 }}>{view ? NAME[view.provider] : "Thanh toán"}</h1>
          {!view && !error && <p>Đang tải...</p>}
          {!view && error && <div className="form-error" role="alert">{error}</div>}
          {view && (
            <>
              <p className="page-intro">
                Đơn #{view.orderId} · <strong>{money(view.amount)}</strong>
              </p>
              <ul style={{ margin: "0 0 16px", paddingLeft: 18 }}>
                {view.items.map((i, idx) => (
                  <li key={idx}>{i.name} × {i.quantity} ({i.size})</li>
                ))}
              </ul>

              {view.status === "PAID" && (
                <div className="form-success" role="status">
                  <strong>Thanh toán thành công!</strong>
                  <div>Bạn được cộng <strong>+{view.pointsEarned} điểm</strong>{view.pointsBalance !== null && <> (tổng: {view.pointsBalance} điểm)</>}.</div>
                  <div style={{ marginTop: 8 }}>Màn hình máy tính sẽ tự chuyển sang xác nhận đơn hàng.</div>
                  <Link className="btn btn-primary" style={{ marginTop: 12 }} href="/rewards">Xem điểm thưởng</Link>
                </div>
              )}
              {(view.status === "EXPIRED" || view.status === "FAILED") && (
                <div className="form-error" role="alert">
                  {view.status === "EXPIRED" ? "Mã QR đã hết hạn." : "Thanh toán không thành công."} Hãy quay lại màn hình đặt hàng để tạo mã mới.
                </div>
              )}

              {view.status === "PENDING" && view.mode === "SANDBOX" && (
                <div className="notice">Đang chờ cổng thanh toán {NAME[view.provider]} (sandbox) xác nhận. Trang này sẽ tự cập nhật.</div>
              )}

              {view.status === "PENDING" && view.mode === "SIMULATED" && (
                <form className="form-stack" onSubmit={confirm}>
                  <div className="notice">Đây là thanh toán <strong>mô phỏng</strong> bằng tài khoản TEST, không trừ tiền thật. PIN chung của mọi tài khoản test: <code>123456</code>.</div>
                  <div className="field">
                    <label htmlFor="acc">Tài khoản {NAME[view.provider]} (test)</label>
                    <select id="acc" value={account} onChange={(e) => setAccount(e.target.value)} required>
                      <option value="">— Chọn tài khoản test —</option>
                      {mine.map((a) => (
                        <option key={a.identifier} value={a.identifier}>
                          {a.identifier} · {a.holderName} · số dư {money(a.balance)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="pin">Mã PIN / OTP</label>
                    <input id="pin" type="password" inputMode="numeric" autoComplete="off" value={pin} onChange={(e) => setPin(e.target.value)} minLength={4} maxLength={12} required />
                  </div>
                  {error && <div className="form-error" role="alert">{error}</div>}
                  <button className="btn btn-primary full" type="submit" disabled={busy || !account || !pin}>
                    {busy ? "Đang xử lý..." : `Xác nhận thanh toán ${money(view.amount)}`}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<main className="page-shell"><div className="container"><p>Đang tải...</p></div></main>}>
      <PayContent />
    </Suspense>
  );
}
