import { useEffect, useState } from "react";
import { wordsApi } from "../api/words";
import { exportData, importData } from "../api/io";
import type { WordEntry, AppData } from "../api/types";
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
    await wordsApi.update(editing.id, draft);
    setEditing(null);
    await reload();
  }

  async function deleteWord(id: string) {
    if (!confirm("Delete this word?")) return;
    await wordsApi.delete(id);
    await reload();
  }

  async function handleExport() {
    setError(null);
    setBusy(true);
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leximemory-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setError(null);
      setBusy(true);
      try {
        const text = await file.text();
        const data: AppData = JSON.parse(text);
        
        const mode = confirm(
          "Choose import mode:\n\nOK = Merge with existing data\nCancel = Overwrite all data"
        ) ? "merge" : "overwrite";
        
        await importData(data, mode);
        await reload();
        alert("Import successful!");
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Import failed");
      } finally {
        setBusy(false);
      }
    };
    input.click();
  }

  return (
    <div className="vstack gap-3">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <h2 className="mb-0">
          <i className="fa-solid fa-list-check me-2 text-primary" />
          Words
        </h2>

        <div className="d-flex gap-2 align-items-center">
          <div className="btn-group">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => void handleExport()}
              disabled={busy}
              title="Export all data"
            >
              <i className="fa-solid fa-download me-1" />
              Export
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => void handleImport()}
              disabled={busy}
              title="Import data from file"
            >
              <i className="fa-solid fa-upload me-1" />
              Import
            </button>
          </div>

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
