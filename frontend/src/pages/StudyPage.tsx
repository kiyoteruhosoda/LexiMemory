import { useEffect, useState } from "react";
import { studyApi } from "../api/study";
import type { WordEntry, MemoryState, Rating } from "../api/types";
import { FlashCard } from "../components/FlashCard";
import { ApiError } from "../api/client";

export function StudyPage() {
  const [word, setWord] = useState<WordEntry | null>(null);
  const [memory, setMemory] = useState<MemoryState | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadNext() {
    setError(null);
    try {
      const res = await studyApi.next();
      if (!res.card) {
        setWord(null);
        setMemory(null);
      } else {
        setWord(res.card.word);
        setMemory(res.card.memory);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load");
    }
  }

  useEffect(() => { void loadNext(); }, []);

  async function rate(rating: Rating) {
    if (!word) return;
    await studyApi.grade(word.id, rating);
    await loadNext();
  }

  return (
    <div className="vstack gap-3">
      {error ? (
        <div className="alert alert-danger" role="alert">
          <i className="fa-solid fa-triangle-exclamation me-2" />
          {error}
        </div>
      ) : null}

      {!word || !memory ? (
        <div className="alert alert-success border shadow-sm">
          <div className="fw-semibold">
            <i className="fa-solid fa-circle-check me-2" />
            Study Complete
          </div>
          <div className="text-secondary small">
            No words to study yet. Add new words or check back later.
          </div>
        </div>
      ) : (
        <FlashCard word={word} memory={memory} onRate={rate} />
      )}
    </div>
  );
}
