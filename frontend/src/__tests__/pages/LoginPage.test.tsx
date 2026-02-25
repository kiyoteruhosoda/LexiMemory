import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "../../pages/LoginPage";
import * as useAuthModule from "../../auth/useAuth";

vi.mock("../../auth/useAuth");

const useAuthMock = vi.mocked(useAuthModule.useAuth);

describe("LoginPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAuthMock.mockReturnValue({
      state: { status: "guest" },
      login: vi.fn().mockResolvedValue(undefined),
      registerAndLogin: vi.fn().mockResolvedValue(undefined),
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

  it("calls registerAndLogin in register mode", async () => {
    const user = userEvent.setup();
    const loginMock = vi.fn().mockResolvedValue(undefined);
    const registerAndLoginMock = vi.fn().mockResolvedValue(undefined);

    useAuthMock.mockReturnValue({
      state: { status: "guest" },
      login: loginMock,
      registerAndLogin: registerAndLoginMock,
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

    expect(registerAndLoginMock).toHaveBeenCalledWith("alice", "secret");
    expect(loginMock).not.toHaveBeenCalled();
  });
});
