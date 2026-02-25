import { createUnimplementedStoragePort } from "@leximemory/core/storage";
import type { StorageAdapter } from "../../../../src/core/storage";

export type MobileStorageRuntime = "native-async" | "native-sqlite";

function readRuntimeFromEnv(): MobileStorageRuntime {
  const runtime = process.env.EXPO_PUBLIC_MOBILE_STORAGE_RUNTIME;
  if (runtime === "native-sqlite") {
    return "native-sqlite";
  }
  return "native-async";
}

async function loadRuntimeAdapter(runtime: MobileStorageRuntime): Promise<StorageAdapter> {
  if (runtime === "native-sqlite") {
    const module = await import("../storage/mobileSqliteStorageAdapter");
    return module.createMobileSqliteStorageAdapter();
  }

  const module = await import("../storage/mobileAsyncStorageAdapter");
  return module.createMobileAsyncStorageAdapter();
}

export async function resolveMobileStorageAdapter(): Promise<{ runtime: MobileStorageRuntime; adapter: StorageAdapter }> {
  const runtime = readRuntimeFromEnv();

  try {
    const adapter = await loadRuntimeAdapter(runtime);
    return { runtime, adapter };
  } catch {
    return { runtime, adapter: createUnimplementedStoragePort() };
  }
}
