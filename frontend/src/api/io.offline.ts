/**
 * Offline-first IO API
 * 
 * Export/import operations using local IndexedDB
 */

import type { AppData } from "./types";
import * as localRepo from "../db/localRepository";
import type { VocabFile } from "../db/types";

export const ioApi = {
  /**
   * Export all data (offline)
   */
  export: async (): Promise<AppData> => {
    return await localRepo.exportAppData();
  },

  /**
   * Import data (offline)
   * 
   * @param data - AppData to import
   * @param mode - "merge" or "overwrite"
   */
  import: async (
    data: AppData,
    mode: "merge" | "overwrite" = "merge"
  ): Promise<{ ok: boolean }> => {
    const vocabFile: VocabFile = {
      schemaVersion: data.schemaVersion,
      words: data.words,
      memory: data.memory,
      updatedAt: new Date().toISOString(),
    };

    if (mode === "overwrite") {
      // Replace entire file
      await localRepo.replaceVocabFile(vocabFile, false);
    } else {
      // Merge mode: add new words, skip existing ones
      const existing = await localRepo.getVocabFileForSync();
      const existingIds = new Set(existing.words.map((w) => w.id));

      for (const word of data.words) {
        if (!existingIds.has(word.id)) {
          await localRepo.createWord(word);
        }
      }

      // Merge memory states
      const existingMemoryIds = new Set(existing.memory.map((m) => m.wordId));
      for (const mem of data.memory) {
        if (!existingMemoryIds.has(mem.wordId)) {
          await localRepo.updateMemoryState(mem.wordId, mem);
        }
      }
    }

    return { ok: true };
  },
};
