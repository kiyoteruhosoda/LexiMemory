// frontend/src/auth/AuthContext.tsx

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/auth";
import type { MeResponse } from "../api/types";

type AuthState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "authed"; me: MeResponse };

type AuthCtx = {
  state: AuthState;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  async function refresh() {
    try {
      const me = await authApi.me(); // me(): MeResponse | null

      // ★重要：未ログイン(null)は guest 扱い
      if (me) {
        setState({ status: "authed", me });
      } else {
        setState({ status: "guest" });
      }
    } catch {
      // ここに来るのは 500/通信エラー等（＝本当に異常系）
      setState({ status: "guest" });
    }
  }

  async function login(username: string, password: string) {
    await authApi.login(username, password);
    await refresh();
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      setState({ status: "guest" });
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const value = useMemo(() => ({ state, login, logout, refresh }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("AuthProvider is missing");
  return v;
}
