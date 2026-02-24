import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RnwSearchPanel } from "../../rnw/components/RnwSearchPanel";

describe("RnwSearchPanel", () => {
  it("dispatches search interactions", () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    const onClear = vi.fn();

    render(
      <RnwSearchPanel
        value="hello"
        busy={false}
        onChange={onChange}
        onSubmit={onSubmit}
        onClear={onClear}
      />,
    );

    fireEvent.change(screen.getByTestId("rnw-search-input"), { target: { value: "updated" } });
    fireEvent.click(screen.getByTestId("rnw-search-apply-button"));
    fireEvent.click(screen.getByTestId("rnw-search-clear-button"));

    expect(onChange).toHaveBeenCalledWith("updated");
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
