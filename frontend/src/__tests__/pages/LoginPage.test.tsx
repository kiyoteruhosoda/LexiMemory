import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "../../pages/LoginPage";
import * as useAuthModule from "../../auth/useAuth";
import { authApi } from "../../api/auth";

vi.mock("../../auth/useAuth");
vi.mock("../../api/auth", () => ({
  authApi: {
    register: vi.fn(),
  },
}));

const useAuthMock = vi.mocked(useAuthModule.useAuth);

describe("LoginPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAuthMock.mockReturnValue({
      state: { status: "guest" },
      login: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn().mockResolvedValue(undefined),
      refresh: vi.fn().mockResolvedValue(undefined),
    });
  });

  it("toggles mode to register", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.click(screen.getByTestId("rnw-login-toggle-mode"));

    expect(screen.getByText("Create account")).toBeInTheDocument();
  });

  it("submits register then login flow", async () => {
    const user = userEvent.setup();
    const loginMock = vi.fn().mockResolvedValue(undefined);
    useAuthMock.mockReturnValue({
      state: { status: "guest" },
      login: loginMock,
      logout: vi.fn().mockResolvedValue(undefined),
      refresh: vi.fn().mockResolvedValue(undefined),
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.click(screen.getByTestId("rnw-login-toggle-mode"));
    await user.type(screen.getByTestId("rnw-login-username"), "alice");
    await user.type(screen.getByTestId("rnw-login-password"), "secret");
    await user.click(screen.getByTestId("rnw-login-submit"));

    expect(authApi.register).toHaveBeenCalledWith("alice", "secret");
    expect(loginMock).toHaveBeenCalledWith("alice", "secret");
  });
});
