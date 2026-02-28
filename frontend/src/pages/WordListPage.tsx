// frontend/src/pages/WordListPage.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { wordApplicationService } from "../word/wordApplication";
import type { WordEntry, MemoryState } from "../api/types";
import { RnwImportDialog } from "../rnw/components/RnwImportDialog";
import SyncButton from "../components/SyncButton";
import { backupExportService } from "../io/backupExportApplication";
import { RnwSearchPanel } from "../rnw/components/RnwSearchPanel";
import { RnwWordListTable } from "../rnw/components/RnwWordListTable";
import { RnwInlineNotice } from "../rnw/components/RnwInlineNotice";
import { RnwButton } from "../rnw/components/RnwButton";

export function WordListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<WordEntry[]>([]);
  const [memoryMap, setMemoryMap] = useState<Record<string, MemoryState>>({});
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);


  async function reload() {
    setError(null);
    setBusy(true);
    try {
      const result = await wordApplicationService.listWords({ q });
      setItems(result.items);
      setMemoryMap(result.memoryMap);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { void reload(); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleExport() {
    setError(null);
    setBusy(true);
    try {
      const data = await wordApplicationService.exportSnapshot();
      backupExportService.exportBackup(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  function handleImportSuccess() {
    void reload();
  }


  return (
    <div className="vstack gap-3" data-testid="word-list-page-ready">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex gap-2 align-items-center flex-wrap" data-testid="rnw-word-list-action-row">
          {/*
          <RnwPlatformBadge />
          */}
          <RnwButton
            label="Add"
            onPress={() => navigate("/words/create")}
            icon={<i className="fa-solid fa-plus" aria-hidden="true" />}
            testID="rnw-add-button"
            kind="solid"
            tone="primary"
          />

          <RnwButton
            label="Study"
            onPress={() => navigate("/study")}
            icon={<i className="fa-solid fa-graduation-cap" aria-hidden="true" />}
            testID="rnw-study-button"
            kind="outline"
            tone="primary"
          />

          <RnwButton
            label="Examples"
            onPress={() => navigate("/examples")}
            icon={<i className="fa-solid fa-pen-to-square" aria-hidden="true" />}
            testID="rnw-examples-button"
            kind="outline"
            tone="primary"
          />

          <RnwButton
            onPress={() => setShowSearch(!showSearch)}
            icon={<i className="fa-solid fa-magnifying-glass" aria-hidden="true" />}
            title="Toggle search"
            testID="rnw-toggle-search-button"
            kind="outline"
            tone="secondary"
          />

          <div className="d-none d-md-flex gap-2">
            <RnwButton
              label="Export"
              onPress={() => void handleExport()}
              disabled={busy}
              icon={<i className="fa-solid fa-upload" aria-hidden="true" />}
              testID="rnw-export-button"
              kind="outline"
              tone="secondary"
              size="sm"
            />

            <RnwButton
              label="Import"
              onPress={() => setShowImportModal(true)}
              disabled={busy}
              icon={<i className="fa-solid fa-download" aria-hidden="true" />}
              testID="rnw-import-button"
              kind="outline"
              tone="secondary"
              size="sm"
            />
          </div>
        </div>

        <SyncButton onSyncSuccess={reload} />
      </div>

      {showSearch && (
        <RnwSearchPanel
          value={q}
          busy={busy}
          onChange={setQ}
          onSubmit={() => void reload()}
          onClear={() => {
            setQ("");
            setShowSearch(false);
            void reload();
          }}
        />
      )}

      {error ? (
        <RnwInlineNotice
          tone="error"
          message={error}
          icon={<i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />}
        />
      ) : null}

      {items.length === 0 ? (
        <RnwInlineNotice
          tone="info"
          message="No words yet. Click 'Add' to create one."
          icon={<i className="fa-solid fa-circle-info" aria-hidden="true" />}
        />
      ) : (
        <RnwWordListTable
          items={items}
          memoryMap={memoryMap}
          onSelectWord={(wordId) => navigate(`/words/${wordId}`)}
        />
      )}

      <RnwImportDialog
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}
