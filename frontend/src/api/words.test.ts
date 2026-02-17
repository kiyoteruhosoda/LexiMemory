// src/api/words.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { wordsApi } from './words';
import * as client from './client';
import type { Pos } from './types';

vi.mock('./client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    del: vi.fn(),
  },
}));

describe('Words API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('should return list of words', async () => {
      const mockWords = [
        { wordId: '1', headword: 'hello', meaning: 'こんにちは' },
        { wordId: '2', headword: 'world', meaning: '世界' },
      ];
      vi.mocked(client.api.get).mockResolvedValueOnce({ ok: true, words: mockWords });

      const result = await wordsApi.list();
      expect(result).toEqual(mockWords);
      expect(client.api.get).toHaveBeenCalledWith('/words');
    });
  });

  describe('create', () => {
    it('should create new word', async () => {
      const newWord = { headword: 'apple', meaningJa: 'りんご', pos: 'noun' as Pos, pronunciation: null, examples: [], tags: [] };
      const mockCreated = { id: '999', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', ...newWord };
      vi.mocked(client.api.post).mockResolvedValueOnce({ ok: true, word: mockCreated });

      const result = await wordsApi.create(newWord);
      expect(result).toEqual(mockCreated);
      expect(client.api.post).toHaveBeenCalledWith('/words', newWord);
    });
  });

  describe('update', () => {
    it('should update existing word', async () => {
      const updates = { headword: 'update', meaningJa: '更新されました', pos: 'verb' as Pos, pronunciation: null, examples: [], tags: [] };
      const mockUpdated = { id: '111', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-02T00:00:00Z', ...updates };
      vi.mocked(client.api.put).mockResolvedValueOnce({ ok: true, word: mockUpdated });

      const result = await wordsApi.update('111', updates);
      expect(result).toEqual(mockUpdated);
      expect(client.api.put).toHaveBeenCalledWith('/words/111', updates);
    });
  });

  describe('delete', () => {
    it('should delete word', async () => {
      vi.mocked(client.api.del).mockResolvedValueOnce({ ok: true });

      await wordsApi.delete('222');
      expect(client.api.del).toHaveBeenCalledWith('/words/222');
    });
  });
});
