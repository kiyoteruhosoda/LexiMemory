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
});
