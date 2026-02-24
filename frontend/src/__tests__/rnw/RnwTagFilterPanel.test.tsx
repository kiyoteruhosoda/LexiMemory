import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RnwTagFilterPanel } from "../../rnw/components/RnwTagFilterPanel";

describe("RnwTagFilterPanel", () => {
  it("delegates events", () => {
    const onToggleTag = vi.fn();
    const onClose = vi.fn();
    const onClear = vi.fn();
    const onApply = vi.fn();

    render(
      <RnwTagFilterPanel
        allTags={["daily", "business"]}
        selectedTags={["daily"]}
        onToggleTag={onToggleTag}
        onClose={onClose}
        onClear={onClear}
        onApply={onApply}
      />,
    );

    fireEvent.click(screen.getByTestId("rnw-tag-chip-daily"));
    fireEvent.click(screen.getByTestId("rnw-study-tag-close"));
    fireEvent.click(screen.getByTestId("rnw-study-tag-clear"));
    fireEvent.click(screen.getByTestId("rnw-study-tag-apply"));

    expect(onToggleTag).toHaveBeenCalledWith("daily");
    expect(onClose).toHaveBeenCalledOnce();
    expect(onClear).toHaveBeenCalledOnce();
    expect(onApply).toHaveBeenCalledOnce();
    expect(screen.getByText("✓ daily")).toBeInTheDocument();
  });
});
