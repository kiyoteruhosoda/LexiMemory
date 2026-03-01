// frontend/src/pages/WordDetailPage.tsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { wordApplicationService } from "../word/wordApplication";
import type { WordEntry } from "../api/types";
import { RnwWordForm } from "../rnw/components/RnwWordForm";
import { RnwInlineNotice } from "../rnw/components/RnwInlineNotice";
import { RnwConfirmDialog } from "../rnw/components/RnwConfirmDialog";
import { RnwButton } from "../rnw/components/RnwButton";
import { RnwActionGroup, RnwPageHeader, RnwPanelCard } from "@leximemory/ui";

export function WordDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [word, setWord] = useState<WordEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);


  async function loadWord() {
    if (!id) return;
    setError(null);
    setInfoMessage(null);
    setBusy(true);
    try {
      const found = await wordApplicationService.getWord(id);
      if (!found) {
        setError("Word not found");
        return;
      }
      setWord(found);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void loadWord();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleUpdate(draft: Omit<WordEntry, "id" | "createdAt" | "updatedAt">) {
    if (!word) return;
    setError(null);
    setInfoMessage(null);
    try {
      await wordApplicationService.updateWord(word.id, draft);
      navigate("/words");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update word");
    }
  }

  async function handleDelete() {
    if (!word) return;
    
    setError(null);
    setInfoMessage(null);
    try {
      await wordApplicationService.deleteWord(word.id);
      navigate("/words");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete word");
    }
  }

  async function handleResetMemory() {
    if (!word) return;
    
    setError(null);
    setInfoMessage(null);
    try {
      await wordApplicationService.resetWordMemory(word.id);
      setShowResetModal(false);
      setInfoMessage("Memory level has been reset.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to reset memory");
    }
  }

  if (busy) {
    return (
      <div className="vstack gap-3" data-testid="word-detail-page-ready">
        <RnwInlineNotice
          tone="info"
          message="Loading word details..."
          icon={<i className="fa-solid fa-spinner" aria-hidden="true" />}
        />
      </div>
    );
  }

  if (error && !word) {
    return (
      <div className="vstack gap-3" data-testid="word-detail-page-ready">
        <RnwButton
          label="Back"
          onPress={() => navigate("/words")}
          icon={<i className="fa-solid fa-arrow-left" aria-hidden="true" />}
          testID="rnw-word-detail-back"
          kind="outline"
        />
        <RnwInlineNotice
          tone="error"
          message={error}
          icon={<i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />}
        />
      </div>
    );
  }

  if (!word) return null;

  return (
    <div className="vstack gap-3" data-testid="word-detail-page-ready">
      <RnwPageHeader
        title="Edit Word"
        icon={<i className="fa-solid fa-edit text-primary" aria-hidden="true" />}
        action={
          <RnwButton
            label="Back"
            onPress={() => navigate("/words")}
            icon={<i className="fa-solid fa-arrow-left" aria-hidden="true" />}
            testID="rnw-word-detail-back"
            kind="outline"
          />
        }
        testID="rnw-word-detail-header"
      />

      {error ? (
        <RnwInlineNotice
          tone="error"
          message={error}
          icon={<i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />}
        />
      ) : null}

      {infoMessage ? (
        <RnwInlineNotice
          tone="info"
          message={infoMessage}
          icon={<i className="fa-solid fa-circle-info" aria-hidden="true" />}
        />
      ) : null}

      <RnwPanelCard testID="rnw-word-detail-form-panel">
        <RnwWordForm
          initial={word}
          onSave={handleUpdate}
          onCancel={() => navigate("/words")}
        />
      </RnwPanelCard>

      <RnwActionGroup testID="rnw-word-detail-action-group">
        <RnwButton
          label="Reset Memory Level"
          onPress={() => setShowResetModal(true)}
          icon={<i className="fa-solid fa-rotate-left" aria-hidden="true" />}
          testID="rnw-word-detail-reset"
          kind="solid"
          tone="warning"
        />
        <RnwButton
          label="Delete"
          onPress={() => setShowDeleteModal(true)}
          icon={<i className="fa-solid fa-trash" aria-hidden="true" />}
          testID="rnw-word-detail-delete"
          kind="solid"
          tone="danger"
        />
      </RnwActionGroup>

      <RnwConfirmDialog
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => { void handleDelete(); }}
        title="Delete Word"
        message={`Are you sure you want to delete "${word.headword}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        tone="danger"
      />

      <RnwConfirmDialog
        show={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={() => { void handleResetMemory(); }}
        title="Reset Memory Level"
        message={`Are you sure you want to reset the memory level for "${word.headword}"?`}
        confirmText="Reset"
        cancelText="Cancel"
        tone="warning"
      />
    </div>
  );
}
