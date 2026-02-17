// src/api/study.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { studyApi } from '../../api/study';
import * as client from '../../api/client';

vi.mock('../../api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
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
});
