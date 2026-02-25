import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { studyApplicationService } from "../study/studyApplication";
import type { WordEntry, MemoryState, Rating } from "../api/types";
import { FlashCard } from "../components/FlashCard";
import SyncButton from "../components/SyncButton";
import { TagFilterStorageService } from "../core/tagFilter/tagFilterStorageService";
import { RnwOutlineButton } from "../rnw/components/RnwOutlineButton";
import { RnwTagFilterButton } from "../rnw/components/RnwTagFilterButton";
import { RnwTagFilterPanel } from "../rnw/components/RnwTagFilterPanel";

export function StudyPage() {
  const navigate = useNavigate();
  const [word, setWord] = useState<WordEntry | null>(null);
  const [memory, setMemory] = useState<MemoryState | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Tag filter state
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [appliedTags, setAppliedTags] = useState<string[] | undefined>();
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const tagFilterStorage = useMemo(() => new TagFilterStorageService("study"), []);

  const loadTags = useCallback(async () => {
    try {
      const tags = await studyApplicationService.getAllTags();
      setAllTags(tags);
    } catch (e) {
      console.error("Failed to load tags:", e);
    }
  }, []);

  const loadNext = useCallback(async () => {
    setError(null);
    try {
      const card = await studyApplicationService.fetchNextCard(appliedTags);
      if (!card) {
        setWord(null);
        setMemory(null);
      } else {
        setWord(card.word);
        setMemory(card.memory);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [appliedTags]);

  useEffect(() => { 
    void loadTags();
    void loadNext(); 
  }, [loadTags, loadNext]);
  useEffect(() => {
    void (async () => {
      const restored = await tagFilterStorage.restore();
      setAppliedTags(restored);
    })();
  }, [tagFilterStorage]);


  useEffect(() => {
    void tagFilterStorage.save(appliedTags);
    void loadNext();
  }, [appliedTags, loadNext, tagFilterStorage]);

  async function rate(rating: Rating) {
    if (!word) return;
    await studyApplicationService.gradeCard(word.id, rating);
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

  // Initialize selectedTags from appliedTags
  useEffect(() => {
    if (appliedTags && appliedTags.length > 0) {
      setSelectedTags(appliedTags);
    }
  }, [appliedTags]);

  return (
    <div className="vstack gap-3" data-testid="study-page-ready">
      {/* Header with actions */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex gap-2 align-items-center">
          <RnwOutlineButton
            label="Words"
            onPress={() => navigate("/words")}
            icon={<i className="fa-solid fa-book" aria-hidden="true" />}
            testID="rnw-study-words"
          />

          <RnwOutlineButton
            label="Examples"
            onPress={() => navigate("/examples")}
            icon={<i className="fa-solid fa-pen-to-square" aria-hidden="true" />}
            testID="rnw-study-examples"
          />

          {/* Tag Filter Button */}
          {allTags.length > 0 && (
            <RnwTagFilterButton
              activeCount={appliedTags?.length ?? 0}
              onPress={() => setIsFilterExpanded(!isFilterExpanded)}
              testID="rnw-study-tags"
            />
          )}
        </div>

        <SyncButton onSyncSuccess={() => { void loadTags(); void loadNext(); }} />
      </div>

      {/* Tag Filter Panel - Collapsible */}
      {isFilterExpanded && allTags.length > 0 && (
        <RnwTagFilterPanel
          allTags={allTags}
          selectedTags={selectedTags}
          onToggleTag={toggleTagSelection}
          onClose={() => setIsFilterExpanded(false)}
          onClear={clearFilter}
          onApply={applyFilter}
        />
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
