import { ExamplesApplicationService } from "../core/examples/examplesApplicationService";
import { examplesGatewayAdapter } from "./examplesGatewayAdapter";

export const examplesApplicationService = new ExamplesApplicationService(examplesGatewayAdapter);
