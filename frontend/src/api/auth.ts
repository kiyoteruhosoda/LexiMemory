import { api } from "./client";
import type { MeResponse } from "./types";

export const authApi = {
  register: (username: string, password: string) =>
    api.post<{ ok: boolean; userId: string; username: string }>("/auth/register", { username, password }),

  login: (username: string, password: string) =>
    api.post<{ ok: boolean }>("/auth/login", { username, password }),

  logout: () => api.post<{ ok: boolean }>("/auth/logout"),

  me: async () => {
    const r = await api.getAllow401<MeResponse>("/auth/me");
    return r ?? null; // 401 → null
  },
};
