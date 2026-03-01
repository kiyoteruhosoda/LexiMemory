import type { MemoryState, Rating, WordEntry } from "../../api/types";

export type StudyCard = {
  word: WordEntry;
  memory: MemoryState;
};

export interface StudyGateway {
  getTags(): Promise<string[]>;
  next(tags?: string[]): Promise<StudyCard | null>;
  byWordId(wordId: string): Promise<StudyCard | null>;
  grade(wordId: string, rating: Rating): Promise<MemoryState>;
}
