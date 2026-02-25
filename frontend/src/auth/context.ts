import { createContext } from "react";
import type { MeResponse } from "../api/types";
import type { AuthCommand } from "../core/auth/authSessionService";

export type AuthState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "authed"; me: MeResponse };

export type AuthCtx = {
  state: AuthState;
  authenticate: (command: AuthCommand) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  registerAndLogin: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

export const AuthContext = createContext<AuthCtx | null>(null);
