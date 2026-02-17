import { api } from "./client";
import type { WordEntry } from "./types";

type WordsListResponse = { ok: boolean; words: WordEntry[] };
type WordCreateResponse = { ok: boolean; word: WordEntry };
type WordUpdateResponse = { ok: boolean; word: WordEntry };

export const wordsApi = {
  list: async (q?: string, pos?: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (pos) params.set("pos", pos);
    const qs = params.toString();
    const res = await api.get<WordsListResponse>(`/words${qs ? `?${qs}` : ""}`);
    return res.words;
  },

  create: async (word: Omit<WordEntry, "id" | "createdAt" | "updatedAt">) => {
    const res = await api.post<WordCreateResponse>("/words", word);
    return res.word;
  },

  update: async (id: string, word: Omit<WordEntry, "id" | "createdAt" | "updatedAt">) => {
    const res = await api.put<WordUpdateResponse>(`/words/${id}`, word);
    return res.word;
  },

  delete: (id: string) => api.del<{ ok: boolean }>(`/words/${id}`),
};
