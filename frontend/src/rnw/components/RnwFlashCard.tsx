import { useMemo, useState } from "react";
import type { MemoryState, Rating, WordEntry } from "../../api/types";
import { speechApplicationService } from "../../speech/speechApplication";
import { RnwOutlineButton } from "./RnwOutlineButton";
import { RnwPrimaryButton } from "./RnwPrimaryButton";

export type RnwFlashCardProps = {
  word: WordEntry;
  memory: MemoryState;
  onRate: (rating: Rating) => Promise<void>;
};

const cardStyle = {
  border: "1px solid #dee2e6",
  borderRadius: 8,
  backgroundColor: "#fff",
  boxShadow: "0 0.125rem 0.25rem rgba(0,0,0,0.075)",
  overflow: "hidden",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: 12,
  borderBottom: "1px solid #dee2e6",
};

const bodyStyle = {
  padding: 16,
  display: "flex",
  flexDirection: "column" as const,
  gap: 16,
};

const answerPanelStyle = {
  border: "1px solid #dee2e6",
  borderRadius: 8,
  backgroundColor: "#f8f9fa",
  padding: 12,
};

const ratingPalette: Record<Rating, { border: string; color: string; label: string; iconClass: string }> = {
  again: { border: "#dc3545", color: "#dc3545", label: "Again", iconClass: "fa-solid fa-rotate-left" },
  hard: { border: "#fd7e14", color: "#fd7e14", label: "Hard", iconClass: "fa-solid fa-hand" },
  good: { border: "#0d6efd", color: "#0d6efd", label: "Good", iconClass: "fa-solid fa-thumbs-up" },
  easy: { border: "#198754", color: "#198754", label: "Easy", iconClass: "fa-solid fa-face-smile" },
};

export function RnwFlashCard({ word, memory, onRate }: RnwFlashCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const canSpeak = useMemo(() => speechApplicationService.canSpeak(), []);

  async function handleRate(rating: Rating) {
    setShowAnswer(false);
    await onRate(rating);
  }

  function speakWord() {
    if (!canSpeak) return;
    speechApplicationService.speakEnglish(word.headword);
  }

  function speakExample(text: string) {
    if (!canSpeak || !text.trim()) return;
    speechApplicationService.speakEnglish(text.trim());
  }

  return (
    <section style={cardStyle} data-testid="rnw-study-flash-card">
      <header style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <i className="fa-solid fa-layer-group" aria-hidden="true" style={{ color: "#0d6efd" }} />
          <strong>Flash Card</strong>
          <span style={{ background: "#f8f9fa", borderRadius: 999, padding: "2px 8px", fontSize: 12 }}>
            Lv {memory.memoryLevel}
          </span>
        </div>

        <RnwOutlineButton
          label="Speak"
          onPress={speakWord}
          disabled={!canSpeak}
          icon={<i className="fa-solid fa-volume-high" aria-hidden="true" />}
          testID="rnw-study-speak-word"
        />
      </header>

      <div style={bodyStyle}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 700 }}>{word.headword}</div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ background: "#6c757d", color: "#fff", borderRadius: 999, padding: "2px 8px", fontSize: 12 }}>
              {word.pos}
            </span>
          </div>
          <div style={{ color: "#6c757d", fontSize: 13 }}>
            due: {new Date(memory.dueAt).toLocaleString()}
          </div>
        </div>

        {!showAnswer ? (
          <RnwPrimaryButton
            label="Show Answer"
            onPress={() => setShowAnswer(true)}
            fullWidth
            testID="rnw-study-show-answer"
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={answerPanelStyle}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Meaning (JA)</div>
              <div>{word.meaningJa}</div>
            </div>

            {word.examples?.length ? (
              <div style={answerPanelStyle}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Examples</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {word.examples.map((example) => (
                    <div key={example.id} style={{ borderLeft: "3px solid #0d6efd", paddingLeft: 10 }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
                        <div style={{ flex: 1 }}>{example.en}</div>
                        <RnwOutlineButton
                          label="Speak"
                          onPress={() => speakExample(example.en)}
                          disabled={!canSpeak}
                          icon={<i className="fa-solid fa-volume-high" aria-hidden="true" />}
                        />
                      </div>
                      {example.ja ? <div style={{ color: "#6c757d", fontSize: 13 }}>{example.ja}</div> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
              {(Object.keys(ratingPalette) as Rating[]).map((rating) => {
                const spec = ratingPalette[rating];
                return (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => void handleRate(rating)}
                    style={{
                      border: `1px solid ${spec.border}`,
                      color: spec.color,
                      borderRadius: 6,
                      backgroundColor: "transparent",
                      padding: "8px 10px",
                    }}
                  >
                    <i className={spec.iconClass} aria-hidden="true" /> {spec.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
