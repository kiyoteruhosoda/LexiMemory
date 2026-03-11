import type { AppData, AppDataForImport, ExampleSentence, ExampleSentenceForImport, MemoryState, MemoryStateForImport, WordEntry, WordEntryForImport } from "../../../../src/api/types";
import type { VocabFile } from "../../../../src/db/types";
import type { MobileLearningRepositoryPort } from "../domain/mobileLearningRepository.types";

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function normalizeForImport(data: AppDataForImport): VocabFile {
  const now = new Date().toISOString();

  const words: WordEntry[] = data.words.map((w: WordEntryForImport) => {
    const wordId = w.id || generateUUID();
    const examples: ExampleSentence[] = (w.examples || []).map((ex: ExampleSentenceForImport) => ({
      id: ex.id || generateUUID(),
      en: ex.en,
      ja: ex.ja ?? null,
      source: ex.source ?? null,
    }));
    return {
      id: wordId,
      headword: w.headword,
      pronunciation: w.pronunciation ?? null,
      pos: w.pos,
      meaningJa: w.meaningJa,
      examples,
      tags: w.tags ?? [],
      memo: w.memo ?? null,
      createdAt: w.createdAt ?? now,
      updatedAt: w.updatedAt ?? now,
    };
  });

  const memory: MemoryState[] = (data.memory ?? []).map((m: MemoryStateForImport) => ({
    wordId: m.wordId,
    memoryLevel: m.memoryLevel ?? 0,
    ease: m.ease ?? 2.5,
    intervalDays: m.intervalDays ?? 0,
    dueAt: m.dueAt ?? now,
    lastRating: m.lastRating ?? null,
    lastReviewedAt: m.lastReviewedAt ?? null,
    lapseCount: m.lapseCount ?? 0,
    reviewCount: m.reviewCount ?? 0,
  }));

  return {
    schemaVersion: data.schemaVersion ?? 1,
    words,
    memory,
    updatedAt: now,
  };
}

export interface MobileIoGateway {
  exportData(): AppData;
  importData(raw: AppDataForImport, mode: "merge" | "overwrite"): void;
}

export function createMobileIoGateway(repository: MobileLearningRepositoryPort): MobileIoGateway {
  return {
    exportData(): AppData {
      const file = repository.exportVocabFile();
      return {
        schemaVersion: file.schemaVersion,
        exportedAt: new Date().toISOString(),
        words: file.words,
        memory: file.memory,
      };
    },

    importData(raw: AppDataForImport, mode: "merge" | "overwrite"): void {
      if (!raw.words || !Array.isArray(raw.words)) {
        throw new Error("Invalid import data: 'words' must be an array");
      }
      const vocabFile = normalizeForImport(raw);
      repository.importVocabFile(vocabFile, mode);
    },
  };
}
