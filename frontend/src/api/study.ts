import { api } from "./client";
import type { NextCardResponse, Rating, MemoryState } from "./types";

export const studyApi = {
  next: (tags?: string[]) => {
    const params = tags && tags.length > 0 
      ? new URLSearchParams(tags.map(tag => ['tags', tag]))
      : undefined;
    const url = params ? `/study/next?${params.toString()}` : "/study/next";
    return api.get<NextCardResponse>(url);
  },
  grade: (wordId: string, rating: Rating) =>
    api.post<{ ok: boolean; memory: MemoryState }>("/study/grade", { wordId, rating }),
  resetMemory: (wordId: string) =>
    api.post<{ ok: boolean }>(`/study/reset/${wordId}`),
  getTags: () =>
    api.get<{ ok: boolean; tags: string[] }>("/study/tags"),
};
