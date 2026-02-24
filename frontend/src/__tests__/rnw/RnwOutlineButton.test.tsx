import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RnwOutlineButton } from "../../rnw/components/RnwOutlineButton";

describe("RnwOutlineButton", () => {
  it("renders label and triggers onPress", async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();

    render(<RnwOutlineButton label="Words" onPress={onPress} testID="rnw-words" />);

    await user.click(screen.getByTestId("rnw-words"));

    expect(screen.getByText("Words")).toBeInTheDocument();
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
