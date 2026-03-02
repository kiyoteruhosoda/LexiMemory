// frontend/src/__tests__/utils/onlineStatusStore.test.ts
import { onlineStatusStore } from '../../utils/onlineStatusStore';

describe('onlineStatusStore', () => {
  it('should initialize as offline until health check confirms online', () => {
    expect(onlineStatusStore.getOnlineStatus()).toBe(false);
  });

  it('should update the status with setOnline', () => {
    const initialStatus = onlineStatusStore.getOnlineStatus();
    const newStatus = !initialStatus;

    onlineStatusStore.setOnline(newStatus);
    expect(onlineStatusStore.getOnlineStatus()).toBe(newStatus);

    // Set it back to avoid affecting other tests
    onlineStatusStore.setOnline(initialStatus);
  });

  it('should not notify listeners if the status has not changed', () => {
    const listener = vi.fn();
    const unsubscribe = onlineStatusStore.subscribe(listener);

    const currentStatus = onlineStatusStore.getOnlineStatus();
    onlineStatusStore.setOnline(currentStatus);
    onlineStatusStore.setOnline(currentStatus);

    // The listener is called once on initial subscription
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it('should notify subscribers when the status changes', () => {
    const listener = vi.fn();
    const unsubscribe = onlineStatusStore.subscribe(listener);
    const initialStatus = onlineStatusStore.getOnlineStatus();

    // Reset mock to ignore the initial call on subscribe
    listener.mockClear();

    onlineStatusStore.setOnline(!initialStatus);
    expect(listener).toHaveBeenCalledWith(!initialStatus);
    expect(listener).toHaveBeenCalledTimes(1);

    onlineStatusStore.setOnline(initialStatus);
    expect(listener).toHaveBeenCalledWith(initialStatus);
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
  });

  it('should stop notifying subscribers after unsubscribing', () => {
    const listener = vi.fn();
    const unsubscribe = onlineStatusStore.subscribe(listener);
    const initialStatus = onlineStatusStore.getOnlineStatus();

    // Reset mock to ignore the initial call on subscribe
    listener.mockClear();

    unsubscribe();

    onlineStatusStore.setOnline(!initialStatus);
    expect(listener).not.toHaveBeenCalled();

    // Set it back
    onlineStatusStore.setOnline(initialStatus);
  });
});
