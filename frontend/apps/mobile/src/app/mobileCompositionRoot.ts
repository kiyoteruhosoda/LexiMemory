import { WordApplicationService } from "../../../../src/core/word/wordApplicationService";
import { StudyApplicationService } from "../../../../src/core/study/studyApplicationService";
import { SyncApplicationService } from "../../../../src/core/sync/syncApplicationService";
import { MobileLearningRepository, PersistedMobileLearningRepository } from "../domain/mobileLearningRepository";
import { createMobileWordGateway } from "../infra/mobileWordGateway";
import { createMobileStudyGateway } from "../infra/mobileStudyGateway";
import { createMobileSyncGateway } from "../infra/mobileSyncGateway";
import { resolveMobileStorageAdapter } from "./mobileStorageRuntime";

export interface MobileCompositionRoot {
  wordService: WordApplicationService;
  studyService: StudyApplicationService;
  syncService: SyncApplicationService;
}

async function createRepository() {
  const { adapter } = await resolveMobileStorageAdapter();

  try {
    return await PersistedMobileLearningRepository.create(adapter);
  } catch {
    return new MobileLearningRepository();
  }
}

export async function createMobileCompositionRoot(): Promise<MobileCompositionRoot> {
  const repository = await createRepository();

  return {
    wordService: new WordApplicationService(createMobileWordGateway(repository)),
    studyService: new StudyApplicationService(createMobileStudyGateway(repository)),
    syncService: new SyncApplicationService(createMobileSyncGateway(repository)),
  };
}
