import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RnwExamplesQuizCard } from "../../rnw/components/RnwExamplesQuizCard";
import type { ExampleTestItem } from "../../api/types";

const example: ExampleTestItem = {
  id: "example-1",
  en: "I travel to work by train.",
  ja: "私は電車で通勤します。",
  word: {
    id: "word-1",
    headword: "travel",
    meaningJa: "旅行する",
    pos: "verb",
    tags: [],
  },
};

describe("RnwExamplesQuizCard", () => {
  it("renders quiz card and forwards answer submission", async () => {
    const user = userEvent.setup();
    const onSubmitAnswer = vi.fn();

    render(
      <RnwExamplesQuizCard
        example={example}
        blankedSentence="I _______ to work by train."
        actualWordInSentence="travel"
        userInput=""
        feedback={null}
        showAnswer={false}
        showWordInfo={false}
        showTranslation={false}
        canSpeak={true}
        onShowWordInfo={vi.fn()}
        onToggleTranslation={vi.fn()}
        onSpeakSentence={vi.fn()}
        onSpeakAnswer={vi.fn()}
        onGoToStudy={vi.fn()}
        onInputChange={vi.fn()}
        onSubmitAnswer={onSubmitAnswer}
        onNext={vi.fn()}
      />,
    );

    expect(screen.getByTestId("rnw-examples-quiz-card")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /check/i }));
    expect(onSubmitAnswer).toHaveBeenCalledTimes(1);
  });

  it("shows correct answer actions and fires callbacks", async () => {
    const user = userEvent.setup();
    const onSpeakAnswer = vi.fn();
    const onGoToStudy = vi.fn();

    render(
      <RnwExamplesQuizCard
        example={example}
        blankedSentence="I _______ to work by train."
        actualWordInSentence="travel"
        userInput="travel"
        feedback="correct"
        showAnswer={true}
        showWordInfo={false}
        showTranslation={false}
        canSpeak={true}
        onShowWordInfo={vi.fn()}
        onToggleTranslation={vi.fn()}
        onSpeakSentence={vi.fn()}
        onSpeakAnswer={onSpeakAnswer}
        onGoToStudy={onGoToStudy}
        onInputChange={vi.fn()}
        onSubmitAnswer={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open in Study" }));
    await user.click(screen.getByRole("button", { name: "Speak Correct Answer" }));

    expect(onGoToStudy).toHaveBeenCalledTimes(1);
    expect(onSpeakAnswer).toHaveBeenCalledTimes(1);
  });
});
