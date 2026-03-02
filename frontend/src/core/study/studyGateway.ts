import type { MemoryState, Rating, WordEntry } from "../../api/types";

export type StudyCard = {
  word: WordEntry;
  memory: MemoryState;
};

export interface StudyGateway {
  getTags(): Promise<string[]>;
  next(tags?: string[], preferredWordId?: string | null): Promise<StudyCard | null>;
  grade(wordId: string, rating: Rating): Promise<MemoryState>;
}
