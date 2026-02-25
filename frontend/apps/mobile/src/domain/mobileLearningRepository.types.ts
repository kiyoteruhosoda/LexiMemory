import type { MemoryState, Rating, WordEntry } from "../../../../src/api/types";
import type { WordDraft, WordListQuery, WordListResult } from "../../../../src/core/word/wordGateway";
import type { StudyCard } from "../../../../src/core/study/studyGateway";
import type { SyncResult, SyncStatus, SyncSuccess } from "../../../../src/core/sync/syncGateway";
import type { ConflictResolution } from "../../../../src/db/types";

export interface MobileLearningRepositoryPort {
  listWords(query: WordListQuery): WordListResult;
  getWord(wordId: string): WordEntry | null;
  createWord(draft: WordDraft): WordEntry;
  updateWord(wordId: string, draft: WordDraft): WordEntry;
  deleteWord(wordId: string): void;
  resetMemory(wordId: string): void;
  listTags(): string[];
  nextCard(tags?: string[]): StudyCard | null;
  gradeCard(wordId: string, rating: Rating): MemoryState;
  getSyncStatus(): SyncStatus;
  sync(): SyncResult;
  resolveConflict(strategy: ConflictResolution): SyncSuccess;
}
