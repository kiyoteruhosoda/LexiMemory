import { describe, expect, it, vi } from "vitest";
import { createSpeechApplicationService } from "../../core/speech/speechApplicationService";

describe("speechApplicationService", () => {
  it("returns availability from gateway", () => {
    const gateway = {
      isAvailable: vi.fn().mockReturnValue(true),
      speakEnglish: vi.fn(),
    };

    const service = createSpeechApplicationService(gateway);
    expect(service.canSpeak()).toBe(true);
  });

  it("does not speak when text is empty after trim", () => {
    const gateway = {
      isAvailable: vi.fn().mockReturnValue(true),
      speakEnglish: vi.fn(),
    };

    const service = createSpeechApplicationService(gateway);
    service.speakEnglish("   ");

    expect(gateway.speakEnglish).not.toHaveBeenCalled();
  });

  it("speaks normalized english text", () => {
    const gateway = {
      isAvailable: vi.fn().mockReturnValue(true),
      speakEnglish: vi.fn(),
    };

    const service = createSpeechApplicationService(gateway);
    service.speakEnglish("  Reach here.  ");

    expect(gateway.speakEnglish).toHaveBeenCalledWith("Reach here.");
  });
});
