/**
 * IndexedDB wrapper for local vocabulary storage
 * 
 * Schema:
 * - Store: "vocab" (key: "file")
 * - Store: "sync" (key: "metadata")
 */

import type { VocabFile, SyncMetadata } from "./types";

const DB_NAME = "LexiMemoryDB";
const DB_VERSION = 1;

const STORE_VOCAB = "vocab";
const STORE_SYNC = "sync";

const KEY_FILE = "file";
const KEY_METADATA = "metadata";

/**
 * Open IndexedDB connection with error handling
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(
          new Error(
            `Failed to open IndexedDB: ${request.error?.message || "Unknown error"}`
          )
        );
      };

      request.onsuccess = () => {
        const db = request.result;
        if (!db) {
          reject(new Error("IndexedDB connection returned null"));
          return;
        }
        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(STORE_VOCAB)) {
          db.createObjectStore(STORE_VOCAB);
        }
        if (!db.objectStoreNames.contains(STORE_SYNC)) {
          db.createObjectStore(STORE_SYNC);
        }
      };

      request.onblocked = () => {
        reject(
          new Error(
            "IndexedDB upgrade blocked. Please close other tabs with this app."
          )
        );
      };
    } catch (error) {
      reject(
        new Error(
          `IndexedDB initialization error: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  });
}

/**
 * Get vocabulary file from IndexedDB
 */
export async function getVocabFile(): Promise<VocabFile | null> {
  const db = await openDB();
  try {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_VOCAB, "readonly");
        const store = tx.objectStore(STORE_VOCAB);
        const request = store.get(KEY_FILE);

        request.onerror = () => {
          reject(
            new Error(
              `Failed to read vocab file: ${request.error?.message || "Unknown error"}`
            )
          );
        };
        request.onsuccess = () => resolve(request.result || null);

        tx.onerror = () => {
          reject(
            new Error(
              `Transaction error: ${tx.error?.message || "Unknown error"}`
            )
          );
        };
      } catch (error) {
        reject(
          new Error(
            `Failed to create transaction: ${error instanceof Error ? error.message : String(error)}`
          )
        );
      }
    });
  } finally {
    db.close();
  }
}

/**
 * Save vocabulary file to IndexedDB
 */
export async function saveVocabFile(file: VocabFile): Promise<void> {
  const db = await openDB();
  try {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_VOCAB, "readwrite");
        const store = tx.objectStore(STORE_VOCAB);
        const request = store.put(file, KEY_FILE);

        request.onerror = () => {
          reject(
            new Error(
              `Failed to save vocab file: ${request.error?.message || "Unknown error"}`
            )
          );
        };
        request.onsuccess = () => resolve();

        tx.onerror = () => {
          reject(
            new Error(
              `Transaction error: ${tx.error?.message || "Unknown error"}`
            )
          );
        };
      } catch (error) {
        reject(
          new Error(
            `Failed to create transaction: ${error instanceof Error ? error.message : String(error)}`
          )
        );
      }
    });
  } finally {
    db.close();
  }
}

/**
 * Get sync metadata from IndexedDB
 */
export async function getSyncMetadata(): Promise<SyncMetadata | null> {
  const db = await openDB();
  try {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_SYNC, "readonly");
        const store = tx.objectStore(STORE_SYNC);
        const request = store.get(KEY_METADATA);

        request.onerror = () => {
          reject(
            new Error(
              `Failed to read sync metadata: ${request.error?.message || "Unknown error"}`
            )
          );
        };
        request.onsuccess = () => resolve(request.result || null);

        tx.onerror = () => {
          reject(
            new Error(
              `Transaction error: ${tx.error?.message || "Unknown error"}`
            )
          );
        };
      } catch (error) {
        reject(
          new Error(
            `Failed to create transaction: ${error instanceof Error ? error.message : String(error)}`
          )
        );
      }
    });
  } finally {
    db.close();
  }
}

/**
 * Save sync metadata to IndexedDB
 */
export async function saveSyncMetadata(metadata: SyncMetadata): Promise<void> {
  const db = await openDB();
  try {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_SYNC, "readwrite");
        const store = tx.objectStore(STORE_SYNC);
        const request = store.put(metadata, KEY_METADATA);

        request.onerror = () => {
          reject(
            new Error(
              `Failed to save sync metadata: ${request.error?.message || "Unknown error"}`
            )
          );
        };
        request.onsuccess = () => resolve();

        tx.onerror = () => {
          reject(
            new Error(
              `Transaction error: ${tx.error?.message || "Unknown error"}`
            )
          );
        };
      } catch (error) {
        reject(
          new Error(
            `Failed to create transaction: ${error instanceof Error ? error.message : String(error)}`
          )
        );
      }
    });
  } finally {
    db.close();
  }
}

/**
 * Initialize database with default values if empty
 */
export async function initializeDB(): Promise<void> {
  const file = await getVocabFile();
  const metadata = await getSyncMetadata();

  if (!file) {
    const emptyFile: VocabFile = {
      schemaVersion: 1,
      words: [],
      memory: [],
      updatedAt: new Date().toISOString(),
    };
    await saveVocabFile(emptyFile);
  }

  if (!metadata) {
    const initialMetadata: SyncMetadata = {
      clientId: crypto.randomUUID(),
      serverRev: 0,
      dirty: false,
      lastSyncAt: null,
    };
    await saveSyncMetadata(initialMetadata);
  }
}

/**
 * Clear all data (for testing or logout)
 */
export async function clearDB(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_VOCAB, STORE_SYNC], "readwrite");
    
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();

    tx.objectStore(STORE_VOCAB).clear();
    tx.objectStore(STORE_SYNC).clear();
  });
}
