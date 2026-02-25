import { StudyApplicationService } from "../core/study/studyApplicationService";
import { studyGatewayAdapter } from "./studyGatewayAdapter";

export const studyApplicationService = new StudyApplicationService(studyGatewayAdapter);
