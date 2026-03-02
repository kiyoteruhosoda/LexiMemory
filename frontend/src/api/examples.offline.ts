// frontend/src/api/examples.offline.ts

/**
 * Offline-first examples test API
 * 
 * All operations use local IndexedDB repository
 */

import type { NextExampleResponse, ExampleTestItem, WordEntry } from "./types";
import * as localRepo from "../db/localRepository";

export const examplesApi = {
  /**
   * Get random example sentence for testing (offline)
   * @param tags - Filter by tags
   * @param lastExampleId - Avoid returning this example ID (unless it's the only one)
   */
  async next(tags?: string[], lastExampleId?: string | null, preferredWordId?: string | null): Promise<NextExampleResponse> {
    const result = await localRepo.getWords();
    const words = result.words;
    
    // Filter by tags if specified
    let filtered = words;
    if (tags && tags.length > 0) {
      filtered = words.filter((w: WordEntry) => w.tags.some((t: string) => tags.includes(t)));
    }
    
    // Collect all examples from all words
    const examplesPool: Array<{ word: WordEntry; example: WordEntry['examples'][0] }> = [];
    for (const word of filtered) {
      if (word.examples && word.examples.length > 0) {
        for (const example of word.examples) {
          examplesPool.push({ word, example });
        }
      }
    }
    
    if (examplesPool.length === 0) {
      return { example: null };
    }

    if (preferredWordId) {
      const preferredExamples = examplesPool.filter(item => item.word.id === preferredWordId);
      if (preferredExamples.length > 0) {
        examplesPool.splice(0, examplesPool.length, ...preferredExamples);
      }
    }
    
    // Filter out last example if there are alternatives
    let availableExamples = examplesPool;
    if (lastExampleId && examplesPool.length > 1) {
      const filtered = examplesPool.filter(item => item.example.id !== lastExampleId);
      if (filtered.length > 0) {
        availableExamples = filtered;
      }
    }
    
    // Pick random example (using better randomization)
    const randomIndex = Math.floor(Math.random() * availableExamples.length);
    const selected = availableExamples[randomIndex];
    
    const testItem: ExampleTestItem = {
      id: selected.example.id,
      en: selected.example.en,
      ja: selected.example.ja,
      source: selected.example.source,
      word: {
        id: selected.word.id,
        headword: selected.word.headword,
        pos: selected.word.pos,
        meaningJa: selected.word.meaningJa,
        tags: selected.word.tags
      }
    };
    
    return { example: testItem };
  },

  /**
   * Get all tags from words that have examples (offline)
   */
  async getTags(): Promise<{ tags: string[] }> {
    const result = await localRepo.getWords();
    const words = result.words;
    
    const tagsSet = new Set<string>();
    for (const word of words) {
      if (word.examples && word.examples.length > 0) {
        word.tags.forEach((tag: string) => tagsSet.add(tag));
      }
    }
    
    return { tags: Array.from(tagsSet).sort() };
  }
};
