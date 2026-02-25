import { describe, it, expect, vi } from "vitest";
import { AuthSessionService } from "../../core/auth/authSessionService";
import type { AuthGateway } from "../../core/auth/authGateway";

function createGatewayMock(): AuthGateway {
  return {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
    status: vi.fn(),
    refresh: vi.fn(),
  };
}

describe("AuthSessionService", () => {
  it("returns authed state when status has authenticated user", async () => {
    const gateway = createGatewayMock();
    vi.mocked(gateway.status).mockResolvedValue({
      authenticated: true,
      canRefresh: false,
      userId: "u1",
      username: "alice",
    });

    const service = new AuthSessionService(gateway);
    await expect(service.initialize()).resolves.toEqual({
      status: "authed",
      me: { userId: "u1", username: "alice" },
    });
  });

  it("uses refresh flow when status can refresh", async () => {
    const gateway = createGatewayMock();
    vi.mocked(gateway.status).mockResolvedValue({ authenticated: false, canRefresh: true });
    vi.mocked(gateway.refresh).mockResolvedValue(true);
    vi.mocked(gateway.me).mockResolvedValue({ userId: "u2", username: "bob" });

    const service = new AuthSessionService(gateway);
    await expect(service.initialize()).resolves.toEqual({
      status: "authed",
      me: { userId: "u2", username: "bob" },
    });
  });

  it("returns guest when refresh fails after unauthorized", async () => {
    const gateway = createGatewayMock();
    vi.mocked(gateway.refresh).mockResolvedValue(false);

    const service = new AuthSessionService(gateway);
    await expect(service.recoverFromUnauthorized()).resolves.toEqual({ status: "guest" });
  });

  it("authenticates with login intent", async () => {
    const gateway = createGatewayMock();
    vi.mocked(gateway.me).mockResolvedValue({ userId: "u3", username: "charlie" });

    const service = new AuthSessionService(gateway);
    await expect(
      service.authenticate({ intent: "login", username: "charlie", password: "secret" })
    ).resolves.toEqual({
      status: "authed",
      me: { userId: "u3", username: "charlie" },
    });

    expect(gateway.login).toHaveBeenCalledWith("charlie", "secret");
    expect(gateway.register).not.toHaveBeenCalled();
  });

  it("authenticates with register intent using register then login", async () => {
    const gateway = createGatewayMock();
    vi.mocked(gateway.me).mockResolvedValue({ userId: "u4", username: "dana" });

    const service = new AuthSessionService(gateway);
    await expect(
      service.authenticate({ intent: "register", username: "dana", password: "secret" })
    ).resolves.toEqual({
      status: "authed",
      me: { userId: "u4", username: "dana" },
    });

    expect(gateway.register).toHaveBeenCalledWith("dana", "secret");
    expect(gateway.login).toHaveBeenCalledWith("dana", "secret");
  });
  it("normalizes username in auth command before dispatch", async () => {
    const gateway = createGatewayMock();
    vi.mocked(gateway.me).mockResolvedValue({ userId: "u5", username: "eve" });

    const service = new AuthSessionService(gateway);
    await service.authenticate({ intent: "login", username: "  eve  ", password: "secret" });

    expect(gateway.login).toHaveBeenCalledWith("eve", "secret");
  });

});
