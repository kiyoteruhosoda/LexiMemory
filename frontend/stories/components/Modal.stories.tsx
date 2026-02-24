import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import { ConfirmModal, Modal } from "../../src/components/Modal";

const meta = {
  title: "Components/Modal",
  component: Modal,
  args: {
    show: true,
    title: "確認ダイアログ",
    onClose: fn(),
    children: <p>内容テキスト</p>,
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CloseByHeaderButton: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "確認ダイアログ" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Close" }));
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};

export const ConfirmAction: StoryObj<typeof ConfirmModal> = {
  render: (args) => <ConfirmModal {...args} />,
  args: {
    show: true,
    title: "削除確認",
    message: "この単語を削除しますか？",
    confirmText: "削除",
    cancelText: "キャンセル",
    onClose: fn(),
    onConfirm: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "削除" }));
    await expect(args.onConfirm).toHaveBeenCalledTimes(1);
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};
