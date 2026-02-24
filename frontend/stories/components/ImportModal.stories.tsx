import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import { ImportModal } from "../../src/components/ImportModal";

const meta = {
  title: "Components/ImportModal",
  component: ImportModal,
  args: {
    show: true,
    onClose: fn(),
    onSuccess: fn(),
  },
} satisfies Meta<typeof ImportModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ValidationForMissingFile: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Import" }));
    await expect(canvas.getByText("Please select a file")).toBeVisible();
  },
};

export const ChangeImportMode: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const overwriteRadio = canvas.getByLabelText("Overwrite");
    await userEvent.click(overwriteRadio);
    await expect(overwriteRadio).toBeChecked();
  },
};
