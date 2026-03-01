// frontend/src/pages/StudyPage.tsx

import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { studyApplicationService } from "../study/studyApplication";
import type { WordEntry, MemoryState, Rating } from "../api/types";
import { RnwFlashCard } from "../rnw/components/RnwFlashCard";
import SyncButton from "../components/SyncButton";
import { useTagFilterState } from "../hooks/useTagFilterState";
import { RnwTagFilterPanel } from "../rnw/components/RnwTagFilterPanel";
import { RnwInlineNotice } from "../rnw/components/RnwInlineNotice";
import { RnwActionBar } from "@leximemory/ui";
import { FeatureActionGroup } from "../components/FeatureActionGroup";

export function StudyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const wordId = searchParams.get("wordId");

  const [word, setWord] = useState<WordEntry | null>(null);
  const [memory, setMemory] = useState<MemoryState | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [allTags, setAllTags] = useState<string[]>([]);
  const {
    selectedTags,
    appliedTags,
    isFilterExpanded,
    setFilterExpanded,
    handleToggleTagSelection,
    applyFilter,
    clearFilter,
  } = useTagFilterState("study");

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
      const card = wordId
        ? await studyApplicationService.fetchCardByWordId(wordId)
        : await studyApplicationService.fetchNextCard(appliedTags);
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
  }, [appliedTags, wordId]);

  useEffect(() => { 
    void loadTags();
    void loadNext(); 
  }, [loadTags, loadNext]);

  useEffect(() => {
    if (wordId) return;
    void loadNext();
  }, [appliedTags, loadNext, wordId]);

  async function rate(rating: Rating) {
    if (!word) return;
    await studyApplicationService.gradeCard(word.id, rating);
    await loadNext();
  }


  return (
    <div className="vstack gap-3" data-testid="study-page-ready">
      <RnwActionBar
        leading={(
          <FeatureActionGroup
            currentPage="study"
            onNavigate={(path) => navigate(path)}
            testIDs={{ words: "rnw-study-words", examples: "rnw-study-examples" }}
            tagFilter={{
              visible: allTags.length > 0,
              activeCount: appliedTags?.length ?? 0,
              onToggle: () => setFilterExpanded(!isFilterExpanded),
              testID: "rnw-study-tags",
            }}
          />
        )}
        trailing={<SyncButton onSyncSuccess={() => { void loadTags(); void loadNext(); }} />}
        testID="rnw-study-action-bar"
      />

      {/* Tag Filter Panel - Collapsible */}
      {isFilterExpanded && allTags.length > 0 && (
        <RnwTagFilterPanel
          allTags={allTags}
          selectedTags={selectedTags}
          onToggleTag={handleToggleTagSelection}
          onClose={() => setFilterExpanded(false)}
          onClear={clearFilter}
          onApply={applyFilter}
        />
      )}

      {error ? (
        <RnwInlineNotice
          tone="error"
          message={error}
          icon={<i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />}
        />
      ) : null}

      {!word || !memory ? (
        <RnwInlineNotice
          tone="info"
          message="Study complete. No words to study yet. Add new words or check back later."
          icon={<i className="fa-solid fa-circle-check" aria-hidden="true" />}
        />
      ) : (
        <RnwFlashCard
          word={word}
          memory={memory}
          onRate={rate}
          onOpenExamples={() => navigate(`/examples?wordId=${encodeURIComponent(word.id)}`)}
        />
      )}
    </div>
  );
}
