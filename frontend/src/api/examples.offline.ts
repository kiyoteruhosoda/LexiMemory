// frontend/src/api/examples.offline.ts

/**
 * Offline-first examples test API
 * 
 * All operations use local IndexedDB repository
 */

import type { NextExampleResponse, ExampleTestItem, WordEntry } from "./types";
import * as localRepo from "../db/localRepository";

type ExamplePoolItem = { word: WordEntry; example: WordEntry["examples"][0] };

function toExampleTestItem(selected: ExamplePoolItem): ExampleTestItem {
  return {
    id: selected.example.id,
    en: selected.example.en,
    ja: selected.example.ja,
    source: selected.example.source,
    word: {
      id: selected.word.id,
      headword: selected.word.headword,
      pos: selected.word.pos,
      meaningJa: selected.word.meaningJa,
      tags: selected.word.tags,
    },
  };
}

function pickExample(pool: ExamplePoolItem[], lastExampleId?: string | null): ExamplePoolItem {
  let available = pool;
  if (lastExampleId && pool.length > 1) {
    const filtered = pool.filter((item) => item.example.id !== lastExampleId);
    if (filtered.length > 0) {
      available = filtered;
    }
  }

  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex];
}

export const examplesApi = {
  /**
   * Get random example sentence for testing (offline)
   * @param tags - Filter by tags
   * @param lastExampleId - Avoid returning this example ID (unless it's the only one)
   */
  async next(tags?: string[], lastExampleId?: string | null): Promise<NextExampleResponse> {
    const result = await localRepo.getWords();
    const words = result.words;

    const filtered = tags && tags.length > 0
      ? words.filter((w: WordEntry) => w.tags.some((t: string) => tags.includes(t)))
      : words;

    const examplesPool: ExamplePoolItem[] = [];
    for (const word of filtered) {
      if (!word.examples?.length) continue;
      for (const example of word.examples) {
        examplesPool.push({ word, example });
      }
    }

    if (examplesPool.length === 0) {
      return { example: null };
    }

    return { example: toExampleTestItem(pickExample(examplesPool, lastExampleId)) };
  },

  async byWordId(wordId: string, lastExampleId?: string | null): Promise<NextExampleResponse> {
    const word = await localRepo.getWordById(wordId);
    if (!word || !word.examples?.length) {
      return { example: null };
    }

    const pool: ExamplePoolItem[] = word.examples.map((example) => ({ word, example }));
    return { example: toExampleTestItem(pickExample(pool, lastExampleId)) };
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
