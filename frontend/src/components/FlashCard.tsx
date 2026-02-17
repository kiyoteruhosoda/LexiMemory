// frontend/src/components/FlashCard.tsx

import { useMemo, useState } from "react";
import type { WordEntry, MemoryState, Rating } from "../api/types";

type Props = {
  word: WordEntry;
  memory: MemoryState;
  onRate: (rating: Rating) => Promise<void>;
};

export function FlashCard({ word, memory, onRate }: Props) {
  const [showAnswer, setShowAnswer] = useState(false);
  const canSpeak = useMemo(() => typeof window !== "undefined" && "speechSynthesis" in window, []);

  function speak() {
    if (!canSpeak) return;
    const ut = new SpeechSynthesisUtterance(word.headword);
    ut.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(ut);
  }

  function speakExample(text: string) {
    if (!canSpeak || !text.trim()) return;
    const ut = new SpeechSynthesisUtterance(text.trim());
    ut.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(ut);
  }

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <i className="fa-solid fa-layer-group text-primary" />
          <span className="fw-semibold">Flash Card</span>
          <span className="badge text-bg-light ms-2">Lv {memory.memoryLevel}</span>
        </div>

        <button className="btn btn-outline-secondary btn-sm" onClick={speak} disabled={!canSpeak} title="Speak">
          <i className="fa-solid fa-volume-high" />
        </button>
      </div>

      <div className="card-body">
        <div className="text-center">
          <div className="display-6 fw-bold">{word.headword}</div>
          <div className="mb-1">
            <span className="badge text-bg-secondary">{word.pos}</span>
          </div>
          <div className="text-secondary">
            due: <span className="mono">{new Date(memory.dueAt).toLocaleString()}</span>
          </div>
        </div>

        <hr />

        {!showAnswer ? (
          <div className="d-grid">
            <button className="btn btn-primary" onClick={() => setShowAnswer(true)}>
              <i className="fa-solid fa-eye me-2" />
              Show Answer
            </button>
          </div>
        ) : (
          <div className="vstack gap-3">
            <div className="alert alert-light border">
              <div className="fw-semibold mb-1">Meaning (JA)</div>
              <div>{word.meaningJa}</div>
            </div>

            {word.examples?.length ? (
              <div className="alert alert-light border">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="fw-semibold">Example</span>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    type="button"
                    onClick={() => speakExample(word.examples[0].en)}
                    disabled={!canSpeak}
                    title="Speak example">
                    <i className="fa-solid fa-volume-high" />
                  </button>
                </div>

                <div>
                  <div className="mb-1">{word.examples[0].en}</div>
                  {word.examples[0].ja && (
                    <div className="text-secondary">{word.examples[0].ja}</div>
                  )}
                </div>
              </div>
            ) : null}

            <div className="row g-2 justify-content-center">
              <div className="col-6 col-md-3">
                <button
                  className="btn btn-outline-danger w-100"
                  onClick={() => void onRate("again")}
                >
                  <i className="fa-solid fa-rotate-left me-1" /> Again
                </button>
              </div>

              <div className="col-6 col-md-3">
                <button
                  className="btn btn-outline-warning w-100"
                  onClick={() => void onRate("hard")}
                >
                  <i className="fa-solid fa-hand me-1" /> Hard
                </button>
              </div>

              <div className="col-6 col-md-3">
                <button
                  className="btn btn-outline-primary w-100"
                  onClick={() => void onRate("good")}
                >
                  <i className="fa-solid fa-thumbs-up me-1" /> Good
                </button>
              </div>

              <div className="col-6 col-md-3">
                <button
                  className="btn btn-outline-success w-100"
                  onClick={() => void onRate("easy")}
                >
                  <i className="fa-solid fa-face-smile me-1" /> Easy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
