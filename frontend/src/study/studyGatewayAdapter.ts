import { studyApi } from "../api/study.offline";
import type { StudyGateway } from "../core/study/studyGateway";

export const studyGatewayAdapter: StudyGateway = {
  async getTags() {
    const response = await studyApi.getTags();
    return response.tags;
  },
  async next(tags) {
    const response = await studyApi.next(tags);
    return response.card;
  },
  async grade(wordId, rating) {
    const response = await studyApi.grade(wordId, rating);
    return response.memory;
  },
};
