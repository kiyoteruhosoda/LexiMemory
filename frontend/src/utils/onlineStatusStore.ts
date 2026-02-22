// frontend/src/utils/onlineStatusStore.ts

type Listener = (isOnline: boolean) => void;
type HealthCheckFn = () => Promise<boolean>;

// Start with browser's navigator.onLine as an initial guess.
// This will be updated by actual API calls.
let isOnline = navigator.onLine;
const listeners = new Set<Listener>();
let healthCheckFn: HealthCheckFn | null = null;
let retryTimeoutId: number | null = null;
const RETRY_INTERVAL_MS = 10000; // Retry every 10 seconds when offline

function setOnline(status: boolean) {
  if (isOnline === status) return;
  isOnline = status;
  for (const listener of listeners) {
    listener(isOnline);
  }
  
  // When going offline, start periodic retry attempts
  if (!status) {
    scheduleRetry();
  } else {
    // When back online, clear any pending retries
    clearRetry();
  }
}

function clearRetry() {
  if (retryTimeoutId !== null) {
    window.clearTimeout(retryTimeoutId);
    retryTimeoutId = null;
  }
}

function scheduleRetry() {
  clearRetry();
  retryTimeoutId = window.setTimeout(async () => {
    if (!isOnline && healthCheckFn) {
      const result = await performHealthCheck();
      if (result) {
        // Successfully reconnected
        setOnline(true);
      } else {
        // Still offline, schedule next retry
        scheduleRetry();
      }
    }
  }, RETRY_INTERVAL_MS);
}

async function performHealthCheck(): Promise<boolean> {
  if (!healthCheckFn) return false;
  try {
    return await healthCheckFn();
  } catch {
    return false;
  }
}

function subscribe(callback: Listener): () => void {
  listeners.add(callback);
  callback(isOnline); // Immediately notify with the current status
  return () => listeners.delete(callback);
}

function getOnlineStatus(): boolean {
  return isOnline;
}

function registerHealthCheck(fn: HealthCheckFn) {
  healthCheckFn = fn;
}

// Listen to browser's online/offline events.
// When browser reports online, verify with actual health check.
window.addEventListener('online', async () => {
  const result = await performHealthCheck();
  setOnline(result);
});
window.addEventListener('offline', () => setOnline(false));

export const onlineStatusStore = {
  setOnline,
  subscribe,
  getOnlineStatus,
  registerHealthCheck,
};
