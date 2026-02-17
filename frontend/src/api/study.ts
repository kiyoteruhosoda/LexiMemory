import { api } from "./client";
import type { NextCardResponse, Rating, MemoryState } from "./types";

export const studyApi = {
  next: () => api.get<NextCardResponse>("/study/next"),
  grade: (wordId: string, rating: Rating) =>
    api.post<{ ok: boolean; memory: MemoryState }>("/study/grade", { wordId, rating }),
  resetMemory: (wordId: string) =>
    api.post<{ ok: boolean }>(`/study/reset/${wordId}`),
};
