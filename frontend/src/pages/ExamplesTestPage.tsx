// frontend/src/pages/ExamplesTestPage.tsx

import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { examplesApplicationService } from "../examples/examplesApplication";
import { checkAnswer, createBlankedSentence } from "../core/examples/exampleSentencePolicy";
import { useTagFilterState } from "../hooks/useTagFilterState";
import type { ExampleTestItem } from "../api/types";
import SyncButton from "../components/SyncButton";
import { speechApplicationService } from "../speech/speechApplication";
import { RnwOutlineButton } from "../rnw/components/RnwOutlineButton";
import { RnwTagFilterButton } from "../rnw/components/RnwTagFilterButton";
import { RnwTagFilterPanel } from "../rnw/components/RnwTagFilterPanel";
import { RnwInlineNotice } from "../rnw/components/RnwInlineNotice";
import { RnwActionBar } from "@leximemory/ui";

export function ExamplesTestPage() {
  const navigate = useNavigate();
  const [example, setExample] = useState<ExampleTestItem | null>(null);
  const [blankedSentence, setBlankedSentence] = useState<string>("");
  const [actualWordInSentence, setActualWordInSentence] = useState<string | null>(null);
  const [lastExampleId, setLastExampleId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showWordInfo, setShowWordInfo] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSpeak = useMemo(() => speechApplicationService.canSpeak(), []);
  
  const [allTags, setAllTags] = useState<string[]>([]);
  const {
    selectedTags,
    appliedTags,
    isFilterExpanded,
    setFilterExpanded,
    handleToggleTagSelection,
    applyFilter,
    clearFilter,
  } = useTagFilterState("examples");

  const loadTags = useCallback(async () => {
    try {
      const tags = await examplesApplicationService.getAllTags();
      setAllTags(tags);
    } catch (e) {
      console.error("Failed to load tags:", e);
    }
  }, []);

  const loadNext = useCallback(async () => {
    setError(null);
    setUserInput("");
    setFeedback(null);
    setShowAnswer(false);
    
    try {
      const nextExample = await examplesApplicationService.fetchNextExample(appliedTags, lastExampleId);
      if (!nextExample) {
        setExample(null);
        setBlankedSentence("");
        setActualWordInSentence(null);
      } else {
        setExample(nextExample);
        const { blanked, actualWord, found } = createBlankedSentence(nextExample.en, nextExample.word.headword);
        if (!found) {
          console.warn("Target word not found in sentence:", nextExample.word.headword, nextExample.en);
        }
        setBlankedSentence(blanked);
        setActualWordInSentence(actualWord);
        setLastExampleId(nextExample.id);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [appliedTags, lastExampleId]);

  useEffect(() => { 
    void loadTags();
    void loadNext(); 
  }, [loadTags, loadNext]);
  useEffect(() => {
    void loadNext();
  }, [appliedTags, loadNext]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!example) return;
    
    // Allow empty input (treated as incorrect/skip)
    if (!userInput.trim()) {
      setFeedback("incorrect");
      setShowAnswer(true);
      return;
    }
    
    // Check against the actual word in the sentence (with inflection)
    const targetWord = actualWordInSentence || example.word.headword;
    const isCorrect = checkAnswer(userInput, targetWord);
    setFeedback(isCorrect ? "correct" : "incorrect");
    setShowAnswer(true);
  }

  function handleNext() {
    setShowWordInfo(false);
    setShowTranslation(false);
    void loadNext();
  }

  function speakSentence(e?: React.MouseEvent<HTMLButtonElement>) {
    if (!canSpeak || !example?.en) return;
    speechApplicationService.speakEnglish(example.en);
    // Blur to remove focus/hover state on touch devices
    if (e) e.currentTarget.blur();
  }


  return (
    <div className="vstack gap-3" data-testid="examples-page-ready">
      <RnwActionBar
        leading={<>
          <RnwOutlineButton
            label="Words"
            onPress={() => navigate("/words")}
            icon={<i className="fa-solid fa-book" aria-hidden="true" />}
            testID="rnw-examples-words"
          />

          <RnwOutlineButton
            label="Study"
            onPress={() => navigate("/study")}
            icon={<i className="fa-solid fa-graduation-cap" aria-hidden="true" />}
            testID="rnw-examples-study"
          />

          {allTags.length > 0 && (
            <RnwTagFilterButton
              activeCount={appliedTags?.length ?? 0}
              onPress={() => setFilterExpanded(!isFilterExpanded)}
              testID="rnw-examples-tags"
            />
          )}
        </>}
        trailing={<SyncButton onSyncSuccess={() => { void loadTags(); void loadNext(); }} />}
        testID="rnw-examples-action-bar"
      />

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

      {!example ? (
        <RnwInlineNotice
          tone="info"
          message="No examples available. Add example sentences to your words first."
          icon={<i className="fa-solid fa-circle-info" aria-hidden="true" />}
        />
      ) : (
        <div className="card border shadow-sm">
          <div className="card-body">
            {/* Word Info Toggle */}
            <div className="mb-3 pb-3 border-bottom">
              {!showWordInfo ? (
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowWordInfo(true)}
                >
                  <i className="fa-solid fa-circle-info me-1" />
                  Show Word Info
                </button>
              ) : (
                <div className="d-flex align-items-center gap-2">
                  <span className="badge text-bg-secondary">
                    {example.word.pos}
                  </span>
                  <span className="fw-medium">
                    {example.word.meaningJa}
                  </span>
                </div>
              )}
            </div>

            {/* Blanked Sentence */}
            <div className="mb-3">
              <div className="d-flex align-items-start gap-2">
                <div className="fs-5 fw-medium flex-grow-1">
                  {blankedSentence}
                </div>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={speakSentence}
                  disabled={!canSpeak}
                  title="Speak"
                >
                  <i className="fa-solid fa-volume-high" />
                </button>
              </div>
              
              {/* Translation Toggle */}
              {example.ja && (
                <div className="mt-2">
                  {!showTranslation ? (
                    <button 
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setShowTranslation(true)}
                    >
                      <i className="fa-solid fa-language me-1" />
                      Show Translation
                    </button>
                  ) : (
                    <div className="text-muted small">
                      <i className="fa-solid fa-language me-1" />
                      {example.ja}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input Form */}
            {!showAnswer ? (
              <form onSubmit={handleSubmit} className="mb-3">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type the missing word... (or leave empty to skip)"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    autoFocus
                  />
                  <button className="btn btn-primary" type="submit">
                    <i className="fa-solid fa-check me-1" />
                    Check
                  </button>
                </div>
                <div className="form-text small text-muted mt-1">
                  Press Enter to check or skip if you don't know
                </div>
              </form>
            ) : (
              <div className="mb-3">
                {/* Feedback */}
                <div className={`alert ${feedback === "correct" ? "alert-success" : "alert-danger"} mb-3`}>
                  <div className="d-flex align-items-center gap-2">
                    <i className={`fa-solid ${feedback === "correct" ? "fa-circle-check" : "fa-circle-xmark"} fs-4`} />
                    <div>
                      <div className="fw-semibold">
                        {feedback === "correct" ? "Correct!" : userInput.trim() ? "Incorrect" : "Skipped"}
                      </div>
                      {userInput.trim() && (
                        <div className="small">
                          Your answer: <strong>{userInput}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Answer */}
                <div className="alert alert-info">
                  <div className="fw-semibold mb-2">Correct Answer:</div>
                  <div className="fs-5">
                    <strong>{actualWordInSentence || example.word.headword}</strong>
                  </div>
                  {actualWordInSentence && actualWordInSentence !== example.word.headword && (
                    <div className="text-muted small mt-1">
                      (Base form: {example.word.headword})
                    </div>
                  )}
                  <div className="text-muted small mt-2">
                    Complete sentence: {example.en}
                  </div>
                </div>

                {/* Next Button */}
                <button className="btn btn-primary w-100" onClick={handleNext}>
                  <i className="fa-solid fa-arrow-right me-1" />
                  Next Example
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
