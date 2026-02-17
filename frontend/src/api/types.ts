export type Pos =
  | "noun" | "verb" | "adj" | "adv" | "prep"
  | "conj" | "pron" | "det" | "interj" | "other";

export type Rating = "again" | "hard" | "good" | "easy";

export interface ExampleSentence {
  id: string;
  en: string;
  ja?: string | null;
  source?: string | null;
}

export interface WordEntry {
  id: string;
  headword: string;
  pronunciation?: string | null;
  pos: Pos;
  meaningJa: string;
  examples: ExampleSentence[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MemoryState {
  wordId: string;
  memoryLevel: number;
  ease: number;
  intervalDays: number;
  dueAt: string;
  lastReviewedAt?: string | null;
  lapseCount: number;
  reviewCount: number;
}

export interface MeResponse {
  userId: string;
  username: string;
}

export interface NextCardResponse {
  ok: boolean;
  card: null | { word: WordEntry; memory: MemoryState };
}
