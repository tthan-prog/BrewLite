"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Health = { status: string; service: string };
type State =
  | { kind: "loading" }
  | { kind: "ok"; data: Health }
  | { kind: "error"; message: string };

export default function Home() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/health`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Health>;
      })
      .then((data) => setState({ kind: "ok", data }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "Lỗi không xác định",
        });
      });
    return () => controller.abort();
  }, []);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">BrewLite</h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Hello BrewLite! Đặt cà phê không dùng tiền mặt.
      </p>

      <section
        aria-live="polite"
        className="rounded-lg border border-zinc-300 px-5 py-4 text-sm dark:border-zinc-700"
      >
        <p className="font-medium">Trạng thái backend</p>
        {state.kind === "loading" && <p>Đang kiểm tra...</p>}
        {state.kind === "ok" && (
          <p className="text-green-700 dark:text-green-400">
            Kết nối được ({state.data.service}: {state.data.status})
          </p>
        )}
        {state.kind === "error" && (
          <p className="text-red-700 dark:text-red-400">
            Không kết nối được ({state.message}). Kiểm tra backend đã chạy ở{" "}
            {API_URL} chưa.
          </p>
        )}
      </section>
    </main>
  );
}
