import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RnwSurfaceCard } from "@leximemory/ui";

describe("RnwSurfaceCard", () => {
  it("renders children and test id", () => {
    render(
      <RnwSurfaceCard testID="surface-card">
        <span>Card content</span>
      </RnwSurfaceCard>
    );

    expect(screen.getByText("Card content")).toBeInTheDocument();
    expect(document.querySelector('[data-testid="surface-card"]')).not.toBeNull();
  });
});
