import { WordApplicationService } from "../../../../src/core/word/wordApplicationService";
import { StudyApplicationService } from "../../../../src/core/study/studyApplicationService";
import { SyncApplicationService } from "../../../../src/core/sync/syncApplicationService";
import { MobileLearningRepository } from "../domain/mobileLearningRepository";
import { createMobileWordGateway } from "../infra/mobileWordGateway";
import { createMobileStudyGateway } from "../infra/mobileStudyGateway";
import { createMobileSyncGateway } from "../infra/mobileSyncGateway";

const repository = new MobileLearningRepository();

export const mobileCompositionRoot = {
  wordService: new WordApplicationService(createMobileWordGateway(repository)),
  studyService: new StudyApplicationService(createMobileStudyGateway(repository)),
  syncService: new SyncApplicationService(createMobileSyncGateway(repository)),
};
