import { createSpeechApplicationService } from "../core/speech/speechApplicationService";
import { noopSpeechGateway } from "./noopSpeechGateway";
import { webSpeechGateway } from "./webSpeechGateway";

const selectedGateway = typeof window === "undefined" ? noopSpeechGateway : webSpeechGateway;

export const speechApplicationService = createSpeechApplicationService(selectedGateway);
