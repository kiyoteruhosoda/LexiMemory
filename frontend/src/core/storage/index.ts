import { webStorageAdapter } from "./webStorageAdapter";
import type { StorageAdapter } from "./types";

export const storage: StorageAdapter = webStorageAdapter;
export type { StorageAdapter };
