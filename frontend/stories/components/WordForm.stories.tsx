import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import { WordForm } from "../../src/components/WordForm";

const meta = {
  title: "Components/WordForm",
  component: WordForm,
  args: {
    onSave: fn(async () => undefined),
    onCancel: fn(),
  },
} satisfies Meta<typeof WordForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SaveNewWord: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText("Word"), "ubiquitous");
    await userEvent.selectOptions(canvas.getByLabelText("POS"), "adj");
    await userEvent.type(canvas.getByLabelText("Meaning (JA)"), "至るところにある");

    await userEvent.type(canvas.getByLabelText("English"), "Smartphones are ubiquitous today.");
    await userEvent.type(canvas.getByLabelText("Japanese (translation)"), "スマートフォンは今やどこにでもある。");

    await userEvent.click(canvas.getByRole("button", { name: /Add$/ }));

    await expect(args.onSave).toHaveBeenCalledTimes(1);
    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        headword: "ubiquitous",
        pos: "adj",
        meaningJa: "至るところにある",
      }),
    );
  },
};

export const CancelEdit: Story = {
  args: {
    initial: {
      id: "word-2",
      headword: "elaborate",
      pronunciation: null,
      pos: "verb",
      meaningJa: "詳しく述べる",
      examples: [{ id: "ex-2", en: "Please elaborate your idea.", ja: "あなたの考えを詳しく説明してください。", source: null }],
      tags: [],
      memo: null,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Cancel" }));
    await expect(args.onCancel).toHaveBeenCalledTimes(1);
  },
};
