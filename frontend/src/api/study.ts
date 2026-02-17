import { api } from "./client";
import type { NextCardResponse, Rating, MemoryState } from "./types";

export const studyApi = {
  next: () => api.get<NextCardResponse>("/study/next"),
  grade: (wordId: string, rating: Rating) =>
    api.post<{ ok: boolean; memory: MemoryState }>("/study/grade", { wordId, rating }),
};
