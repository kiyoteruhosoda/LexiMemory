import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { examplesApplicationService } from "../examples/examplesApplication";
import { checkAnswer, createBlankedSentence } from "../core/examples/exampleSentencePolicy";
import { useTagFilterState } from "../hooks/useTagFilterState";
import type { ExampleTestItem } from "../api/types";
import SyncButton from "../components/SyncButton";
import { speechApplicationService } from "../speech/speechApplication";
import { RnwButton } from "../rnw/components/RnwButton";
import { RnwTagFilterButton } from "../rnw/components/RnwTagFilterButton";
import { RnwTagFilterPanel } from "../rnw/components/RnwTagFilterPanel";
import { RnwInlineNotice } from "../rnw/components/RnwInlineNotice";
import { RnwExamplesQuizCard } from "../rnw/components/RnwExamplesQuizCard";
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

  function handleSubmitAnswer() {
    if (!example) return;

    if (!userInput.trim()) {
      setFeedback("incorrect");
      setShowAnswer(true);
      return;
    }

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

  function speakSentence() {
    if (!canSpeak || !example?.en) return;
    speechApplicationService.speakEnglish(example.en);
  }

  return (
    <div className="vstack gap-3" data-testid="examples-page-ready">
      <RnwActionBar
        leading={<>
          <RnwButton
            label="Words"
            onPress={() => navigate("/words")}
            icon={<i className="fa-solid fa-book" aria-hidden="true" />}
            testID="rnw-examples-words"
            kind="outline"
            tone="primary"
          />

          <RnwButton
            label="Study"
            onPress={() => navigate("/study")}
            icon={<i className="fa-solid fa-graduation-cap" aria-hidden="true" />}
            testID="rnw-examples-study"
            kind="outline"
            tone="primary"
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
        <RnwExamplesQuizCard
          example={example}
          blankedSentence={blankedSentence}
          actualWordInSentence={actualWordInSentence}
          userInput={userInput}
          feedback={feedback}
          showAnswer={showAnswer}
          showWordInfo={showWordInfo}
          showTranslation={showTranslation}
          canSpeak={canSpeak}
          onShowWordInfo={() => setShowWordInfo(true)}
          onToggleTranslation={() => setShowTranslation(true)}
          onSpeakSentence={speakSentence}
          onInputChange={setUserInput}
          onSubmitAnswer={handleSubmitAnswer}
          onNext={handleNext}
        />
      )}
    </div>
  );
}
