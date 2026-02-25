import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SyncButton from "../../components/SyncButton";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import * as useAuthModule from "../../auth/useAuth";
import { appCompositionRoot, syncOrchestrationService } from "../../app/compositionRoot";

vi.mock("../../hooks/useOnlineStatus");
vi.mock("../../auth/useAuth");
vi.mock("../../app/compositionRoot", () => ({
  appCompositionRoot: {
    syncApplicationService: {
      getStatus: vi.fn(),
    },
  },
  syncOrchestrationService: {
    consumePendingSyncIfReady: vi.fn(),
    requestSync: vi.fn(),
    resolveConflict: vi.fn(),
  },
}));

const useOnlineStatusMock = vi.mocked(useOnlineStatus);
const useAuthMock = vi.mocked(useAuthModule.useAuth);
const getStatusMock = vi.mocked(appCompositionRoot.syncApplicationService.getStatus);
const requestSyncMock = vi.mocked(syncOrchestrationService.requestSync);
const consumePendingMock = vi.mocked(syncOrchestrationService.consumePendingSyncIfReady);

describe("SyncButton", () => {
  const mockSyncStatus = {
    dirty: false,
    lastSyncAt: null,
    clientId: "test-client",
    serverRev: 0,
  };

  beforeEach(() => {
    vi.resetAllMocks();

    useAuthMock.mockReturnValue({
      state: { status: "authed", me: { userId: "test", username: "test" } },
      authenticate: vi.fn().mockResolvedValue(undefined),
      login: vi.fn().mockResolvedValue(undefined),
      registerAndLogin: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn().mockResolvedValue(undefined),
      refresh: vi.fn().mockResolvedValue(undefined),
    });
    getStatusMock.mockResolvedValue({ ...mockSyncStatus, online: true });
    requestSyncMock.mockResolvedValue({ status: "success" });
    consumePendingMock.mockResolvedValue(false);
  });

  it("should be disabled and show offline status when offline", async () => {
    useOnlineStatusMock.mockReturnValue(false);
    render(<SyncButton />);

    const button = await screen.findByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("title", "Offline");
    expect(button.querySelector(".bg-secondary")).toBeInTheDocument();
  });

  it("should be enabled and show online status when online", async () => {
    useOnlineStatusMock.mockReturnValue(true);
    render(<SyncButton />);

    const button = await screen.findByRole("button");
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute("title", "Online");
    expect(button.querySelector(".bg-success")).toBeInTheDocument();
  });

  it("should show unsaved changes (dirty) status when online", async () => {
    useOnlineStatusMock.mockReturnValue(true);
    getStatusMock.mockResolvedValue({ ...mockSyncStatus, online: true, dirty: true });

    render(<SyncButton />);

    const button = await screen.findByRole("button");
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute("title", "Unsaved changes");
    expect(button.querySelector(".bg-warning")).toBeInTheDocument();
  });

  it("should not request sync when clicked if offline", async () => {
    useOnlineStatusMock.mockReturnValue(false);
    render(<SyncButton />);

    const button = await screen.findByRole("button");
    fireEvent.click(button);

    expect(requestSyncMock).not.toHaveBeenCalled();
  });

  it("should request sync when clicked if online and authenticated", async () => {
    useOnlineStatusMock.mockReturnValue(true);
    render(<SyncButton />);

    const button = await screen.findByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(requestSyncMock).toHaveBeenCalledTimes(1);
    });
  });
});
