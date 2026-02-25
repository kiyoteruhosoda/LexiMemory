import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { wordApplicationService } from "../word/wordApplication";
import type { WordEntry } from "../api/types";
import { WordForm } from "../components/WordForm";
import { ConfirmModal } from "../components/Modal";
import { RnwInlineNotice } from "../rnw/components/RnwInlineNotice";
import { RnwOutlineButton } from "../rnw/components/RnwOutlineButton";
import { RnwDangerButton, RnwPageHeader, RnwPanelCard, RnwWarningButton } from "@leximemory/ui";

export function WordDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [word, setWord] = useState<WordEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);


  async function loadWord() {
    if (!id) return;
    setError(null);
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
    try {
      await wordApplicationService.resetWordMemory(word.id);
      setShowResetModal(false);
      alert("Memory level reset.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to reset memory");
    }
  }

  if (busy) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error && !word) {
    return (
      <div className="vstack gap-3" data-testid="word-detail-page-ready">
        <RnwOutlineButton
          label="Back"
          onPress={() => navigate("/words")}
          icon={<i className="fa-solid fa-arrow-left" aria-hidden="true" />}
          testID="rnw-word-detail-back"
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
          <RnwOutlineButton
            label="Back"
            onPress={() => navigate("/words")}
            icon={<i className="fa-solid fa-arrow-left" aria-hidden="true" />}
            testID="rnw-word-detail-back"
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

      <RnwPanelCard testID="rnw-word-detail-form-panel">
        <WordForm
          initial={word}
          onSave={handleUpdate}
          onCancel={() => navigate("/words")}
        />
      </RnwPanelCard>

      <div className="d-flex gap-2 flex-wrap">
        <RnwWarningButton
          label="Reset Memory Level"
          onPress={() => setShowResetModal(true)}
          icon={<i className="fa-solid fa-rotate-left" aria-hidden="true" />}
          testID="rnw-word-detail-reset"
        />
        <RnwDangerButton
          label="Delete"
          onPress={() => setShowDeleteModal(true)}
          icon={<i className="fa-solid fa-trash" aria-hidden="true" />}
          testID="rnw-word-detail-delete"
        />
      </div>

      <ConfirmModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Word"
        message={`Are you sure you want to delete "${word.headword}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      <ConfirmModal
        show={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleResetMemory}
        title="Reset Memory Level"
        message={`Are you sure you want to reset the memory level for "${word.headword}"?`}
        confirmText="Reset"
        cancelText="Cancel"
        variant="warning"
      />
    </div>
  );
}
