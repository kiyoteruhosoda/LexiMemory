import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { wordsApi } from "../api/words";
import type { WordEntry } from "../api/types";
import { WordForm } from "../components/WordForm";
import { ApiError } from "../api/client";

export function WordCreatePage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(draft: Omit<WordEntry, "id" | "createdAt" | "updatedAt">) {
    setError(null);
    try {
      await wordsApi.create(draft);
      navigate("/words");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to create word");
    }
  }

  return (
    <div className="vstack gap-3">
      <div className="d-flex align-items-center justify-content-between">
        <h2 className="mb-0">
          <i className="fa-solid fa-plus me-2 text-primary" />
          単語登録
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
        onSave={handleCreate}
        onCancel={() => navigate("/words")}
      />
    </div>
  );
}
