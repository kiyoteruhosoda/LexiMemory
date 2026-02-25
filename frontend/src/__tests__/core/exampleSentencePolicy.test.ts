import { describe, expect, it } from "vitest";
import {
  checkAnswer,
  createBlankedSentence,
  getWordStems,
  normalizeWord,
} from "../../core/examples/exampleSentencePolicy";

describe("exampleSentencePolicy", () => {
  it("normalizes punctuation and case", () => {
    expect(normalizeWord("  Running! ")).toBe("running");
  });

  it("builds stems for inflected words", () => {
    expect(getWordStems("reaches")).toContain("reach");
    expect(getWordStems("moved")).toContain("move");
  });

  it("checks answer by normalized equality", () => {
    expect(checkAnswer("Walked", "walked.")).toBe(true);
    expect(checkAnswer("walk", "walked")).toBe(false);
  });

  it("blanks exact target word match", () => {
    const result = createBlankedSentence("I reach the station early.", "reach");
    expect(result.found).toBe(true);
    expect(result.blanked).toContain("______");
    expect(result.actualWord).toBe("reach");
  });

  it("blanks inflected target word", () => {
    const result = createBlankedSentence("She reaches home before sunset.", "reach");
    expect(result.found).toBe(true);
    expect(result.actualWord?.toLowerCase()).toBe("reaches");
  });

  it("returns fallback when target is not found", () => {
    const sentence = "This sentence has no target token.";
    const result = createBlankedSentence(sentence, "absent");
    expect(result.found).toBe(false);
    expect(result.blanked).toBe(sentence);
    expect(result.actualWord).toBeNull();
  });
});
