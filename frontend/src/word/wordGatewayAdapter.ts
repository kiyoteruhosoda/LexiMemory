import { ioApi } from "../api/io.offline";
import { studyApi } from "../api/study.offline";
import { wordsApi } from "../api/words.offline";
import type { WordGateway } from "../core/word/wordGateway";

export const wordGatewayAdapter: WordGateway = {
  async list(query) {
    return wordsApi.list(query.q, query.pos);
  },
  async get(wordId) {
    return wordsApi.get(wordId);
  },
  async create(draft) {
    return wordsApi.create(draft);
  },
  async update(wordId, draft) {
    return wordsApi.update(wordId, draft);
  },
  async delete(wordId) {
    await wordsApi.delete(wordId);
  },
  async resetMemory(wordId) {
    await studyApi.resetMemory(wordId);
  },
  async exportWords() {
    return ioApi.export();
  },
};
