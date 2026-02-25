import { AuthSessionService } from "../core/auth/authSessionService";
import { authGatewayAdapter } from "../auth/authGatewayAdapter";
import { WordApplicationService } from "../core/word/wordApplicationService";
import { wordGatewayAdapter } from "../word/wordGatewayAdapter";
import { StudyApplicationService } from "../core/study/studyApplicationService";
import { studyGatewayAdapter } from "../study/studyGatewayAdapter";
import { ExamplesApplicationService } from "../core/examples/examplesApplicationService";
import { examplesGatewayAdapter } from "../examples/examplesGatewayAdapter";
import { SyncApplicationService } from "../core/sync/syncApplicationService";
import { SyncOrchestrationService } from "../core/sync/syncOrchestrationService";
import { syncGatewayAdapter } from "../sync/syncGatewayAdapter";
import { storage } from "../core/storage";

export const appCompositionRoot = {
  authSessionService: new AuthSessionService(authGatewayAdapter),
  wordApplicationService: new WordApplicationService(wordGatewayAdapter),
  studyApplicationService: new StudyApplicationService(studyGatewayAdapter),
  examplesApplicationService: new ExamplesApplicationService(examplesGatewayAdapter),
  syncApplicationService: new SyncApplicationService(syncGatewayAdapter),
};

export const syncOrchestrationService = new SyncOrchestrationService(
  appCompositionRoot.syncApplicationService,
  storage
);
