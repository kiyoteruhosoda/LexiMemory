// frontend/src/__tests__/components/SyncButton.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SyncButton from '../../components/SyncButton';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { syncUseCase } from '../../sync/syncGatewayAdapter';
import * as useAuthModule from '../../auth/useAuth';

// Mock dependencies
vi.mock('../../hooks/useOnlineStatus');
vi.mock('../../sync/syncGatewayAdapter', () => ({
  syncUseCase: {
    getStatus: vi.fn(),
    sync: vi.fn(),
    resolve: vi.fn(),
    initializeFromServer: vi.fn(),
  },
}));
vi.mock('../../auth/useAuth');

const useOnlineStatusMock = vi.mocked(useOnlineStatus);
const syncUseCaseMock = vi.mocked(syncUseCase);
const useAuthMock = vi.mocked(useAuthModule.useAuth);

describe('SyncButton', () => {
  const mockSyncStatus = {
    dirty: false,
    lastSyncAt: null,
    clientId: 'test-client',
    serverRev: 0,
  };

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();

    // Default mocks
    useAuthMock.mockReturnValue({
      state: { status: 'authed', me: { userId: 'test', username: 'test' } },
      login: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn().mockResolvedValue(undefined),
      refresh: vi.fn().mockResolvedValue(undefined),
    });
    syncUseCaseMock.getStatus.mockResolvedValue({ ...mockSyncStatus, online: true });
    syncUseCaseMock.sync.mockResolvedValue({ status: 'success', serverRev: 1, updatedAt: new Date().toISOString() });
  });

  it('should be disabled and show offline status when offline', async () => {
    useOnlineStatusMock.mockReturnValue(false); // Mock offline status

    render(<SyncButton />);

    // Wait for the component to update after async getSyncStatus
    const button = await screen.findByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title', 'Offline');

    // Check for the grey status dot
    const statusDot = button.querySelector('.bg-secondary');
    expect(statusDot).toBeInTheDocument();
  });

  it('should be enabled and show online status when online', async () => {
    useOnlineStatusMock.mockReturnValue(true); // Mock online status

    render(<SyncButton />);

    const button = await screen.findByRole('button');
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute('title', 'Online');

    // Check for the green status dot
    const statusDot = button.querySelector('.bg-success');
    expect(statusDot).toBeInTheDocument();
  });

  it('should show unsaved changes (dirty) status when online', async () => {
    useOnlineStatusMock.mockReturnValue(true);
    syncUseCaseMock.getStatus.mockResolvedValue({
      ...mockSyncStatus,
      online: true,
      dirty: true,
    });

    render(<SyncButton />);

    const button = await screen.findByRole('button');
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute('title', 'Unsaved changes');

    // Check for the yellow status dot
    const statusDot = button.querySelector('.bg-warning');
    expect(statusDot).toBeInTheDocument();
  });

  it('should not call syncToServer when clicked if offline', async () => {
    useOnlineStatusMock.mockReturnValue(false);

    render(<SyncButton />);

    const button = await screen.findByRole('button');
    fireEvent.click(button);

    expect(syncUseCaseMock.sync).not.toHaveBeenCalled();
  });

  it('should call syncToServer when clicked if online and authenticated', async () => {
    useOnlineStatusMock.mockReturnValue(true);

    render(<SyncButton />);

    const button = await screen.findByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(syncUseCaseMock.sync).toHaveBeenCalledTimes(1);
    });
  });
});
