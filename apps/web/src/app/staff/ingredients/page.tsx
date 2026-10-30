"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

type UsedBy = { kind: "DRINK" | "TOPPING"; name: string; perUnit: number };
type Ingredient = {
  id: number;
  name: string;
  unit: string;
  stock: number;
  usedBy?: UsedBy[];
  cupsRemaining?: number | null;
};

const LOW_CUPS = 10;

function status(i: Ingredient): { label: string; cls: string } {
  if (i.stock <= 0 || i.cupsRemaining === 0) return { label: "Hết", cls: "form-error" };
  if (i.cupsRemaining != null && i.cupsRemaining < LOW_CUPS) return { label: "Sắp hết", cls: "form-success" };
  return { label: "Đủ", cls: "" };
}

/** Kho nguyên liệu — chỉ nhân viên/quản lý (API trả 403 với khách). */
export default function IngredientsPage() {
  const [items, setItems] = useState<Ingredient[] | null>(null);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [amounts, setAmounts] = useState<Record<number, string>>({});

  const auth = () => ({ Authorization: `Bearer ${sessionStorage.getItem("brewlite_token") ?? ""}` });

  const load = useCallback(async () => {
    let role = "";
    try {
      role = (JSON.parse(sessionStorage.getItem("brewlite_user") ?? "{}") as { role?: string }).role ?? "";
    } catch {
      role = "";
    }
    if (role !== "STAFF") {
      setForbidden(true);
      setItems([]);
      return;
    }
    try {
      setItems(await apiRequest<Ingredient[]>("/ingredients", { headers: auth() }));
      setError("");
      setForbidden(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được kho nguyên liệu.");
      setItems([]);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => { void load(); });
  }, [load]);

  async function restock(id: number) {
    const quantity = Number(amounts[id]);
    if (!Number.isInteger(quantity) || quantity < 1) {
      setError("Nhập số lượng nguyên (≥ 1).");
      return;
    }
    try {
      await apiRequest(`/ingredients/${id}/restock`, { method: "PATCH", headers: auth(), body: JSON.stringify({ quantity }) });
      setAmounts((a) => ({ ...a, [id]: "" }));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nhập kho thất bại.");
    }
  }

  if (forbidden) {
    return (
      <main className="page-shell">
        <div className="container">
          <h1 className="page-title">Kho nguyên liệu</h1>
          <div className="form-error" role="alert">Chỉ tài khoản nhân viên/quản lý mới xem được kho nguyên liệu.</div>
          <p><Link href="/login">Đăng nhập tài khoản nhân viên</Link></p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="container">
        <span className="eyebrow">Nhân viên</span>
        <h1 className="page-title" style={{ marginTop: 16 }}>Kho nguyên liệu</h1>
        <p className="page-intro">
          Mỗi ly trừ nguyên liệu theo công thức, nhân hệ số theo size (S 100%, M 125%, L 150%) và cộng thêm phần topping.
          Khách hàng chỉ thấy số ly còn có thể đặt, không thấy tồn kho.
        </p>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="table-wrap content-card">
          <table>
            <thead>
              <tr><th>Nguyên liệu</th><th>Tồn kho</th><th>Ly size S còn làm được</th><th>Trạng thái</th><th>Dùng cho (mỗi ly size S / mỗi phần topping)</th><th>Nhập thêm</th></tr>
            </thead>
            <tbody>
              {(items ?? []).map((i) => {
                const st = status(i);
                return (
                  <tr key={i.id}>
                    <td>{i.name}</td>
                    <td>{i.stock.toLocaleString("vi-VN")} {i.unit}</td>
                    <td>{i.cupsRemaining == null ? "—" : i.cupsRemaining.toLocaleString("vi-VN")}</td>
                    <td><strong className={st.cls}>{st.label}</strong></td>
                    <td style={{ fontSize: 13 }}>
                      {(i.usedBy ?? []).length === 0 ? "Chưa dùng trong công thức nào" : (i.usedBy ?? []).map((u) => (
                        <div key={`${u.kind}-${u.name}`}>{u.kind === "TOPPING" ? "Topping " : ""}{u.name}: {u.perUnit} {i.unit}</div>
                      ))}
                    </td>
                    <td>
                      <input type="number" min={1} style={{ width: 90 }} value={amounts[i.id] ?? ""} onChange={(e) => setAmounts((a) => ({ ...a, [i.id]: e.target.value }))} aria-label={`Số lượng nhập thêm ${i.name}`} />{" "}
                      <button className="btn btn-outline" type="button" onClick={() => restock(i.id)}>Nhập</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
