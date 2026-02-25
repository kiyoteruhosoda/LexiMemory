import type { MemoryState, Rating, WordEntry } from "../../../../src/api/types";
import type { WordDraft, WordListQuery, WordListResult } from "../../../../src/core/word/wordGateway";
import type { StudyCard } from "../../../../src/core/study/studyGateway";
import type { SyncResult, SyncStatus, SyncSuccess } from "../../../../src/core/sync/syncGateway";
import type { ConflictResolution } from "../../../../src/db/types";

const DAY_MS = 24 * 60 * 60 * 1000;

function nowIso(): string {
  return new Date().toISOString();
}

function uid(): string {
  return `mobile-${Math.random().toString(36).slice(2, 10)}`;
}

function nextIntervalByRating(rating: Rating, current: number): number {
  switch (rating) {
    case "again":
      return 1;
    case "hard":
      return Math.max(1, Math.round(current * 1.2));
    case "good":
      return Math.max(1, Math.round(current * 2));
    case "easy":
      return Math.max(2, Math.round(current * 3));
  }
}

export class MobileLearningRepository {
  private words: WordEntry[] = [];
  private memoryMap: Record<string, MemoryState> = {};
  private serverRev = 1;
  private lastSyncAt: string | null = null;
  private dirty = false;

  constructor() {
    this.seed();
  }

  listWords(query: WordListQuery): WordListResult {
    const q = query.q?.trim().toLowerCase();
    const filtered = this.words.filter((word) => {
      if (query.pos && word.pos !== query.pos) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        word.headword.toLowerCase().includes(q)
        || word.meaningJa.toLowerCase().includes(q)
        || word.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });

    return {
      words: filtered,
      memoryMap: this.memoryMap,
      total: filtered.length,
    };
  }

  getWord(wordId: string): WordEntry | null {
    return this.words.find((word) => word.id === wordId) ?? null;
  }

  createWord(draft: WordDraft): WordEntry {
    const timestamp = nowIso();
    const word: WordEntry = {
      ...draft,
      id: uid(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.words.unshift(word);
    this.memoryMap[word.id] = this.createMemory(word.id);
    this.markDirty();
    return word;
  }

  updateWord(wordId: string, draft: WordDraft): WordEntry {
    const idx = this.words.findIndex((word) => word.id === wordId);
    if (idx < 0) {
      throw new Error("Word not found");
    }

    const current = this.words[idx];
    const updated: WordEntry = {
      ...current,
      ...draft,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: nowIso(),
    };

    this.words[idx] = updated;
    this.markDirty();
    return updated;
  }

  deleteWord(wordId: string): void {
    this.words = this.words.filter((word) => word.id !== wordId);
    delete this.memoryMap[wordId];
    this.markDirty();
  }

  resetMemory(wordId: string): void {
    if (!this.memoryMap[wordId]) {
      return;
    }
    this.memoryMap[wordId] = this.createMemory(wordId);
    this.markDirty();
  }

  listTags(): string[] {
    return [...new Set(this.words.flatMap((word) => word.tags))].sort();
  }

  nextCard(tags?: string[]): StudyCard | null {
    const tagSet = new Set(tags ?? []);
    const candidates = this.words.filter((word) => {
      if (tagSet.size === 0) {
        return true;
      }
      return word.tags.some((tag) => tagSet.has(tag));
    });

    if (candidates.length === 0) {
      return null;
    }

    const sorted = candidates
      .map((word) => ({ word, memory: this.memoryMap[word.id] ?? this.createMemory(word.id) }))
      .sort((a, b) => Date.parse(a.memory.dueAt) - Date.parse(b.memory.dueAt));

    return sorted[0];
  }

  gradeCard(wordId: string, rating: Rating): MemoryState {
    const current = this.memoryMap[wordId] ?? this.createMemory(wordId);
    const intervalDays = nextIntervalByRating(rating, current.intervalDays);
    const now = Date.now();

    const next: MemoryState = {
      ...current,
      memoryLevel: rating === "again" ? Math.max(0, current.memoryLevel - 1) : current.memoryLevel + 1,
      intervalDays,
      dueAt: new Date(now + intervalDays * DAY_MS).toISOString(),
      lastRating: rating,
      lastReviewedAt: new Date(now).toISOString(),
      lapseCount: rating === "again" ? current.lapseCount + 1 : current.lapseCount,
      reviewCount: current.reviewCount + 1,
    };

    this.memoryMap[wordId] = next;
    this.markDirty();
    return next;
  }

  getSyncStatus(): SyncStatus {
    return {
      online: true,
      dirty: this.dirty,
      lastSyncAt: this.lastSyncAt,
      clientId: "mobile-local-client",
      serverRev: this.serverRev,
    };
  }

  sync(): SyncResult {
    this.serverRev += 1;
    this.lastSyncAt = nowIso();
    this.dirty = false;

    return {
      status: "success",
      serverRev: this.serverRev,
      updatedAt: this.lastSyncAt,
    };
  }

  resolveConflict(strategy: ConflictResolution): SyncSuccess {
    void strategy;
    this.serverRev += 1;
    this.lastSyncAt = nowIso();
    this.dirty = false;
    return {
      status: "success",
      serverRev: this.serverRev,
      updatedAt: this.lastSyncAt,
    };
  }

  private markDirty(): void {
    this.dirty = true;
  }

  private createMemory(wordId: string): MemoryState {
    return {
      wordId,
      memoryLevel: 0,
      ease: 2.5,
      intervalDays: 1,
      dueAt: nowIso(),
      lastRating: null,
      lastReviewedAt: null,
      lapseCount: 0,
      reviewCount: 0,
    };
  }

  private seed(): void {
    const first = this.createWord({
      headword: "ubiquitous",
      pronunciation: "juːˈbɪkwɪtəs",
      pos: "adj",
      meaningJa: "いたるところに存在する",
      examples: [{ id: uid(), en: "Smartphones are ubiquitous.", ja: "スマートフォンはどこにでもある。", source: null }],
      tags: ["daily", "advanced"],
      memo: "Useful for essays",
    });
    const second = this.createWord({
      headword: "meticulous",
      pronunciation: "məˈtɪkjʊləs",
      pos: "adj",
      meaningJa: "細部まで注意深い",
      examples: [{ id: uid(), en: "She is meticulous about notes.", ja: "彼女はノートを几帳面に取る。", source: null }],
      tags: ["writing"],
      memo: null,
    });
    this.memoryMap[first.id] = this.createMemory(first.id);
    this.memoryMap[second.id] = this.createMemory(second.id);
    this.dirty = false;
  }
}
