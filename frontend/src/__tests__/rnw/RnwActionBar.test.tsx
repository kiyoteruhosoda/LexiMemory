import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RnwActionBar } from "@leximemory/ui";

describe("RnwActionBar", () => {
  it("renders leading and trailing content", () => {
    render(
      <RnwActionBar
        leading={<button type="button">Left</button>}
        trailing={<button type="button">Right</button>}
        testID="rnw-action-bar"
      />,
    );

    expect(screen.getByTestId("rnw-action-bar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Left" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Right" })).toBeInTheDocument();
  });
});
