import type { MeResponse } from "../../api/types";
import type { AuthGateway } from "./authGateway";

export type AuthStateSnapshot =
  | { status: "guest" }
  | { status: "authed"; me: MeResponse };

export type AuthIntent = "login" | "register";

export type AuthCommand = {
  intent: AuthIntent;
  username: string;
  password: string;
};

type AuthCommandHandler = (username: string, password: string) => Promise<void>;


function normalizeAuthCommand(command: AuthCommand): AuthCommand {
  return {
    ...command,
    username: command.username.trim(),
  };
}

export class AuthSessionService {
  private readonly authGateway: AuthGateway;
  private readonly authCommandHandlers: Record<AuthIntent, AuthCommandHandler>;

  constructor(authGateway: AuthGateway) {
    this.authGateway = authGateway;
    this.authCommandHandlers = {
      login: (username, password) => this.authGateway.login(username, password),
      register: async (username, password) => {
        await this.authGateway.register(username, password);
        await this.authGateway.login(username, password);
      },
    };
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

  async authenticate(command: AuthCommand): Promise<AuthStateSnapshot> {
    const normalizedCommand = normalizeAuthCommand(command);
    await this.authCommandHandlers[normalizedCommand.intent](
      normalizedCommand.username,
      normalizedCommand.password
    );
    return this.refreshUserState();
  }

  async login(username: string, password: string): Promise<AuthStateSnapshot> {
    return this.authenticate({ intent: "login", username, password });
  }

  async registerAndLogin(username: string, password: string): Promise<AuthStateSnapshot> {
    return this.authenticate({ intent: "register", username, password });
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
