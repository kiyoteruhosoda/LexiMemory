import type { MeResponse } from "../../api/types";

export type AuthStatus = {
  authenticated: boolean;
  canRefresh: boolean;
  userId?: string;
  username?: string;
};

export interface AuthGateway {
  login(username: string, password: string): Promise<void>;
  register(username: string, password: string): Promise<void>;
  logout(): Promise<void>;
  me(): Promise<MeResponse | null>;
  status(): Promise<AuthStatus>;
  refresh(): Promise<boolean>;
}
