import { describe, expect, it } from "vitest";
import type { WordEntry } from "../../api/types";
import {
  buildWordSaveDraft,
  createEmptyExample,
  normalizeExampleField,
  sanitizeExamples,
} from "../../core/word/wordDraftPolicy";

describe("wordDraftPolicy", () => {
  it("creates empty example using polymorphic id generator", () => {
    const example = createEmptyExample({ nextId: () => "id-1" });
    expect(example).toEqual({ id: "id-1", en: "", ja: null, source: null });
  });

  it("normalizes optional fields", () => {
    expect(normalizeExampleField("  source  ")).toBe("source");
    expect(normalizeExampleField("   ")).toBeNull();
    expect(normalizeExampleField(null)).toBeNull();
  });

  it("sanitizes examples and removes empty english rows", () => {
    const examples = sanitizeExamples([
      { id: "1", en: "  keep me  ", ja: "  訳  ", source: "  book " },
      { id: "2", en: "   ", ja: "  ", source: null },
    ]);

    expect(examples).toEqual([
      { id: "1", en: "keep me", ja: "訳", source: "book" },
    ]);
  });

  it("builds save draft for create mode", () => {
    const draft = buildWordSaveDraft(
      {
        headword: "  reach ",
        pos: "verb",
        meaningJa: " 到達する ",
        memo: "  ",
        examples: [{ id: "1", en: " Reach here. ", ja: " ここに到達 ", source: " note " }],
      },
      null,
    );

    expect(draft).toEqual({
      headword: "reach",
      pos: "verb",
      meaningJa: "到達する",
      pronunciation: null,
      tags: [],
      examples: [{ id: "1", en: "Reach here.", ja: "ここに到達", source: "note" }],
      memo: null,
    });
  });

  it("preserves initial metadata for edit mode", () => {
    const initial: WordEntry = {
      id: "w-1",
      headword: "reach",
      pos: "verb",
      meaningJa: "届く",
      pronunciation: "riːtʃ",
      tags: ["travel"],
      examples: [],
      memo: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };

    const draft = buildWordSaveDraft(
      {
        headword: "reaches",
        pos: "verb",
        meaningJa: "到達する",
        memo: "memo",
        examples: [],
      },
      initial,
    );

    expect(draft.pronunciation).toBe("riːtʃ");
    expect(draft.tags).toEqual(["travel"]);
    expect(draft.memo).toBe("memo");
  });
});
