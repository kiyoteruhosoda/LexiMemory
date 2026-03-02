import { describe, expect, it, vi } from "vitest";
import { ExamplesApplicationService } from "../../core/examples/examplesApplicationService";
import type { ExamplesGateway } from "../../core/examples/examplesGateway";

function createExamplesGatewayMock(): ExamplesGateway {
  return {
    getTags: vi.fn(),
    next: vi.fn(),
  };
}

describe("ExamplesApplicationService", () => {
  it("returns tags from gateway", async () => {
    const gateway = createExamplesGatewayMock();
    const service = new ExamplesApplicationService(gateway);
    vi.mocked(gateway.getTags).mockResolvedValue(["daily", "travel"]);

    await expect(service.getAllTags()).resolves.toEqual(["daily", "travel"]);
  });

  it("fetches next example with filter and cursor", async () => {
    const gateway = createExamplesGatewayMock();
    const service = new ExamplesApplicationService(gateway);

    vi.mocked(gateway.next).mockResolvedValue({
      id: "ex1",
      en: "I read a book.",
      ja: "私は本を読む。",
      source: null,
      word: {
        id: "w1",
        headword: "read",
        pos: "verb",
        meaningJa: "読む",
        tags: ["daily"],
      },
    });

    const result = await service.fetchNextExample(["daily"], "ex0");

    expect(vi.mocked(gateway.next).mock.calls[0]).toEqual([["daily"], "ex0", undefined]);
    expect(result?.id).toBe("ex1");
  });
});
