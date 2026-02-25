import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { wordApplicationService } from "../word/wordApplication";
import type { WordEntry } from "../api/types";
import { WordForm } from "../components/WordForm";
import { RnwInlineNotice } from "../rnw/components/RnwInlineNotice";
import { RnwOutlineButton } from "../rnw/components/RnwOutlineButton";
import { RnwPageHeader, RnwPanelCard } from "@leximemory/ui";

export function WordCreatePage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);


  async function handleCreate(draft: Omit<WordEntry, "id" | "createdAt" | "updatedAt">) {
    setError(null);
    try {
      await wordApplicationService.createWord(draft);
      navigate("/words");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create word");
    }
  }

  return (
    <div className="vstack gap-3" data-testid="word-create-page-ready">
      <RnwPageHeader
        title="Add Word"
        icon={<i className="fa-solid fa-plus text-primary" aria-hidden="true" />}
        action={
          <RnwOutlineButton
            label="Back"
            onPress={() => navigate("/words")}
            icon={<i className="fa-solid fa-arrow-left" aria-hidden="true" />}
            testID="rnw-word-create-back"
          />
        }
        testID="rnw-word-create-header"
      />

      {error ? (
        <RnwInlineNotice
          tone="error"
          message={error}
          icon={<i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />}
        />
      ) : null}

      <RnwPanelCard testID="rnw-word-create-form-panel">
        <WordForm
          onSave={handleCreate}
          onCancel={() => navigate("/words")}
        />
      </RnwPanelCard>
    </div>
  );
}
