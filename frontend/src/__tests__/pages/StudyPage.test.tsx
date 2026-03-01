// src/__tests__/pages/StudyPage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StudyPage } from '../../pages/StudyPage';
import { AuthProvider } from '../../auth/AuthContext';
import * as studyOffline from '../../api/study.offline';

vi.mock('../../api/study.offline', () => ({
  studyApi: {
    next: vi.fn(),
    grade: vi.fn(),
    getTags: vi.fn(),
    cardByWordId: vi.fn(),
  },
}));

vi.mock('../../api/auth', () => ({
  authApi: {
    me: vi.fn(),
    logout: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    status: vi.fn(),
  },
}));

vi.mock('../../api/client', () => ({
  tokenManager: {
    setToken: vi.fn(),
    clearToken: vi.fn(),
    onUnauthorized: vi.fn(),
  },
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    setUserId: vi.fn(),
  },
}));

describe('StudyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display success message when no cards available', async () => {
    vi.mocked(studyOffline.studyApi.getTags).mockResolvedValue({ ok: true, tags: [] });
    vi.mocked(studyOffline.studyApi.next).mockResolvedValue({ ok: true, card: null });

    render(
      <MemoryRouter>
        <AuthProvider>
          <StudyPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Study complete\./i)).toBeInTheDocument();
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

    render(
      <MemoryRouter>
        <AuthProvider>
          <StudyPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('vocabulary')).toBeInTheDocument();
      expect(screen.getByTestId('rnw-study-open-examples')).toBeInTheDocument();
    });
  });

  it('should display error message on API failure', async () => {
    vi.mocked(studyOffline.studyApi.getTags).mockResolvedValue({ ok: true, tags: [] });
    vi.mocked(studyOffline.studyApi.next).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <AuthProvider>
          <StudyPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  it('supports opening a specific word via query parameter', async () => {
    const mockCard = {
      word: {
        id: 'w2',
        headword: 'focus',
        pos: 'verb' as const,
        meaningJa: '集中する',
        examples: [],
        tags: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      memory: {
        wordId: 'w2',
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
    vi.mocked(studyOffline.studyApi.cardByWordId).mockResolvedValue({ ok: true, card: mockCard });

    render(
      <MemoryRouter initialEntries={["/study?wordId=w2"]}>
        <AuthProvider>
          <StudyPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(studyOffline.studyApi.cardByWordId).toHaveBeenCalledWith('w2');
      expect(screen.getByText('focus')).toBeInTheDocument();
    });
  });
});
