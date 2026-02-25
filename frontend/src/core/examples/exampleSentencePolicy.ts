export type BlankedSentenceResult = {
  blanked: string;
  actualWord: string | null;
  found: boolean;
};

/**
 * Normalize a word for comparison (remove punctuation, lowercase).
 */
export function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[.,!?;:()[\]{}"']/g, "").trim();
}

/**
 * Get potential stems for inflection matching.
 */
export function getWordStems(word: string): string[] {
  const normalized = normalizeWord(word);
  const stems = [normalized];

  if (normalized.endsWith("ing") && normalized.length > 4) {
    stems.push(normalized.slice(0, -3));
    stems.push(normalized.slice(0, -3) + "e");
  }
  if (normalized.endsWith("ed") && normalized.length > 3) {
    stems.push(normalized.slice(0, -2));
    stems.push(normalized.slice(0, -2) + "e");
    stems.push(normalized.slice(0, -1));
  }
  if (normalized.endsWith("s")) {
    stems.push(normalized.slice(0, -1));
  }
  if (normalized.endsWith("es")) {
    stems.push(normalized.slice(0, -2));
  }

  return [...new Set(stems)];
}

/**
 * Compare user input with the target word.
 */
export function checkAnswer(userInput: string, targetWord: string): boolean {
  return normalizeWord(userInput) === normalizeWord(targetWord);
}

/**
 * Create a sentence with the target word blanked out.
 */
export function createBlankedSentence(sentence: string, targetWord: string): BlankedSentenceResult {
  const escapedTarget = targetWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escapedTarget}\\b`, "gi");
  const match = sentence.match(regex);

  if (match) {
    return {
      blanked: sentence.replace(regex, "______"),
      actualWord: match[0],
      found: true,
    };
  }

  const words = sentence.split(/\s+/);

  for (let i = 0; i < words.length; i += 1) {
    const cleanWord = words[i].replace(/[.,!?;:()[\]{}"]/g, "");
    const sourceStems = getWordStems(cleanWord);
    const targetStems = getWordStems(targetWord);

    const matched = sourceStems.some((sourceStem) =>
      targetStems.some((targetStem) => {
        if (sourceStem === targetStem) {
          return true;
        }
        return (
          (sourceStem.includes(targetStem) || targetStem.includes(sourceStem)) &&
          Math.abs(sourceStem.length - targetStem.length) <= 3
        );
      }),
    );

    if (matched) {
      return {
        blanked: words.map((word, index) => (index === i ? "______" : word)).join(" "),
        actualWord: cleanWord,
        found: true,
      };
    }
  }

  return { blanked: sentence, actualWord: null, found: false };
}
