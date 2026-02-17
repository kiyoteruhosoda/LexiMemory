// frontend/src/components/WordForm.tsx

import { useMemo, useState } from "react";
import type { Pos, WordEntry } from "../api/types";

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
  const [busy, setBusy] = useState(false);

  const canSpeak = useMemo(() => typeof window !== "undefined" && "speechSynthesis" in window, []);

  function speak() {
    if (!canSpeak || !headword.trim()) return;
    const ut = new SpeechSynthesisUtterance(headword.trim());
    ut.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(ut);
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
        examples: initial?.examples ?? [],
      });
      if (!initial) {
        setHeadword("");
        setMeaningJa("");
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
            <label className="form-label">Word</label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="fa-solid fa-spell-check" />
              </span>
              <input
                className="form-control"
                value={headword}
                onChange={(e) => setHeadword(e.target.value)}
                required
              />
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={speak}
                disabled={!canSpeak || !headword.trim()}
                title="Speak"
              >
                <i className="fa-solid fa-volume-high" />
              </button>
            </div>
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label">POS</label>
            <select className="form-select" value={pos} onChange={(e) => setPos(e.target.value as Pos)}>
              {POS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label">Meaning (JA)</label>
            <input
              className="form-control"
              value={meaningJa}
              onChange={(e) => setMeaningJa(e.target.value)}
              required
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
