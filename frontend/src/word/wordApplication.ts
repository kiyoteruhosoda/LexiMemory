import { WordApplicationService } from "../core/word/wordApplicationService";
import { wordGatewayAdapter } from "./wordGatewayAdapter";

export const wordApplicationService = new WordApplicationService(wordGatewayAdapter);
