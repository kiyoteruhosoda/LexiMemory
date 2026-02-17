import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { wordsApi } from "../api/words";
import { studyApi } from "../api/study";
import type { WordEntry } from "../api/types";
import { WordForm } from "../components/WordForm";
import { ApiError } from "../api/client";

export function WordDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [word, setWord] = useState<WordEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadWord() {
    if (!id) return;
    setError(null);
    setBusy(true);
    try {
      const result = await wordsApi.list();
      const found = result.words.find((w) => w.id === id);
      if (!found) {
        setError("単語が見つかりません");
        return;
      }
      setWord(found);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load");
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
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to update word");
    }
  }

  async function handleDelete() {
    if (!word) return;
    if (!confirm(`「${word.headword}」を削除しますか？\n\nこの操作は取り消せません。`)) return;
    
    setError(null);
    try {
      await wordsApi.delete(word.id);
      navigate("/words");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to delete word");
    }
  }

  async function handleResetMemory() {
    if (!word) return;
    if (!confirm(`「${word.headword}」の記憶レベルをリセットしますか？\n\n記憶状態がすべてクリアされます。`)) return;
    
    setError(null);
    try {
      await studyApi.resetMemory(word.id);
      alert("記憶レベルをリセットしました");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to reset memory");
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
          リストに戻る
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
          単語詳細
        </h2>
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate("/words")}
        >
          <i className="fa-solid fa-arrow-left me-1" />
          リストに戻る
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

      <div className="card border-danger">
        <div className="card-header bg-danger text-white">
          <i className="fa-solid fa-triangle-exclamation me-2" />
          危険な操作
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <h5 className="card-title">記憶レベルをリセット</h5>
              <p className="card-text text-secondary">
                この単語の記憶状態（レベル、復習間隔など）をすべてクリアします。単語自体は削除されません。
              </p>
              <button
                className="btn btn-warning"
                onClick={() => void handleResetMemory()}
              >
                <i className="fa-solid fa-rotate-left me-1" />
                記憶レベルをリセット
              </button>
            </div>
            <div className="col-md-6">
              <h5 className="card-title">単語を削除</h5>
              <p className="card-text text-secondary">
                この単語を完全に削除します。この操作は取り消せません。
              </p>
              <button
                className="btn btn-danger"
                onClick={() => void handleDelete()}
              >
                <i className="fa-solid fa-trash me-1" />
                単語を削除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
