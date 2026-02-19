import { useEffect, useState } from "react";
import { studyApi } from "../api/study.offline";
import type { WordEntry, MemoryState, Rating } from "../api/types";
import { FlashCard } from "../components/FlashCard";

export function StudyPage() {
  const [word, setWord] = useState<WordEntry | null>(null);
  const [memory, setMemory] = useState<MemoryState | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Tag filter state
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [appliedTags, setAppliedTags] = useState<string[] | undefined>(undefined);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  async function loadTags() {
    try {
      const res = await studyApi.getTags();
      if (res.ok) {
        setAllTags(res.tags);
      }
    } catch (e) {
      console.error("Failed to load tags:", e);
    }
  }

  async function loadNext() {
    setError(null);
    try {
      const res = await studyApi.next(appliedTags);
      if (!res.card) {
        setWord(null);
        setMemory(null);
      } else {
        setWord(res.card.word);
        setMemory(res.card.memory);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    }
  }

  useEffect(() => { 
    void loadTags();
    void loadNext(); 
  }, []);

  useEffect(() => {
    void loadNext();
  }, [appliedTags]);

  async function rate(rating: Rating) {
    if (!word) return;
    await studyApi.grade(word.id, rating);
    await loadNext();
  }

  function toggleTagSelection(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function applyFilter() {
    setAppliedTags(selectedTags.length > 0 ? selectedTags : undefined);
    setIsFilterExpanded(false);
  }

  function clearFilter() {
    setSelectedTags([]);
    setAppliedTags(undefined);
    setIsFilterExpanded(false);
  }

  return (
    <div className="vstack gap-3">
      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div className="card border shadow-sm">
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <strong>Tag Filter</strong>
                {appliedTags && appliedTags.length > 0 && (
                  <span className="ms-2 text-muted small">
                    Filtering by {appliedTags.length} tag{appliedTags.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              >
                {isFilterExpanded ? "Close" : "Open"}
              </button>
            </div>

            {isFilterExpanded && (
              <div className="mt-3">
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      className={`btn btn-sm ${
                        selectedTags.includes(tag)
                          ? "btn-primary"
                          : "btn-outline-secondary"
                      }`}
                      onClick={() => toggleTagSelection(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="d-flex gap-2 justify-content-end">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={clearFilter}
                  >
                    Clear
                  </button>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={applyFilter}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
