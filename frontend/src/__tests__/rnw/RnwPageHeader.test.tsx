import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RnwPageHeader } from "@leximemory/ui";

describe("RnwPageHeader", () => {
  it("renders title and action", () => {
    render(
      <RnwPageHeader
        title="Header Title"
        action={<button type="button">Back</button>}
        testID="page-header"
      />
    );

    expect(screen.getByText("Header Title")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
    expect(document.querySelector('[data-testid="page-header"]')).not.toBeNull();
  });
});
