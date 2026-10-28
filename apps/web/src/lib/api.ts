/**
 * Địa chỉ API. Ưu tiên NEXT_PUBLIC_API_URL (khi triển khai thật). Nếu để trống, trình duyệt gọi API
 * ở CÙNG máy chủ với trang đang mở, cổng 3001 — nên mở web bằng localhost hay IP Wi-Fi
 * (điện thoại quét QR) đều chạy mà không cần sửa file .env.
 */
function resolveApiUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined") return `${window.location.protocol}//${window.location.hostname}:3001`;
  return "http://localhost:3001";
}

export type ApiError = { message?: string | string[]; statusCode?: number };

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${resolveApiUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const body = payload as ApiError;
    const message = Array.isArray(body?.message)
      ? body.message.join("; ")
      : body?.message || (typeof payload === "string" ? payload : `Yêu cầu thất bại (${response.status})`);
    throw new Error(message);
  }

  return payload as T;
}

export { resolveApiUrl };
