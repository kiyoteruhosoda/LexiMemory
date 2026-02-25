import { authApi } from "../api/auth";
import type { AuthGateway } from "../core/auth/authGateway";

export const authGatewayAdapter: AuthGateway = {
  async login(username: string, password: string): Promise<void> {
    await authApi.login(username, password);
  },
  async logout(): Promise<void> {
    await authApi.logout();
  },
  async me() {
    return authApi.me();
  },
  async status() {
    const response = await authApi.status();
    return {
      authenticated: response.authenticated,
      canRefresh: response.canRefresh,
      userId: response.userId,
      username: response.username,
    };
  },
  async refresh(): Promise<boolean> {
    return authApi.refresh();
  },
};
