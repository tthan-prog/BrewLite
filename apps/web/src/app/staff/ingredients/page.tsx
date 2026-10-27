"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

type Ingredient = { id: number; name: string; unit: string; stock: number };

/** Kho nguyên liệu (chỉ STAFF; API trả 403 với khách). */
export default function IngredientsPage() {
  const [items, setItems] = useState<Ingredient[]>([]);
  const [error, setError] = useState("");
  const [amounts, setAmounts] = useState<Record<number, string>>({});

  const auth = () => ({ Authorization: `Bearer ${sessionStorage.getItem("brewlite_token") ?? ""}` });

  const load = useCallback(async () => {
    try {
      setItems(await apiRequest<Ingredient[]>("/ingredients", { headers: auth() }));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được kho nguyên liệu.");
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

  return (
    <main className="page-shell">
      <div className="container">
        <span className="eyebrow">Nhân viên</span>
        <h1 className="page-title" style={{ marginTop: 16 }}>Kho nguyên liệu</h1>
        <p className="page-intro">Mỗi ly đồ uống trừ nguyên liệu theo công thức. Khi một nguyên liệu không đủ, món dùng nó sẽ không đặt được.</p>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="table-wrap content-card">
          <table>
            <thead><tr><th>Nguyên liệu</th><th>Tồn kho</th><th>Nhập thêm</th></tr></thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}>
                  <td>{i.name}</td>
                  <td>{i.stock.toLocaleString("vi-VN")} {i.unit}</td>
                  <td>
                    <input type="number" min={1} style={{ width: 90 }} value={amounts[i.id] ?? ""} onChange={(e) => setAmounts((a) => ({ ...a, [i.id]: e.target.value }))} aria-label={`Số lượng nhập thêm ${i.name}`} />{" "}
                    <button className="btn btn-outline" type="button" onClick={() => restock(i.id)}>Nhập</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
