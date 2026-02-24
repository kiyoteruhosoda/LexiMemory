import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RnwPrimaryButton } from "../../rnw/components/RnwPrimaryButton";

describe("RnwPrimaryButton", () => {
  it("renders label and triggers onPress", async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();

    render(<RnwPrimaryButton label="Add" onPress={onPress} testID="rnw-add" />);

    await user.click(screen.getByTestId("rnw-add"));

    expect(screen.getByText("Add")).toBeInTheDocument();
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
