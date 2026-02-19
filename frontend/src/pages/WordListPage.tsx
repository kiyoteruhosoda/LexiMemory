import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { wordsApi } from "../api/words.offline";
import { ioApi } from "../api/io.offline";
import type { WordEntry, MemoryState } from "../api/types";
import { ImportModal } from "../components/ImportModal";

export function WordListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<WordEntry[]>([]);
  const [memoryMap, setMemoryMap] = useState<Record<string, MemoryState>>({});
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  async function reload() {
    setError(null);
    setBusy(true);
    try {
      const result = await wordsApi.list(q);
      setItems(result.words);
      setMemoryMap(result.memoryMap);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { void reload(); }, []);

  async function handleExport() {
    setError(null);
    setBusy(true);
    try {
      const data = await ioApi.export();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leximemory-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message || "Export failed");
    } finally {
      setBusy(false);
    }
  }

  function handleImportSuccess() {
    void reload();
  }

  function getMemoryLevel(wordId: string): number {
    return memoryMap[wordId]?.memoryLevel ?? 0;
  }

  return (
    <div className="vstack gap-3">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">

        <div className="d-flex gap-2 align-items-center">
          <button
            className="btn btn-primary"
            onClick={() => navigate("/words/create")}
          >
            <i className="fa-solid fa-plus me-1" />
            Add
          </button>

          <div className="btn-group d-none d-md-flex">
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
              onClick={() => setShowImportModal(true)}
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

      {items.length === 0 ? (
        <div className="alert alert-info">
          <i className="fa-solid fa-circle-info me-2" />
          No words yet. Click "Add" to create one.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ width: "20%" }}>Word</th>
                <th style={{ width: "10%" }}>POS</th>
                <th style={{ width: "30%" }}>Meaning</th>
                <th style={{ width: "15%" }}>Examples</th>
                <th style={{ width: "15%" }}>Level</th>
              </tr>
            </thead>
            <tbody>
              {items.map((word) => {
                const level = getMemoryLevel(word.id);
                return (
                  <tr
                    key={word.id}
                    onClick={() => navigate(`/words/${word.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="fw-semibold">{word.headword}</td>
                    <td>
                      <span className="badge text-bg-secondary">{word.pos}</span>
                    </td>
                    <td>{word.meaningJa}</td>
                    <td>
                      <span className="badge text-bg-light">
                        <i className="fa-solid fa-quote-left me-1" />
                        {word.examples?.length ?? 0}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        level >= 4 ? "text-bg-success" :
                        level >= 2 ? "text-bg-primary" :
                        level >= 1 ? "text-bg-warning" :
                        "text-bg-secondary"
                      }`}>
                        <i className="fa-solid fa-layer-group me-1" />
                        Lv {level}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ImportModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}
