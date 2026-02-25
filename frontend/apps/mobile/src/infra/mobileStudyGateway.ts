import type { StudyGateway } from "../../../../src/core/study/studyGateway";
import { MobileLearningRepository } from "../domain/mobileLearningRepository";

export function createMobileStudyGateway(repository: MobileLearningRepository): StudyGateway {
  return {
    async getTags() {
      return repository.listTags();
    },
    async next(tags) {
      return repository.nextCard(tags);
    },
    async grade(wordId, rating) {
      return repository.gradeCard(wordId, rating);
    },
  };
}
