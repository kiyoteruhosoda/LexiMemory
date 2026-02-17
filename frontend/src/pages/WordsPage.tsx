import { useEffect, useState } from "react";
import { wordsApi } from "../api/words";
import type { WordEntry } from "../api/types";
import { WordForm } from "../components/WordForm";
import { WordList } from "../components/WordList";
import { ApiError } from "../api/client";

export function WordsPage() {
  const [items, setItems] = useState<WordEntry[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<WordEntry | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    setError(null);
    setBusy(true);
    try {
      setItems(await wordsApi.list(q));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { void reload(); }, []);

  async function addWord(draft: Omit<WordEntry, "id" | "createdAt" | "updatedAt">) {
    await wordsApi.create(draft);
    await reload();
  }

  async function updateWord(draft: Omit<WordEntry, "id" | "createdAt" | "updatedAt">) {
    if (!editing) return;
    const updated: WordEntry = { ...editing, ...draft };
    await wordsApi.update(editing.id, updated);
    setEditing(null);
    await reload();
  }

  async function deleteWord(id: string) {
    if (!confirm("Delete this word?")) return;
    await wordsApi.delete(id);
    await reload();
  }

  return (
    <div className="vstack gap-3">
      <div className="d-flex align-items-center justify-content-between">
        <h2 className="mb-0">
          <i className="fa-solid fa-list-check me-2 text-primary" />
          Words
        </h2>

        <form
          className="d-flex gap-2"
          onSubmit={(e) => { e.preventDefault(); void reload(); }}
        >
          <div className="input-group">
            <span className="input-group-text">
              <i className="fa-solid fa-magnifying-glass" />
            </span>
            <input
              className="form-control"
              placeholder="Search (EN/JA)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button className="btn btn-outline-primary" type="submit" disabled={busy}>
            {busy ? <span className="spinner-border spinner-border-sm" /> : <i className="fa-solid fa-filter" />}
          </button>
        </form>
      </div>

      {error ? (
        <div className="alert alert-danger" role="alert">
          <i className="fa-solid fa-triangle-exclamation me-2" />
          {error}
        </div>
      ) : null}

      <WordForm
        initial={editing}
        onSave={editing ? updateWord : addWord}
        onCancel={editing ? () => setEditing(null) : undefined}
      />

      <WordList items={items} onEdit={setEditing} onDelete={(id) => void deleteWord(id)} />
    </div>
  );
}
