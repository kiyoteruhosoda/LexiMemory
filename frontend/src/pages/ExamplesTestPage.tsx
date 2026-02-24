// frontend/src/pages/ExamplesTestPage.tsx

import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { examplesApi } from "../api/examples.offline";
import { TagFilterStorageService } from "../core/tagFilter/tagFilterStorageService";
import type { ExampleTestItem } from "../api/types";
import SyncButton from "../components/SyncButton";
import { RnwOutlineButton } from "../rnw/components/RnwOutlineButton";
import { RnwTagFilterButton } from "../rnw/components/RnwTagFilterButton";

/**
 * Normalize a word for comparison (handles inflections and case)
 */
function normalizeWord(word: string): string {
  return word.toLowerCase().trim();
}

/**
 * Get word stems by removing common suffixes
 */
function getWordStems(word: string): string[] {
  const normalized = normalizeWord(word);
  const stems = [normalized];
  
  // Remove common suffixes to handle inflections
  if (normalized.endsWith('ing')) {
    stems.push(normalized.slice(0, -3)); // running -> run
    stems.push(normalized.slice(0, -3) + 'e'); // taking -> take
  }
  if (normalized.endsWith('ed')) {
    stems.push(normalized.slice(0, -2)); // walked -> walk
    stems.push(normalized.slice(0, -2) + 'e'); // moved -> move
    stems.push(normalized.slice(0, -1)); // stopped -> stop
  }
  if (normalized.endsWith('s')) {
    stems.push(normalized.slice(0, -1)); // checks -> check
  }
  if (normalized.endsWith('es')) {
    stems.push(normalized.slice(0, -2)); // reaches -> reach
  }
  
  return [...new Set(stems)];
}

/**
 * Check if user input matches the target word (exact match, case-insensitive)
 */
function checkAnswer(userInput: string, targetWord: string): boolean {
  return normalizeWord(userInput) === normalizeWord(targetWord);
}

/**
 * Create a blanked sentence by removing the target word
 * Returns the actual word found in the sentence (with correct inflection)
 */
function createBlankedSentence(sentence: string, targetWord: string): { blanked: string; actualWord: string | null; found: boolean } {
  // Handle multi-word targets (like "check in")
  // Try case-insensitive replacement
  const regex = new RegExp(`\\b${targetWord.replace(/[.*+?^${}()|\\[\\]\\\\]/g, '\\$&')}\\b`, 'gi');
  const match = sentence.match(regex);
  
  if (match) {
    const blanked = sentence.replace(regex, '______');
    // Return the actual matched word (with original case and inflection)
    return { blanked, actualWord: match[0], found: true };
  }
  
  // If not found as-is, try to find inflected forms
  const words = sentence.split(/\s+/);
  let foundIndex = -1;
  let actualWord: string | null = null;
  
  for (let i = 0; i < words.length; i++) {
    // Remove punctuation for comparison
    const cleanWord = words[i].replace(/[.,!?;:()[\]{}"]/g, '');
    const userStems = getWordStems(cleanWord);
    const targetStems = getWordStems(targetWord);
    
    // Check if any stem matches (for finding the word in sentence)
    for (const userStem of userStems) {
      for (const targetStem of targetStems) {
        if (userStem === targetStem) {
          foundIndex = i;
          actualWord = cleanWord;
          break;
        }
        // Also allow partial matches for compound words
        if (userStem.includes(targetStem) || targetStem.includes(userStem)) {
          if (Math.abs(userStem.length - targetStem.length) <= 3) {
            foundIndex = i;
            actualWord = cleanWord;
            break;
          }
        }
      }
      if (foundIndex >= 0) break;
    }
    if (foundIndex >= 0) break;
  }
  
  if (foundIndex >= 0 && actualWord) {
    const blanked = words.map((w, i) => i === foundIndex ? '______' : w).join(' ');
    return { blanked, actualWord, found: true };
  }
  
  return { blanked: sentence, actualWord: null, found: false };
}

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
  const canSpeak = useMemo(() => typeof window !== "undefined" && "speechSynthesis" in window, []);
  
  // Tag filter state
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [appliedTags, setAppliedTags] = useState<string[] | undefined>();
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const tagFilterStorage = useMemo(() => new TagFilterStorageService("examples"), []);

  const loadTags = useCallback(async () => {
    try {
      const res = await examplesApi.getTags();
      setAllTags(res.tags);
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
      const res = await examplesApi.next(appliedTags, lastExampleId);
      if (!res.example) {
        setExample(null);
        setBlankedSentence("");
        setActualWordInSentence(null);
      } else {
        setExample(res.example);
        const { blanked, actualWord, found } = createBlankedSentence(res.example.en, res.example.word.headword);
        if (!found) {
          console.warn("Target word not found in sentence:", res.example.word.headword, res.example.en);
        }
        setBlankedSentence(blanked);
        setActualWordInSentence(actualWord);
        setLastExampleId(res.example.id);
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
    void (async () => {
      const restored = await tagFilterStorage.restore();
      setAppliedTags(restored);
    })();
  }, [tagFilterStorage]);


  useEffect(() => {
    void tagFilterStorage.save(appliedTags);
    void loadNext();
  }, [appliedTags, loadNext, tagFilterStorage]);

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
    const ut = new SpeechSynthesisUtterance(example.en);
    ut.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(ut);
    // Blur to remove focus/hover state on touch devices
    if (e) e.currentTarget.blur();
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
    <div className="vstack gap-3" data-testid="examples-page-ready">
      {/* Header with actions */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex gap-2 align-items-center">
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

          {/* Tag Filter Button */}
          {allTags.length > 0 && (
            <RnwTagFilterButton
              activeCount={appliedTags?.length ?? 0}
              onPress={() => setIsFilterExpanded(!isFilterExpanded)}
              testID="rnw-examples-tags"
            />
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

      {!example ? (
        <div className="alert alert-info border shadow-sm">
          <div className="fw-semibold">
            <i className="fa-solid fa-circle-info me-2" />
            No Examples Available
          </div>
          <div className="text-secondary small">
            No example sentences found. Add examples to your words first.
          </div>
        </div>
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
