const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/$/, "");

export type ApiError = { message?: string | string[]; statusCode?: number };

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
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

export { API_URL };
