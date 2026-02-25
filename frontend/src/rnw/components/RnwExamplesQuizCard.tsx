import type { FormEvent } from "react";
import type { ExampleTestItem } from "../../api/types";

type FeedbackState = "correct" | "incorrect" | null;

export interface RnwExamplesQuizCardProps {
  example: ExampleTestItem;
  blankedSentence: string;
  actualWordInSentence: string | null;
  userInput: string;
  feedback: FeedbackState;
  showAnswer: boolean;
  showWordInfo: boolean;
  showTranslation: boolean;
  canSpeak: boolean;
  onShowWordInfo: () => void;
  onToggleTranslation: () => void;
  onSpeakSentence: () => void;
  onInputChange: (value: string) => void;
  onSubmitAnswer: () => void;
  onNext: () => void;
}

const containerStyle = {
  border: "1px solid #dee2e6",
  borderRadius: 8,
  backgroundColor: "#fff",
  boxShadow: "0 0.125rem 0.25rem rgba(0,0,0,0.075)",
  padding: 16,
  display: "flex",
  flexDirection: "column" as const,
  gap: 16,
};

const subtleButtonStyle = {
  border: "1px solid #6c757d",
  borderRadius: 6,
  backgroundColor: "transparent",
  color: "#495057",
  padding: "6px 10px",
  fontSize: 13,
  cursor: "pointer",
};

const primaryButtonStyle = {
  border: "1px solid #0d6efd",
  borderRadius: 6,
  backgroundColor: "#0d6efd",
  color: "#fff",
  padding: "8px 14px",
  fontSize: 14,
  cursor: "pointer",
};

const answerBoxStyle = {
  border: "1px solid #cfe2ff",
  borderRadius: 6,
  backgroundColor: "#e7f1ff",
  padding: 12,
};

const feedbackBoxByTone = {
  correct: {
    border: "1px solid #badbcc",
    backgroundColor: "#d1e7dd",
    color: "#0f5132",
  },
  incorrect: {
    border: "1px solid #f5c2c7",
    backgroundColor: "#f8d7da",
    color: "#842029",
  },
  skipped: {
    border: "1px solid #f5c2c7",
    backgroundColor: "#f8d7da",
    color: "#842029",
  },
} as const;

export function RnwExamplesQuizCard({
  example,
  blankedSentence,
  actualWordInSentence,
  userInput,
  feedback,
  showAnswer,
  showWordInfo,
  showTranslation,
  canSpeak,
  onShowWordInfo,
  onToggleTranslation,
  onSpeakSentence,
  onInputChange,
  onSubmitAnswer,
  onNext,
}: RnwExamplesQuizCardProps) {
  const feedbackTone = feedback === "correct" ? "correct" : userInput.trim() ? "incorrect" : "skipped";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmitAnswer();
  }

  return (
    <section style={containerStyle} data-testid="rnw-examples-quiz-card">
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {!showWordInfo ? (
          <button type="button" style={subtleButtonStyle} onClick={onShowWordInfo}>
            <i className="fa-solid fa-circle-info" aria-hidden="true" /> Show Word Info
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ background: "#6c757d", color: "#fff", borderRadius: 999, padding: "2px 8px", fontSize: 12 }}>
              {example.word.pos}
            </span>
            <span style={{ fontWeight: 500 }}>{example.word.meaningJa}</span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ fontSize: 20, fontWeight: 500, flex: 1 }}>{blankedSentence}</div>
        <button type="button" style={subtleButtonStyle} onClick={onSpeakSentence} disabled={!canSpeak} title="Speak">
          <i className="fa-solid fa-volume-high" aria-hidden="true" />
        </button>
      </div>

      {example.ja ? (
        <div>
          {!showTranslation ? (
            <button type="button" style={subtleButtonStyle} onClick={onToggleTranslation}>
              <i className="fa-solid fa-language" aria-hidden="true" /> Show Translation
            </button>
          ) : (
            <div style={{ color: "#6c757d", fontSize: 13 }}>
              <i className="fa-solid fa-language" aria-hidden="true" /> {example.ja}
            </div>
          )}
        </div>
      ) : null}

      {!showAnswer ? (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="Type the missing word... (or leave empty to skip)"
              value={userInput}
              onChange={(event) => onInputChange(event.target.value)}
              autoFocus
              style={{ flex: 1, border: "1px solid #ced4da", borderRadius: 6, padding: "8px 10px" }}
            />
            <button type="submit" style={primaryButtonStyle}>
              <i className="fa-solid fa-check" aria-hidden="true" /> Check
            </button>
          </div>
          <div style={{ color: "#6c757d", fontSize: 12 }}>Press Enter to check or skip if you don&apos;t know</div>
        </form>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ ...feedbackBoxByTone[feedbackTone], borderRadius: 6, padding: 12 }}>
            <div style={{ fontWeight: 600 }}>
              {feedback === "correct" ? "Correct!" : userInput.trim() ? "Incorrect" : "Skipped"}
            </div>
            {userInput.trim() ? (
              <div style={{ fontSize: 13 }}>Your answer: <strong>{userInput}</strong></div>
            ) : null}
          </div>

          <div style={answerBoxStyle}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Correct Answer:</div>
            <div style={{ fontSize: 20 }}>
              <strong>{actualWordInSentence || example.word.headword}</strong>
            </div>
            {actualWordInSentence && actualWordInSentence !== example.word.headword ? (
              <div style={{ color: "#6c757d", fontSize: 13 }}>(Base form: {example.word.headword})</div>
            ) : null}
            <div style={{ color: "#6c757d", fontSize: 13, marginTop: 8 }}>Complete sentence: {example.en}</div>
          </div>

          <button type="button" style={{ ...primaryButtonStyle, width: "100%" }} onClick={onNext}>
            <i className="fa-solid fa-arrow-right" aria-hidden="true" /> Next Example
          </button>
        </div>
      )}
    </section>
  );
}
