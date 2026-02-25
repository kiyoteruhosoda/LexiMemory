import { createContext } from "react";
import type { MeResponse } from "../api/types";

export type AuthState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "authed"; me: MeResponse };

export type AuthCtx = {
  state: AuthState;
  login: (username: string, password: string) => Promise<void>;
  registerAndLogin: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

export const AuthContext = createContext<AuthCtx | null>(null);
