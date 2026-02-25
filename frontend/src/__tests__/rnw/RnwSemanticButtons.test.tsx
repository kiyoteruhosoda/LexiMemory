import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RnwDangerButton, RnwWarningButton } from "@leximemory/ui";

describe("Rnw semantic buttons", () => {
  it("handles warning and danger button press", async () => {
    const user = userEvent.setup();
    const onWarning = vi.fn();
    const onDanger = vi.fn();

    render(
      <div>
        <RnwWarningButton label="Reset" onPress={onWarning} />
        <RnwDangerButton label="Delete" onPress={onDanger} />
      </div>
    );

    await user.click(screen.getByText("Reset"));
    await user.click(screen.getByText("Delete"));

    expect(onWarning).toHaveBeenCalledTimes(1);
    expect(onDanger).toHaveBeenCalledTimes(1);
  });
});
