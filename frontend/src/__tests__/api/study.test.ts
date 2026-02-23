// src/api/study.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { studyApi } from '../../api/study';
import * as client from '../../api/client';

vi.mock('../../api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  tokenManager: {
    setToken: vi.fn(),
    clearToken: vi.fn(),
    onUnauthorized: vi.fn(),
    getToken: vi.fn(() => null),
  },
}));

describe('Study API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('next', () => {
    it('should return next card to study', async () => {
      const mockCard = {
        wordId: 'w1',
        headword: 'vocabulary',
        meaningJa: '語彙',
      };
      vi.mocked(client.api.get).mockResolvedValueOnce({ ok: true, card: mockCard });

      const result = await studyApi.next();
      expect(result).toEqual({ ok: true, card: mockCard });
      expect(client.api.get).toHaveBeenCalledWith('/study/next');
    });

    it('should return null when no cards available', async () => {
      vi.mocked(client.api.get).mockResolvedValueOnce({ ok: true, card: null });

      const result = await studyApi.next();
      expect(result).toEqual({ ok: true, card: null });
    });
  });

  describe('grade', () => {
    it('should submit grade for card', async () => {
      const mockUpdated = {
        wordId: 'w2',
        memoryLevel: 2,
        ease: 2.6,
        intervalDays: 3,
        dueAt: '2024-01-15T10:00:00Z',
      };
      vi.mocked(client.api.post).mockResolvedValueOnce({ ok: true, memory: mockUpdated });

      const result = await studyApi.grade('w2', 'good');
      expect(result).toEqual({ ok: true, memory: mockUpdated });
      expect(client.api.post).toHaveBeenCalledWith('/study/grade', {
        wordId: 'w2',
        rating: 'good',
      });
    });
  });

  describe('resetMemory', () => {
    it('should reset memory state for a word', async () => {
      vi.mocked(client.api.post).mockResolvedValueOnce({ ok: true });

      const result = await studyApi.resetMemory('w3');
      expect(result).toEqual({ ok: true });
      expect(client.api.post).toHaveBeenCalledWith('/study/reset/w3');
    });
  });

  describe('getTags', () => {
    it('should return list of tags', async () => {
      const mockTags = ['business', 'travel', 'idiom'];
      vi.mocked(client.api.get).mockResolvedValueOnce({ ok: true, tags: mockTags });

      const result = await studyApi.getTags();
      expect(result).toEqual({ ok: true, tags: mockTags });
      expect(client.api.get).toHaveBeenCalledWith('/study/tags');
    });

    it('should return empty array when no tags', async () => {
      vi.mocked(client.api.get).mockResolvedValueOnce({ ok: true, tags: [] });

      const result = await studyApi.getTags();
      expect(result).toEqual({ ok: true, tags: [] });
    });
  });

  describe('next with tag filters', () => {
    it('should filter by single tag', async () => {
      const mockCard = {
        wordId: 'w4',
        headword: 'business',
        meaningJa: 'ビジネス',
      };
      vi.mocked(client.api.get).mockResolvedValueOnce({ ok: true, card: mockCard });

      const result = await studyApi.next(['business']);
      expect(result).toEqual({ ok: true, card: mockCard });
      expect(client.api.get).toHaveBeenCalledWith('/study/next?tags=business');
    });

    it('should filter by multiple tags', async () => {
      const mockCard = {
        wordId: 'w5',
        headword: 'journey',
        meaningJa: '旅',
      };
      vi.mocked(client.api.get).mockResolvedValueOnce({ ok: true, card: mockCard });

      const result = await studyApi.next(['travel', 'casual']);
      expect(result).toEqual({ ok: true, card: mockCard });
      expect(client.api.get).toHaveBeenCalledWith('/study/next?tags=travel&tags=casual');
    });

    it('should not add query params when tags array is empty', async () => {
      const mockCard = {
        wordId: 'w6',
        headword: 'word',
        meaningJa: '単語',
      };
      vi.mocked(client.api.get).mockResolvedValueOnce({ ok: true, card: mockCard });

      const result = await studyApi.next([]);
      expect(result).toEqual({ ok: true, card: mockCard });
      expect(client.api.get).toHaveBeenCalledWith('/study/next');
    });
  });
});
