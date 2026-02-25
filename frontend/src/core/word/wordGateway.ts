import type { AppData, MemoryState, WordEntry } from "../../api/types";

export type WordDraft = Omit<WordEntry, "id" | "createdAt" | "updatedAt">;

export type WordListQuery = {
  q?: string;
  pos?: string;
};

export type WordListResult = {
  words: WordEntry[];
  memoryMap: Record<string, MemoryState>;
  total: number;
};

export interface WordGateway {
  list(query: WordListQuery): Promise<WordListResult>;
  get(wordId: string): Promise<WordEntry | null>;
  create(draft: WordDraft): Promise<WordEntry>;
  update(wordId: string, draft: WordDraft): Promise<WordEntry>;
  delete(wordId: string): Promise<void>;
  resetMemory(wordId: string): Promise<void>;
  exportWords(): Promise<AppData>;
}
