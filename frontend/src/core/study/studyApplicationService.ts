import type { MemoryState, Rating } from "../../api/types";
import type { StudyCard, StudyGateway } from "./studyGateway";

export class StudyApplicationService {
  private readonly studyGateway: StudyGateway;

  constructor(studyGateway: StudyGateway) {
    this.studyGateway = studyGateway;
  }

  async getAllTags(): Promise<string[]> {
    return this.studyGateway.getTags();
  }

  async fetchNextCard(tags?: string[]): Promise<StudyCard | null> {
    return this.studyGateway.next(tags);
  }

  async gradeCard(wordId: string, rating: Rating): Promise<MemoryState> {
    return this.studyGateway.grade(wordId, rating);
  }
}
