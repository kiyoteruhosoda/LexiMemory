import { examplesApi } from "../api/examples.offline";
import type { ExamplesGateway } from "../core/examples/examplesGateway";

export const examplesGatewayAdapter: ExamplesGateway = {
  async getTags() {
    const response = await examplesApi.getTags();
    return response.tags;
  },
  async next(tags, lastExampleId, preferredWordId) {
    const response = await examplesApi.next(tags, lastExampleId, preferredWordId);
    return response.example;
  },
};
