// src/__tests__/pages/StudyPage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { StudyPage } from '../../pages/StudyPage';
import * as studyOffline from '../../api/study.offline';

vi.mock('../../api/study.offline', () => ({
  studyApi: {
    next: vi.fn(),
    grade: vi.fn(),
    getTags: vi.fn(),
  },
}));

describe('StudyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display success message when no cards available', async () => {
    vi.mocked(studyOffline.studyApi.getTags).mockResolvedValue({ ok: true, tags: [] });
    vi.mocked(studyOffline.studyApi.next).mockResolvedValue({ ok: true, card: null });

    render(<StudyPage />);

    await waitFor(() => {
      expect(screen.getByText('Study Complete')).toBeInTheDocument();
    });
  });

  it('should display word card when available', async () => {
    const mockCard = {
      word: {
        id: 'w1',
        headword: 'vocabulary',
        pos: 'noun' as const,
        meaningJa: '語彙',
        examples: [],
        tags: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      memory: {
        wordId: 'w1',
        dueAt: '2024-01-01T00:00:00Z',
        memoryLevel: 1,
        ease: 2.5,
        intervalDays: 1,
        reviewCount: 0,
        lapseCount: 0,
        lastRating: null,
        lastReviewedAt: null,
      },
    };

    vi.mocked(studyOffline.studyApi.getTags).mockResolvedValue({ ok: true, tags: [] });
    vi.mocked(studyOffline.studyApi.next).mockResolvedValue({ ok: true, card: mockCard });

    render(<StudyPage />);

    await waitFor(() => {
      expect(screen.getByText('vocabulary')).toBeInTheDocument();
    });
  });

  it('should display error message on API failure', async () => {
    vi.mocked(studyOffline.studyApi.getTags).mockResolvedValue({ ok: true, tags: [] });
    vi.mocked(studyOffline.studyApi.next).mockRejectedValue(new Error('Network error'));

    render(<StudyPage />);

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });
});
