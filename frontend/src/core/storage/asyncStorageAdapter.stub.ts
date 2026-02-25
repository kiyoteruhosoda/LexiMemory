import { createUnimplementedStoragePort } from "@leximemory/core/storage";
import type { StorageAdapter } from "./types";

/**
 * Placeholder adapter for future React Native migration.
 * Implement this with AsyncStorage or SQLite in mobile app.
 */
export const asyncStorageAdapterStub: StorageAdapter = createUnimplementedStoragePort();
