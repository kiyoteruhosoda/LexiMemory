import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import { FlashCard } from "../../src/components/FlashCard";

const baseWord = {
  id: "word-1",
  headword: "resilient",
  pronunciation: null,
  pos: "adj",
  meaningJa: "回復力のある",
  examples: [{ id: "ex-1", en: "She is resilient under pressure.", ja: "彼女はプレッシャーに強い。", source: null }],
  tags: ["daily"],
  memo: null,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
} as const;

const baseMemory = {
  wordId: "word-1",
  memoryLevel: 2,
  ease: 2.5,
  intervalDays: 3,
  dueAt: "2025-01-10T00:00:00.000Z",
  lastRating: "good",
  lastReviewedAt: "2025-01-07T00:00:00.000Z",
  lapseCount: 0,
  reviewCount: 5,
} as const;

const meta = {
  title: "Components/FlashCard",
  component: FlashCard,
  args: {
    word: baseWord,
    memory: baseMemory,
    onRate: fn(async () => undefined),
  },
} satisfies Meta<typeof FlashCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RevealAnswer: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Show Answer" }));
    await expect(canvas.getByText("Meaning (JA)")).toBeVisible();
    await expect(canvas.getByText("回復力のある")).toBeVisible();
  },
};

export const RateGood: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Show Answer" }));
    await userEvent.click(canvas.getByRole("button", { name: /Good/ }));
    await expect(args.onRate).toHaveBeenCalledWith("good");
  },
};
