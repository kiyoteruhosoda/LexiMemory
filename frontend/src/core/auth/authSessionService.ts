import type { MeResponse } from "../../api/types";
import type { AuthGateway } from "./authGateway";

export type AuthStateSnapshot =
  | { status: "guest" }
  | { status: "authed"; me: MeResponse };

export class AuthSessionService {
  private readonly authGateway: AuthGateway;

  constructor(authGateway: AuthGateway) {
    this.authGateway = authGateway;
  }

  async initialize(): Promise<AuthStateSnapshot> {
    const status = await this.authGateway.status();

    if (status.authenticated && status.userId && status.username) {
      return {
        status: "authed",
        me: { userId: status.userId, username: status.username },
      };
    }

    if (status.canRefresh) {
      const refreshed = await this.authGateway.refresh();
      if (refreshed) {
        return this.refreshUserState();
      }
    }

    return { status: "guest" };
  }

  async login(username: string, password: string): Promise<AuthStateSnapshot> {
    await this.authGateway.login(username, password);
    return this.refreshUserState();
  }

  async logout(): Promise<AuthStateSnapshot> {
    await this.authGateway.logout();
    return { status: "guest" };
  }

  async recoverFromUnauthorized(): Promise<AuthStateSnapshot> {
    const refreshed = await this.authGateway.refresh();
    if (!refreshed) {
      return { status: "guest" };
    }
    return this.refreshUserState();
  }

  async refreshUserState(): Promise<AuthStateSnapshot> {
    const me = await this.authGateway.me();
    if (!me) {
      return { status: "guest" };
    }
    return { status: "authed", me };
  }
}
