import { useEffect, useState } from "react";
import { studyApi } from "../api/study";
import type { WordEntry, MemoryState, Rating } from "../api/types";
import { FlashCard } from "../components/FlashCard";
import { ApiError } from "../api/client";

export function StudyPage() {
  const [word, setWord] = useState<WordEntry | null>(null);
  const [memory, setMemory] = useState<MemoryState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadNext() {
    setError(null);
    setBusy(true);
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
    } finally {
      setBusy(false);
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
      <div className="d-flex align-items-center justify-content-between">
        <h2 className="mb-0">
          <i className="fa-solid fa-layer-group me-2 text-primary" />
          Study
        </h2>
        <button className="btn btn-outline-secondary" onClick={() => void loadNext()} disabled={busy}>
          {busy ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fa-solid fa-rotate me-2" />}
          Reload
        </button>
      </div>

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
            No cards due
          </div>
          <div className="text-secondary small">Add more words or come back later.</div>
        </div>
      ) : (
        <FlashCard word={word} memory={memory} onRate={rate} />
      )}
    </div>
  );
}
