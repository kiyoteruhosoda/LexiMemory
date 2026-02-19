/**
 * Local database types for offline-first architecture
 */

import type { WordEntry, MemoryState } from "../api/types";

/**
 * Vocabulary file structure stored in IndexedDB
 */
export interface VocabFile {
  /** Schema version for migration compatibility */
  schemaVersion: number;
  /** All vocabulary words */
  words: WordEntry[];
  /** Memory states for spaced repetition */
  memory: MemoryState[];
  /** Client-side last modified timestamp (UTC ISO8601) */
  updatedAt: string;
}

/**
 * Sync metadata stored alongside vocabulary file
 */
export interface SyncMetadata {
  /** Unique client identifier (UUID) */
  clientId: string;
  /** Server revision number from last successful sync */
  serverRev: number;
  /** Flag indicating unsynchronized local changes */
  dirty: boolean;
  /** Last successful sync timestamp (UTC ISO8601) */
  lastSyncAt: string | null;
}

/**
 * Server response for GET /vocab
 */
export interface VocabServerData {
  /** Server revision number */
  serverRev: number;
  /** Vocabulary file data */
  file: VocabFile;
  /** Server-side last modified timestamp */
  updatedAt: string;
  /** Client ID that last updated the server */
  updatedByClientId: string;
}

/**
 * Request body for PUT /vocab (normal sync)
 */
export interface VocabSyncRequest {
  /** Expected server revision (for conflict detection) */
  serverRev: number;
  /** Vocabulary file data to upload */
  file: VocabFile;
  /** Client identifier */
  clientId: string;
}

/**
 * Request body for PUT /vocab?force=true (force overwrite)
 */
export interface VocabForceSyncRequest {
  /** Vocabulary file data to upload */
  file: VocabFile;
  /** Client identifier */
  clientId: string;
}

/**
 * Response from PUT /vocab
 */
export interface VocabSyncResponse {
  /** Success flag */
  ok: boolean;
  /** New server revision number */
  serverRev: number;
  /** Server-side timestamp */
  updatedAt: string;
}

/**
 * Conflict resolution strategy
 */
export type ConflictResolution = "fetch-server" | "force-local";
