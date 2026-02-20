import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { studyApi } from "../api/study.offline";
import type { WordEntry, MemoryState, Rating } from "../api/types";
import { FlashCard } from "../components/FlashCard";
import SyncButton from "../components/SyncButton";

export function StudyPage() {
  const navigate = useNavigate();
  const [word, setWord] = useState<WordEntry | null>(null);
  const [memory, setMemory] = useState<MemoryState | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Tag filter state
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [appliedTags, setAppliedTags] = useState<string[] | undefined>(() => {
    // Restore from localStorage
    try {
      const saved = localStorage.getItem('study_applied_tags');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : undefined;
      }
    } catch (e) {
      console.error('Failed to restore tag filter:', e);
    }
    return undefined;
  });
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
    // Save to localStorage whenever appliedTags changes
    try {
      if (appliedTags && appliedTags.length > 0) {
        localStorage.setItem('study_applied_tags', JSON.stringify(appliedTags));
      } else {
        localStorage.removeItem('study_applied_tags');
      }
    } catch (e) {
      console.error('Failed to save tag filter:', e);
    }
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
    const newTags = selectedTags.length > 0 ? selectedTags : undefined;
    setAppliedTags(newTags);
    setIsFilterExpanded(false);
  }

  function clearFilter() {
    setSelectedTags([]);
    setAppliedTags(undefined);
    setIsFilterExpanded(false);
  }

  // Initialize selectedTags from appliedTags on mount
  useEffect(() => {
    if (appliedTags && appliedTags.length > 0) {
      setSelectedTags(appliedTags);
    }
  }, []);

  return (
    <div className="vstack gap-3">
      {/* Header with actions */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex gap-2 align-items-center">
          <button
            className="btn btn-outline-primary"
            onClick={() => navigate("/words")}
          >
            <i className="fa-solid fa-book me-1" />
            Words
          </button>

          <button
            className="btn btn-outline-primary"
            onClick={() => navigate("/examples")}
          >
            <i className="fa-solid fa-pen-to-square me-1" />
            Examples
          </button>

          {/* Tag Filter Button */}
          {allTags.length > 0 && (
            <button
              className={`btn ${appliedTags && appliedTags.length > 0 ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              title="Filter by tags"
            >
              <i className="fa-solid fa-tag me-1" />
              {appliedTags && appliedTags.length > 0 ? `${appliedTags.length}` : 'Tags'}
            </button>
          )}
        </div>

        <SyncButton onSyncSuccess={() => { void loadTags(); void loadNext(); }} />
      </div>

      {/* Tag Filter Panel - Collapsible */}
      {isFilterExpanded && allTags.length > 0 && (
        <div className="card border shadow-sm">
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <strong>Filter by Tags</strong>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setIsFilterExpanded(false)}
              >
                <i className="fa-solid fa-times" />
              </button>
            </div>
            
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
