import { describe, expect, it, vi } from "vitest";
import { StudyApplicationService } from "../../core/study/studyApplicationService";
import type { StudyGateway } from "../../core/study/studyGateway";

function createStudyGatewayMock(): StudyGateway {
  return {
    getTags: vi.fn(),
    next: vi.fn(),
    grade: vi.fn(),
  };
}

describe("StudyApplicationService", () => {
  it("delegates tag and card fetch to gateway", async () => {
    const gateway = createStudyGatewayMock();
    const service = new StudyApplicationService(gateway);

    vi.mocked(gateway.getTags).mockResolvedValue(["basic", "verb"]);
    vi.mocked(gateway.next).mockResolvedValue(null);

    await expect(service.getAllTags()).resolves.toEqual(["basic", "verb"]);
    await expect(service.fetchNextCard(["basic"])) .resolves.toBeNull();

    expect(gateway.next).toHaveBeenCalledWith(["basic"]);
  });

  it("delegates grading to gateway", async () => {
    const gateway = createStudyGatewayMock();
    const service = new StudyApplicationService(gateway);

    vi.mocked(gateway.grade).mockResolvedValue({
      wordId: "w1",
      memoryLevel: 2,
      ease: 2.5,
      intervalDays: 3,
      dueAt: "2024-01-04T00:00:00.000Z",
      lastRating: "good",
      lastReviewedAt: "2024-01-01T00:00:00.000Z",
      lapseCount: 0,
      reviewCount: 1,
    });

    await service.gradeCard("w1", "good");
    expect(gateway.grade).toHaveBeenCalledWith("w1", "good");
  });
});
