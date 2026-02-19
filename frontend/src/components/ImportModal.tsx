// frontend/src/components/ImportModal.tsx

import { useState } from "react";
import { Modal } from "./Modal";
import { ioApi } from "../api/io.offline";
import type { AppData } from "../api/types";

type ImportModalProps = {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function ImportModal({ show, onClose, onSuccess }: ImportModalProps) {
  const [mode, setMode] = useState<"merge" | "overwrite">("merge");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("ファイルを選択してください");
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const text = await file.text();
      const data: AppData = JSON.parse(text);
      await ioApi.import(data, mode);
      onSuccess();
      onClose();
      // Reset state
      setFile(null);
      setMode("merge");
    } catch (e: any) {
      setError(e?.message || "インポートに失敗しました");
    } finally {
      setBusy(false);
    }
  };

  const handleClose = () => {
    if (!busy) {
      setFile(null);
      setMode("merge");
      setError(null);
      onClose();
    }
  };

  return (
    <Modal show={show} onClose={handleClose} title="データをインポート">
      <div className="vstack gap-3">
        <div>
          <label htmlFor="import-file" className="form-label">
            JSONファイルを選択
          </label>
          <input
            id="import-file"
            type="file"
            className="form-control"
            accept="application/json,.json"
            onChange={handleFileChange}
            disabled={busy}
          />
          {file && (
            <div className="text-muted small mt-1">
              <i className="fa-solid fa-file me-1" />
              {file.name}
            </div>
          )}
        </div>

        <div>
          <label className="form-label">インポートモード</label>
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="importMode"
              id="mode-merge"
              value="merge"
              checked={mode === "merge"}
              onChange={() => setMode("merge")}
              disabled={busy}
            />
            <label className="form-check-label" htmlFor="mode-merge">
              <strong>マージ</strong>
              <div className="text-muted small">
                既存データと統合します。IDが重複する場合は新しいデータで上書きされます。
              </div>
            </label>
          </div>
          <div className="form-check mt-2">
            <input
              className="form-check-input"
              type="radio"
              name="importMode"
              id="mode-overwrite"
              value="overwrite"
              checked={mode === "overwrite"}
              onChange={() => setMode("overwrite")}
              disabled={busy}
            />
            <label className="form-check-label" htmlFor="mode-overwrite">
              <strong>上書き</strong>
              <div className="text-muted small">
                既存の全データを削除してインポートします。（注意: 既存データは失われます）
              </div>
            </label>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger mb-0">
            <i className="fa-solid fa-triangle-exclamation me-2" />
            {error}
          </div>
        )}

        <div className="d-flex gap-2 justify-content-end">
          <button
            className="btn btn-outline-secondary"
            onClick={handleClose}
            disabled={busy}
          >
            キャンセル
          </button>
          <button
            className="btn btn-primary"
            onClick={handleImport}
            disabled={busy || !file}
          >
            {busy ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                インポート中...
              </>
            ) : (
              <>
                <i className="fa-solid fa-upload me-2" />
                インポート
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
