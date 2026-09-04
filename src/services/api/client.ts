import { env } from "@/config/env";

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const url = `${env.NEXT_PUBLIC_API_URL}${path}`;

  const headers = new Headers(options?.headers);
  headers.set("Content-Type", "application/json");

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ApiError(errorBody.message || "An unexpected network error occurred", response.status);
  }

  const data = await response.json();
  return {
    data,
    status: response.status,
  };
}

export const api = {
  get: <T>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: "GET" }),
  post: <T, B>(path: string, body: B, options?: RequestInit) => request<T>(path, { ...options, method: "POST", body: JSON.stringify(body) }),
  put: <T, B>(path: string, body: B, options?: RequestInit) => request<T>(path, { ...options, method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: "DELETE" }),
};
