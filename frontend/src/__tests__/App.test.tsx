// frontend/src/__tests__/App.test.tsx
import { render, act } from '@testing-library/react';
import App from '../App';
import { api } from '../api/client';
import { ensureInitialized } from '../db/localRepository';

// Mock dependencies
vi.mock('../api/client', () => ({
  api: {
    healthCheck: vi.fn(),
  },
  tokenManager: {
    setToken: vi.fn(),
    clearToken: vi.fn(),
    onUnauthorized: vi.fn(),
    getToken: vi.fn(() => null),
  },
}));

vi.mock('../db/localRepository', () => ({
  ensureInitialized: vi.fn(() => Promise.resolve()),
  getAllTags: vi.fn(() => Promise.resolve([])),
  getWords: vi.fn(() => Promise.resolve({ words: [], memoryMap: {}, total: 0 })),
}));

describe('App component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(window, 'addEventListener');
    vi.spyOn(window, 'removeEventListener');
    vi.spyOn(global, 'setInterval');
    vi.spyOn(global, 'clearInterval');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should perform initial setup and periodic checks', async () => {
    // Render the component
    await act(async () => {
      render(<App />);
    });

    // 1. Check for initial health check
    expect(api.healthCheck).toHaveBeenCalledTimes(1);

    // 2. Check for IndexedDB initialization
    expect(ensureInitialized).toHaveBeenCalledTimes(1);

    // 3. Check that setInterval is called for periodic health checks
    expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 30000);

    // 4. Check that 'online' event listener is added
    expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));

    // Fast-forward time to trigger the interval
    await act(async () => {
      vi.advanceTimersByTime(30000);
    });

    // Health check should be called again
    expect(api.healthCheck).toHaveBeenCalledTimes(2);

    // Fast-forward time again
    await act(async () => {
      vi.advanceTimersByTime(30000);
    });
    
    expect(api.healthCheck).toHaveBeenCalledTimes(3);
  });

  it('should clean up on unmount', async () => {
    let unmount: () => void;
    await act(async () => {
      const { unmount: unmountComponent } = render(<App />);
      unmount = unmountComponent;
    });

    // unmount the component
    unmount!();

    // Check that cleanup functions were called
    expect(clearInterval).toHaveBeenCalledTimes(1);
    expect(window.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
  });

  it('should trigger health check on browser online event', async () => {
    await act(async () => {
      render(<App />);
    });
    
    // Health check is called once on mount
    expect(api.healthCheck).toHaveBeenCalledTimes(1);

    // Manually find and call the registered 'online' event handler
    type EventListenerMock = { mock: { calls: [string, () => void][] } };
    const onlineCall = (window.addEventListener as unknown as EventListenerMock).mock.calls.find(
      (call: [string, () => void]) => call[0] === 'online'
    );
    const onlineHandler = onlineCall?.[1];
    
    if (!onlineHandler) {
      throw new Error('Online event handler not found');
    }
    
    await act(async () => {
        onlineHandler();
    });

    // Health check should be called again
    expect(api.healthCheck).toHaveBeenCalledTimes(2);
  });
});
