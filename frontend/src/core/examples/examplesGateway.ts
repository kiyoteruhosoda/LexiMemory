import type { ExampleTestItem } from "../../api/types";

export interface ExamplesGateway {
  getTags(): Promise<string[]>;
  next(tags?: string[], lastExampleId?: string | null): Promise<ExampleTestItem | null>;
  byWordId(wordId: string, lastExampleId?: string | null): Promise<ExampleTestItem | null>;
}
