import type { AppData, MemoryState, WordEntry } from "../../api/types";
import type { WordDraft, WordGateway, WordListQuery } from "./wordGateway";

export type WordListViewModel = {
  items: WordEntry[];
  memoryMap: Record<string, MemoryState>;
};

export class WordApplicationService {
  private readonly gateway: WordGateway;

  constructor(gateway: WordGateway) {
    this.gateway = gateway;
  }

  async listWords(query: WordListQuery): Promise<WordListViewModel> {
    const result = await this.gateway.list(query);
    return {
      items: result.words,
      memoryMap: result.memoryMap,
    };
  }

  async getWord(wordId: string): Promise<WordEntry | null> {
    return this.gateway.get(wordId);
  }

  async createWord(draft: WordDraft): Promise<WordEntry> {
    return this.gateway.create(draft);
  }

  async updateWord(wordId: string, draft: WordDraft): Promise<WordEntry> {
    return this.gateway.update(wordId, draft);
  }

  async deleteWord(wordId: string): Promise<void> {
    await this.gateway.delete(wordId);
  }

  async resetWordMemory(wordId: string): Promise<void> {
    await this.gateway.resetMemory(wordId);
  }

  async exportSnapshot(): Promise<AppData> {
    return this.gateway.exportWords();
  }
}
