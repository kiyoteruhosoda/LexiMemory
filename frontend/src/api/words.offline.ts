/**
 * Offline-first words API
 * 
 * All operations use local IndexedDB repository
 * Changes are marked as dirty for later sync
 */

import type { WordEntry, MemoryState } from "./types";
import * as localRepo from "../db/localRepository";

type WordsListResponse = {
  words: WordEntry[];
  memoryMap: Record<string, MemoryState>;
  total: number;
};

export const wordsApi = {
  /**
   * List words with optional filtering (offline)
   */
  list: async (q?: string, pos?: string, tags?: string[]): Promise<WordsListResponse> => {
    return await localRepo.getWords({ q, pos, tags });
  },

  /**
   * Get a single word by ID (offline)
   */
  get: async (id: string): Promise<WordEntry | null> => {
    return await localRepo.getWordById(id);
  },

  /**
   * Create a new word (offline)
   */
  create: async (
    word: Omit<WordEntry, "id" | "createdAt" | "updatedAt">
  ): Promise<WordEntry> => {
    return await localRepo.createWord(word);
  },

  /**
   * Update an existing word (offline)
   */
  update: async (
    id: string,
    word: Omit<WordEntry, "id" | "createdAt" | "updatedAt">
  ): Promise<WordEntry> => {
    return await localRepo.updateWord(id, word);
  },

  /**
   * Delete a word (offline)
   */
  delete: async (id: string): Promise<{ ok: boolean }> => {
    await localRepo.deleteWord(id);
    return { ok: true };
  },

  getTags: async (): Promise<{ ok: boolean; tags: string[] }> => {
    const tags = await localRepo.getAllTags();
    return {
      ok: true,
      tags,
    };
  },
};
