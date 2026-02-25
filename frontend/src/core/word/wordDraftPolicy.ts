import type { ExampleSentence, Pos, WordEntry } from "../../api/types";

export type ExampleIdGenerator = {
  nextId: () => string;
};

type WordDraftFormState = {
  headword: string;
  pos: Pos;
  meaningJa: string;
  memo: string;
  examples: ExampleSentence[];
};

export function createEmptyExample(idGenerator: ExampleIdGenerator): ExampleSentence {
  return {
    id: idGenerator.nextId(),
    en: "",
    ja: null,
    source: null,
  };
}

export function normalizeExampleField(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

export function sanitizeExamples(examples: ExampleSentence[]): ExampleSentence[] {
  return examples
    .map((example) => ({
      ...example,
      en: example.en.trim(),
      ja: normalizeExampleField(example.ja),
      source: normalizeExampleField(example.source),
    }))
    .filter((example) => example.en.length > 0);
}

export function buildWordSaveDraft(
  formState: WordDraftFormState,
  initial: WordEntry | null | undefined,
): Omit<WordEntry, "id" | "createdAt" | "updatedAt"> {
  return {
    headword: formState.headword.trim(),
    pos: formState.pos,
    meaningJa: formState.meaningJa.trim(),
    pronunciation: initial?.pronunciation ?? null,
    tags: initial?.tags ?? [],
    examples: sanitizeExamples(formState.examples),
    memo: normalizeExampleField(formState.memo),
  };
}
