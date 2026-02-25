import { useState } from "react";
import { ioApi } from "../../api/io.offline";
import type { AppDataForImport } from "../../api/types";
import { RnwInlineNotice } from "./RnwInlineNotice";
import { RnwOutlineButton } from "./RnwOutlineButton";
import { RnwPrimaryButton } from "./RnwPrimaryButton";

type ImportMode = "merge" | "overwrite";

type RnwImportDialogProps = {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function RnwImportDialog({ show, onClose, onSuccess }: RnwImportDialogProps) {
  const [mode, setMode] = useState<ImportMode>("merge");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!show) return null;

  async function handleImport() {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const text = await file.text();
      const data: AppDataForImport = JSON.parse(text);
      await ioApi.import(data, mode);
      onSuccess();
      handleClose();
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  function handleClose() {
    if (busy) return;
    setMode("merge");
    setFile(null);
    setError(null);
    onClose();
  }

  return (
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1060, padding: 12 }}>
      <section style={{ width: "min(620px, 100%)", backgroundColor: "#fff", borderRadius: 8, border: "1px solid #dee2e6", boxShadow: "0 0.5rem 1rem rgba(0,0,0,0.15)" }}>
        <header style={{ padding: 12, borderBottom: "1px solid #dee2e6", fontWeight: 700 }}>Import Data</header>
        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span>Select JSON File</span>
            <input
              type="file"
              accept="application/json,.json"
              disabled={busy}
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setFile(nextFile);
                setError(null);
              }}
            />
            {file ? <span style={{ color: "#6c757d", fontSize: 13 }}>{file.name}</span> : null}
          </label>

          <fieldset style={{ border: "1px solid #dee2e6", borderRadius: 8, padding: 10 }}>
            <legend style={{ fontSize: 14, margin: "0 6px" }}>Import Mode</legend>
            <label style={{ display: "flex", gap: 8 }}>
              <input type="radio" checked={mode === "merge"} onChange={() => setMode("merge")} disabled={busy} />
              <span><strong>Merge</strong> — Merge with existing data. Duplicates are overwritten.</span>
            </label>
            <label style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input type="radio" checked={mode === "overwrite"} onChange={() => setMode("overwrite")} disabled={busy} />
              <span><strong>Overwrite</strong> — Delete all existing data and import.</span>
            </label>
          </fieldset>

          {error ? <RnwInlineNotice tone="error" message={error} icon={<i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />} /> : null}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <RnwOutlineButton label="Cancel" onPress={handleClose} disabled={busy} />
            <RnwPrimaryButton label={busy ? "Importing..." : "Import"} onPress={() => void handleImport()} disabled={busy || !file} icon={<i className="fa-solid fa-download" aria-hidden="true" />} />
          </div>
        </div>
      </section>
    </div>
  );
}
