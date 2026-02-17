import { api } from "./client";
import type { WordEntry } from "./types";

export const wordsApi = {
  list: (q?: string, pos?: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (pos) params.set("pos", pos);
    const qs = params.toString();
    return api.get<WordEntry[]>(`/words${qs ? `?${qs}` : ""}`);
  },

  create: (word: Omit<WordEntry, "id" | "createdAt" | "updatedAt">) =>
    api.post<WordEntry>("/words", word),

  update: (id: string, word: WordEntry) =>
    api.put<WordEntry>(`/words/${id}`, word),

  delete: (id: string) => api.del<{ ok: boolean }>(`/words/${id}`),
};
