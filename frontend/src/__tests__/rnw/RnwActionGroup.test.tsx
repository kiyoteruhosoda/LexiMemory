import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RnwActionGroup } from "@leximemory/ui";

describe("RnwActionGroup", () => {
  it("renders children in shared action row", () => {
    render(
      <RnwActionGroup testID="rnw-action-group">
        <button type="button">Reset</button>
        <button type="button">Delete</button>
      </RnwActionGroup>,
    );

    expect(screen.getByTestId("rnw-action-group")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });
});
