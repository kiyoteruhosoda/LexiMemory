import { render, screen } from "@testing-library/react";
import { RnwInlineNotice } from "../../rnw/components/RnwInlineNotice";

describe("RnwInlineNotice", () => {
  it("renders info tone message", () => {
    render(<RnwInlineNotice tone="info" message="Info message" />);

    expect(screen.getByText("Info message")).toBeInTheDocument();
    expect(screen.getByTestId("rnw-inline-notice-info")).toBeInTheDocument();
  });

  it("renders error tone message", () => {
    render(<RnwInlineNotice tone="error" message="Error message" />);

    expect(screen.getByText("Error message")).toBeInTheDocument();
    expect(screen.getByTestId("rnw-inline-notice-error")).toBeInTheDocument();
  });
});
