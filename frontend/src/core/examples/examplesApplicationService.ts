import type { ExampleTestItem } from "../../api/types";
import type { ExamplesGateway } from "./examplesGateway";

export class ExamplesApplicationService {
  private readonly examplesGateway: ExamplesGateway;

  constructor(examplesGateway: ExamplesGateway) {
    this.examplesGateway = examplesGateway;
  }

  async getAllTags(): Promise<string[]> {
    return this.examplesGateway.getTags();
  }

  async fetchNextExample(tags?: string[], lastExampleId?: string | null): Promise<ExampleTestItem | null> {
    return this.examplesGateway.next(tags, lastExampleId);
  }
}
