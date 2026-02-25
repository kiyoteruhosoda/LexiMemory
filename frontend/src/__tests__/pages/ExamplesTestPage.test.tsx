import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../../auth/AuthContext";
import { ExamplesTestPage } from "../../pages/ExamplesTestPage";
import * as examplesOffline from "../../api/examples.offline";

vi.mock("../../api/examples.offline", () => ({
  examplesApi: {
    next: vi.fn(),
    getTags: vi.fn(),
  },
}));

vi.mock("../../api/auth", () => ({
  authApi: {
    me: vi.fn(),
    logout: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    status: vi.fn(),
  },
}));

vi.mock("../../api/client", () => ({
  tokenManager: {
    setToken: vi.fn(),
    clearToken: vi.fn(),
    onUnauthorized: vi.fn(),
  },
}));

vi.mock("../../utils/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    setUserId: vi.fn(),
  },
}));

describe("ExamplesTestPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(examplesOffline.examplesApi.getTags).mockResolvedValue({ tags: ["travel", "work"] });
    vi.mocked(examplesOffline.examplesApi.next).mockResolvedValue({ example: null });
  });

  it("renders RNW boundary navigation buttons", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ExamplesTestPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("rnw-examples-action-bar")).toBeInTheDocument();
      expect(screen.getByTestId("rnw-examples-words")).toBeInTheDocument();
      expect(screen.getByTestId("rnw-examples-study")).toBeInTheDocument();
      expect(screen.getByTestId("rnw-examples-tags")).toBeInTheDocument();
    });
  });

  it("opens RNW tag filter panel when filter button is pressed", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthProvider>
          <ExamplesTestPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    const filterButton = await screen.findByTestId("rnw-examples-tags");
    await user.click(filterButton);

    expect(screen.getByTestId("rnw-study-tag-panel")).toBeInTheDocument();
    expect(screen.getByText("Filter by Tags")).toBeInTheDocument();
  });
});
