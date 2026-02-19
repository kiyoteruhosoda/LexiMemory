import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { wordsApi } from "../api/words.offline";
import { studyApi } from "../api/study.offline";
import type { WordEntry } from "../api/types";
import { WordForm } from "../components/WordForm";
import { ConfirmModal } from "../components/Modal";

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
      const found = await wordsApi.get(id);
      if (!found) {
        setError("Word not found");
        return;
      }
      setWord(found);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void loadWord();
  }, [id]);

  async function handleUpdate(draft: Omit<WordEntry, "id" | "createdAt" | "updatedAt">) {
    if (!word) return;
    setError(null);
    try {
      await wordsApi.update(word.id, draft);
      navigate("/words");
    } catch (e: any) {
      setError(e?.message || "Failed to update word");
    }
  }

  async function handleDelete() {
    if (!word) return;
    
    setError(null);
    try {
      await wordsApi.delete(word.id);
      navigate("/words");
    } catch (e: any) {
      setError(e?.message || "Failed to delete word");
    }
  }

  async function handleResetMemory() {
    if (!word) return;
    
    setError(null);
    try {
      await studyApi.resetMemory(word.id);
      setShowResetModal(false);
      alert("Memory level reset.");
    } catch (e: any) {
      setError(e?.message || "Failed to reset memory");
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
      <div className="vstack gap-3">
        <button
          className="btn btn-outline-secondary align-self-start"
          onClick={() => navigate("/words")}
        >
          <i className="fa-solid fa-arrow-left me-1" />
          Back
        </button>
        <div className="alert alert-danger">
          <i className="fa-solid fa-triangle-exclamation me-2" />
          {error}
        </div>
      </div>
    );
  }

  if (!word) return null;

  return (
    <div className="vstack gap-3">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <h2 className="mb-0">
          <i className="fa-solid fa-edit me-2 text-primary" />
          Edit Word
        </h2>
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate("/words")}
        >
          <i className="fa-solid fa-arrow-left me-1" />
          Back
        </button>
      </div>

      {error ? (
        <div className="alert alert-danger" role="alert">
          <i className="fa-solid fa-triangle-exclamation me-2" />
          {error}
        </div>
      ) : null}

      <WordForm
        initial={word}
        onSave={handleUpdate}
        onCancel={() => navigate("/words")}
      />

      <div className="d-none d-md-block">
        <div className="row g-3">
          <div className="col-md-6">
            <button
              className="btn btn-warning w-100"
              onClick={() => setShowResetModal(true)}
            >
              <i className="fa-solid fa-rotate-left me-1" />
              Reset Memory Level
            </button>
          </div>
          <div className="col-md-6">
            <button
              className="btn btn-danger w-100"
              onClick={() => setShowDeleteModal(true)}
            >
              <i className="fa-solid fa-trash me-1" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="d-md-none">
        <div className="btn-group w-100" role="group">
          <button
            type="button"
            className="btn btn-sm btn-warning"
            onClick={() => setShowResetModal(true)}
          >
            <i className="fa-solid fa-rotate-left me-1" />
            Reset
          </button>
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={() => setShowDeleteModal(true)}
          >
            <i className="fa-solid fa-trash me-1" />
            Delete
          </button>
        </div>
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
