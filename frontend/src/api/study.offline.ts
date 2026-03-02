/**
 * Offline-first study API
 * 
 * All operations use local IndexedDB repository
 */

import type { WordEntry, MemoryState, Rating } from "./types";
import * as localRepo from "../db/localRepository";

export interface NextCardResponse {
  ok: boolean;
  card: null | { word: WordEntry; memory: MemoryState };
}

export interface GradeResponse {
  ok: boolean;
  memory: MemoryState;
}

/**
 * Simple FSRS-inspired calculation (simplified for offline use)
 * This should match the server-side logic
 */
function calculateNextReview(
  memory: MemoryState,
  rating: Rating
): Partial<MemoryState> {
  const now = new Date();
  let newInterval = memory.intervalDays;
  let newEase = memory.ease;
  let newLevel = memory.memoryLevel;
  let lapseCount = memory.lapseCount;

  switch (rating) {
    case "again":
      // Reset to level 0, short interval
      newLevel = 0;
      newInterval = 1;
      newEase = Math.max(1.3, newEase - 0.2);
      lapseCount += 1;
      break;

    case "hard":
      // Small increase
      newLevel = Math.max(0, newLevel);
      newInterval = Math.max(1, Math.floor(newInterval * 1.2));
      newEase = Math.max(1.3, newEase - 0.15);
      break;

    case "good":
      // Normal increase
      newLevel = newLevel + 1;
      if (newInterval === 0) {
        newInterval = 1;
      } else {
        newInterval = Math.floor(newInterval * newEase);
      }
      break;

    case "easy":
      // Larger increase
      newLevel = newLevel + 1;
      if (newInterval === 0) {
        newInterval = 4;
      } else {
        newInterval = Math.floor(newInterval * newEase * 1.3);
      }
      newEase = newEase + 0.15;
      break;
  }

  const dueAt = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);

  return {
    memoryLevel: newLevel,
    ease: newEase,
    intervalDays: newInterval,
    dueAt: dueAt.toISOString(),
    lastRating: rating,
    lastReviewedAt: now.toISOString(),
    reviewCount: memory.reviewCount + 1,
    lapseCount,
  };
}

export const studyApi = {
  /**
   * Get next card for review (offline)
   */
  next: async (tags?: string[], preferredWordId?: string | null): Promise<NextCardResponse> => {
    if (preferredWordId) {
      const word = await localRepo.getWordById(preferredWordId);
      const memory = await localRepo.getMemoryState(preferredWordId);
      if (word && memory) {
        return {
          ok: true,
          card: { word, memory },
        };
      }
    }

    const card = await localRepo.getNextCard(tags);
    return {
      ok: true,
      card,
    };
  },

  /**
   * Get all unique tags (offline)
   */
  getTags: async (): Promise<{ ok: boolean; tags: string[] }> => {
    const tags = await localRepo.getAllTags();
    return {
      ok: true,
      tags,
    };
  },

  /**
   * Grade a card after review (offline)
   */
  grade: async (wordId: string, rating: Rating): Promise<GradeResponse> => {
    const currentMemory = await localRepo.getMemoryState(wordId);

    // If no memory state exists, create initial one
    const baseMemory: MemoryState = currentMemory || {
      wordId,
      memoryLevel: 0,
      ease: 2.5,
      intervalDays: 0,
      dueAt: new Date().toISOString(),
      lastRating: null,
      lastReviewedAt: null,
      lapseCount: 0,
      reviewCount: 0,
    };

    // Calculate next review
    const updates = calculateNextReview(baseMemory, rating);

    // Update memory state
    const updatedMemory = await localRepo.updateMemoryState(wordId, updates);

    return {
      ok: true,
      memory: updatedMemory,
    };
  },

  /**
   * Reset memory state for a word (offline)
   */
  resetMemory: async (wordId: string): Promise<{ ok: boolean }> => {
    await localRepo.updateMemoryState(wordId, {
      memoryLevel: 0,
      ease: 2.5,
      intervalDays: 0,
      dueAt: new Date().toISOString(),
      lastRating: null,
      lastReviewedAt: null,
      lapseCount: 0,
      reviewCount: 0,
    });
    return { ok: true };
  },
};
