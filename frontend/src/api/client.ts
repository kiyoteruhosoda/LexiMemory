import { logger } from "../utils/logger";
import { onlineStatusStore } from "../utils/onlineStatusStore";

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
  detail?: string;
};

// JWT token storage (in-memory)
let accessToken: string | null = null;
let onUnauthorizedCallback: (() => void) | null = null;

export const tokenManager = {
  setToken: (token: string | null) => {
    accessToken = token;
  },
  getToken: () => accessToken,
  clearToken: () => {
    accessToken = null;
  },
  onUnauthorized: (callback: () => void) => {
    onUnauthorizedCallback = callback;
  },
};

async function parseError(res: Response): Promise<ApiError> {
  let msg = `${res.status} ${res.statusText}`;
  let errorCode: string | undefined;
  let requestId: string | undefined;

  try {
    const data = (await res.json()) as ApiErrorEnvelope;

    if (data?.error) {
      if (typeof data.error.message === "string") msg = data.error.message;
      if (typeof data.error.error_code === "string") errorCode = data.error.error_code;
      if (typeof data.error.request_id === "string") requestId = data.error.request_id;
    } else if (typeof data?.detail === "string") {
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
  opts?: { skipAuth?: boolean; allow401?: boolean; isHealthCheck?: boolean }
): Promise<T> {
  const headers: Record<string, string> = {};
  
  // Add Authorization header if token exists
  if (!opts?.skipAuth && accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  
  if (body) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    // If we received a response, we are online.
    onlineStatusStore.setOnline(true);

    if (opts?.allow401 && res.status === 401) {
      return undefined as T;
    }

    // Handle 401 Unauthorized
    if (res.status === 401 && !opts?.skipAuth) {
      const error = await parseError(res);
      logger.warn("Unauthorized - token expired", {
        method,
        path,
        errorCode: error.errorCode,
      });
      
      accessToken = null;
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
      
      throw error;
    }

    if (!res.ok) {
      const error = await parseError(res);
      logger.error("API request failed", {
        method,
        path,
        status: error.status,
        errorCode: error.errorCode,
        requestId: error.requestId,
        message: error.message,
      });
      throw error;
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;

  } catch (err: any) {
    // This block catches network errors (e.g., server down, no internet)
    logger.warn(`Network error during API request: ${err.message}`, { path });
    onlineStatusStore.setOnline(false);

    // Don't rethrow for health checks, as we don't want to crash the app
    if (opts?.isHealthCheck) {
      return undefined as T;
    }
    
    // Re-throw the error for other requests to be handled by the caller
    throw err;
  }
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path:string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
  getAllow401: <T>(path: string) => request<T>("GET", path, undefined, { allow401: true }),
  postAuth: <T>(path: string, body?: unknown) =>
    request<T>("POST", path, body, { skipAuth: true }),
  // Add a health check method
  healthCheck: () => request<unknown>("GET", "/users/me", undefined, { allow401: true, isHealthCheck: true }),
};
