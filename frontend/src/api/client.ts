export class ApiError extends Error {
  status: number;
  errorCode?: string;
  requestId?: string;

  constructor(status: number, message: string, errorCode?: string, requestId?: string) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
    this.requestId = requestId;
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

type ApiErrorEnvelope = {
  error?: {
    error_code?: string;
    message?: string;
    request_id?: string;
    details?: unknown;
  };
  detail?: string; // 旧形式互換
};

async function parseError(res: Response): Promise<ApiError> {
  let msg = `${res.status} ${res.statusText}`;
  let errorCode: string | undefined;
  let requestId: string | undefined;

  try {
    const data = (await res.json()) as ApiErrorEnvelope;

    // 新形式: {"error": {...}}
    if (data?.error) {
      if (typeof data.error.message === "string") msg = data.error.message;
      if (typeof data.error.error_code === "string") errorCode = data.error.error_code;
      if (typeof data.error.request_id === "string") requestId = data.error.request_id;
    }
    // 旧形式: {"detail": "..."}
    else if (typeof data?.detail === "string") {
      msg = data.detail;
    }
  } catch {
    // ignore
  }

  return new ApiError(res.status, msg, errorCode, requestId);
}

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  opts?: { allow401?: boolean } // ←追加（/me用）
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include", // Cookieセッション必須
  });

  // /auth/me など “未ログインは正常” のケース
  if (opts?.allow401 && res.status === 401) {
    return undefined as T;
  }

  if (!res.ok) {
    throw await parseError(res);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get:  <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put:  <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  del:  <T>(path: string) => request<T>("DELETE", path),

  // 未ログイン判定用（401を例外にしない）
  getAllow401: <T>(path: string) => request<T>("GET", path, undefined, { allow401: true }),
};
