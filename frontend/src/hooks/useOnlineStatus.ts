// frontend/src/hooks/useOnlineStatus.ts
import { useState, useEffect } from 'react';
import { onlineStatusStore } from '../utils/onlineStatusStore';

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(onlineStatusStore.getOnlineStatus());

  useEffect(() => {
    const unsubscribe = onlineStatusStore.subscribe(setIsOnline);
    return () => unsubscribe();
  }, []);

  return isOnline;
}
