import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RnwPlatformBadge } from "../../rnw/components/RnwPlatformBadge";

describe("RnwPlatformBadge", () => {
  it("renders RNW poc label", () => {
    render(<RnwPlatformBadge />);

    expect(screen.getByTestId("rnw-platform-badge")).toBeInTheDocument();
    expect(screen.getByText("RNW PoC")).toBeInTheDocument();
  });
});
