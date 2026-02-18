// frontend/src/components/WordForm.tsx

import { useEffect, useMemo, useState } from "react";
import type { Pos, WordEntry, ExampleSentence } from "../api/types";

const POS: Pos[] = ["noun","verb","adj","adv","prep","conj","pron","det","interj","other"];

type Props = {
  initial?: WordEntry | null;
  onSave: (draft: Omit<WordEntry, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onCancel?: () => void;
};

export function WordForm({ initial, onSave, onCancel }: Props) {
  const [headword, setHeadword] = useState(initial?.headword ?? "");
  const [pos, setPos] = useState<Pos>(initial?.pos ?? "noun");
  const [meaningJa, setMeaningJa] = useState(initial?.meaningJa ?? "");
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [examples, setExamples] = useState<ExampleSentence[]>(
    initial?.examples && initial.examples.length > 0
      ? initial.examples
      : [{ id: crypto.randomUUID(), en: "", ja: null, source: null }]
  );
  const [busy, setBusy] = useState(false);

  // Update state when initial changes (for edit mode)
  useEffect(() => {
    if (initial) {
      setHeadword(initial.headword);
      setPos(initial.pos);
      setMeaningJa(initial.meaningJa);
      setMemo(initial.memo ?? "");
      setExamples(
        initial.examples && initial.examples.length > 0
          ? initial.examples
          : [{ id: crypto.randomUUID(), en: "", ja: null, source: null }]
      );
    }
  }, [initial]);

  const canSpeak = useMemo(() => typeof window !== "undefined" && "speechSynthesis" in window, []);

  function speakHeadword() {
    if (!canSpeak || !headword.trim()) return;
    const ut = new SpeechSynthesisUtterance(headword.trim());
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

  function addExample() {
    setExamples([...examples, { id: crypto.randomUUID(), en: "", ja: null, source: null }]);
  }

  function updateExample(id: string, field: keyof ExampleSentence, value: string) {
    setExamples(examples.map(ex => ex.id === id ? { ...ex, [field]: value || null } : ex));
  }

  function removeExample(id: string) {
    setExamples(examples.filter(ex => ex.id !== id));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await onSave({
        headword: headword.trim(),
        pos,
        meaningJa: meaningJa.trim(),
        pronunciation: initial?.pronunciation ?? null,
        tags: initial?.tags ?? [],
        examples: examples.filter(ex => ex.en.trim()),
        memo: memo.trim() || null,
      });
      if (!initial) {
        setHeadword("");
        setMeaningJa("");
        setMemo("");
        setExamples([{ id: crypto.randomUUID(), en: "", ja: null, source: null }]);
        setPos("noun");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white">
        <div className="d-flex align-items-center gap-2">
          <i className={`fa-solid ${initial ? "fa-pen-to-square" : "fa-circle-plus"} text-primary`} />
          <span className="fw-semibold">{initial ? "Edit word" : "Add a new word"}</span>
        </div>
      </div>
      <div className="card-body">
        <form onSubmit={submit} className="row g-3">
          <div className="col-12 col-md-5">
            <label htmlFor="headword-input" className="form-label">Word</label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="fa-solid fa-spell-check" />
              </span>
              <input
                id="headword-input"
                className="form-control"
                value={headword}
                onChange={(e) => setHeadword(e.target.value)}
                required
              />
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={speakHeadword}
                disabled={!canSpeak || !headword.trim()}
                title="Speak word"
              >
                <i className="fa-solid fa-volume-high" />
              </button>
            </div>
          </div>

          <div className="col-12 col-md-3">
            <label htmlFor="pos-select" className="form-label">POS</label>
            <select id="pos-select" className="form-select" value={pos} onChange={(e) => setPos(e.target.value as Pos)}>
              {POS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="col-12 col-md-4">
            <label htmlFor="meaning-ja-input" className="form-label">Meaning (JA)</label>
            <input
              id="meaning-ja-input"
              className="form-control"
              value={meaningJa}
              onChange={(e) => setMeaningJa(e.target.value)}
              required
            />
          </div>

          <div className="col-12">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <label className="form-label mb-0">
                Example Sentences
              </label>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={addExample}
              >
                <i className="fa-solid fa-plus me-1" />
                Add Example
              </button>
            </div>

            <div className="d-flex flex-column gap-3">
              {examples.map((ex) => (
                <div key={ex.id} className="border rounded p-3 bg-light">
                  <div className="row g-2">
                    <div className="col-12">
                      <label className="form-label mb-1">English</label>
                      <div className="input-group">
                          <input
                            className="form-control"
                            value={ex.en}
                            onChange={(e) => updateExample(ex.id, "en", e.target.value)}
                            placeholder="Example sentence in English..."
                          />
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => speakExample(ex.en)}
                            disabled={!canSpeak || !ex.en.trim()}
                            title="Speak English sentence"
                          >
                            <i className="fa-solid fa-volume-high" />
                          </button>
                        </div>
                      </div>
                      <div className="col-12">
                        <label className="form-label mb-1">Japanese (translation)</label>
                        <input
                          className="form-control"
                          value={ex.ja ?? ""}
                          onChange={(e) => updateExample(ex.id, "ja", e.target.value)}
                          placeholder="日本語訳..."
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label mb-1">Source (optional)</label>
                        <div className="input-group">
                          <input
                            className="form-control"
                            value={ex.source ?? ""}
                            onChange={(e) => updateExample(ex.id, "source", e.target.value)}
                            placeholder="Book, article, etc..."
                          />
                          <button
                            className="btn btn-outline-danger"
                            type="button"
                            onClick={() => removeExample(ex.id)}
                            title="Remove example"
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          </div>

          <div className="col-12">
            <label className="form-label">
              Memo (optional)
            </label>
            <textarea
              className="form-control"
              rows={2}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Personal notes about this word..."
            />
          </div>

          <div className="col-12 d-flex gap-2">
            <button className="btn btn-primary" disabled={busy} type="submit">
              {busy ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Saving...
                </>
              ) : initial ? (
                <>
                  <i className="fa-solid fa-floppy-disk me-2" />
                  Update
                </>
              ) : (
                <>
                  <i className="fa-solid fa-plus me-2" />
                  Add
                </>
              )}
            </button>

            {onCancel ? (
              <button className="btn btn-outline-secondary" type="button" onClick={onCancel}>
                <i className="fa-solid fa-xmark me-2" />
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
