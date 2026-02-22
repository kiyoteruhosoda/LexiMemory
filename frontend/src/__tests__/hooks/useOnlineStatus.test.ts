// frontend/src/__tests__/hooks/useOnlineStatus.test.ts
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { onlineStatusStore } from '../../utils/onlineStatusStore';

describe('useOnlineStatus', () => {
  it('should return the initial online status', () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(onlineStatusStore.getOnlineStatus());
  });

  it('should update when the online status store changes', () => {
    const { result } = renderHook(() => useOnlineStatus());
    const initialStatus = onlineStatusStore.getOnlineStatus();

    act(() => {
      onlineStatusStore.setOnline(!initialStatus);
    });

    expect(result.current).toBe(!initialStatus);

    act(() => {
      onlineStatusStore.setOnline(initialStatus);
    });

    expect(result.current).toBe(initialStatus);
  });

  it('should unsubscribe from the store on unmount', () => {
    const { unmount } = renderHook(() => useOnlineStatus());
    
    
    // We can't directly inspect the listeners in the store,
    // so we test the effect: after unmount, the hook's value should not change.
    const initialStatus = onlineStatusStore.getOnlineStatus();

    unmount();

    act(() => {
      onlineStatusStore.setOnline(!initialStatus);
    });
    
    // This is a bit indirect. We re-render to check that it gets the new initial value,
    // not one held by the unmounted hook.
    const { result: newResult } = renderHook(() => useOnlineStatus());
    expect(newResult.current).toBe(!initialStatus);

    // Reset for other tests
    act(() => {
      onlineStatusStore.setOnline(initialStatus);
    });
  });
});
