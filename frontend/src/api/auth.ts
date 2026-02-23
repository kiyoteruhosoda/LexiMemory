import { api, tokenManager } from "./client";
import type { MeResponse } from "./types";

type LoginResponse = {
  ok: boolean;
  access_token: string;
  token_type: string;
  expires_in: number;
};

type RefreshResponse = {
  ok: boolean;
  access_token: string;
  token_type: string;
  expires_in: number;
};

type AuthStatusResponse = {
  ok: boolean;
  authenticated: boolean;
  canRefresh: boolean;
  userId?: string;
  username?: string;
};

export const authApi = {
  register: (username: string, password: string) =>
    api.postAuth<{ ok: boolean; userId: string; username: string }>(
      "/auth/register",
      { username, password }
    ),

  login: async (username: string, password: string) => {
    const response = await api.postAuth<LoginResponse>("/auth/login", {
      username,
      password,
    });
    // Store access token in memory
    tokenManager.setToken(response.access_token);
    return response;
  },

  logout: async () => {
    try {
      await api.post<{ ok: boolean }>("/auth/logout");
    } finally {
      // Always clear token on logout
      tokenManager.clearToken();
    }
  },

  me: async () => {
    const r = await api.getAllow401<MeResponse>("/auth/me");
    return r ?? null;
  },

  // Check authentication status - always returns 200, never throws 401
  // Returns { authenticated: true/false, canRefresh: true/false, userId?, username? }
  status: async (): Promise<AuthStatusResponse> => {
    try {
      return await api.get<AuthStatusResponse>("/auth/status");
    } catch {
      // If network error, assume not authenticated and no refresh token
      return { ok: true, authenticated: false, canRefresh: false };
    }
  },

  refresh: async (): Promise<boolean> => {
    try {
      const response = await api.postAuth<RefreshResponse>("/auth/refresh");
      tokenManager.setToken(response.access_token);
      return true;
    } catch {
      tokenManager.clearToken();
      return false;
    }
  },
};
