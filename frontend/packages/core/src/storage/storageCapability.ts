import type { StoragePort } from "./storagePort";

const NOT_IMPLEMENTED_MESSAGE =
  "Storage adapter is not implemented on this platform yet";

export function createUnimplementedStoragePort(): StoragePort {
  return {
    async get(key: string): Promise<string | null> {
      void key;
      throw new Error(NOT_IMPLEMENTED_MESSAGE);
    },
    async set(key: string, value: string): Promise<void> {
      void key;
      void value;
      throw new Error(NOT_IMPLEMENTED_MESSAGE);
    },
    async remove(key: string): Promise<void> {
      void key;
      throw new Error(NOT_IMPLEMENTED_MESSAGE);
    },
    async keys(): Promise<string[]> {
      throw new Error(NOT_IMPLEMENTED_MESSAGE);
    },
  };
}
