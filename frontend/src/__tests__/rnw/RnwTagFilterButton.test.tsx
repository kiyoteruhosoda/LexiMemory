import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RnwTagFilterButton } from "../../rnw/components/RnwTagFilterButton";

describe("RnwTagFilterButton", () => {
  it("renders default label and handles click", async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();

    render(<RnwTagFilterButton onPress={onPress} testID="rnw-tags" />);
    await user.click(screen.getByTestId("rnw-tags"));

    expect(screen.getByText("Tags")).toBeInTheDocument();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders active count", () => {
    render(<RnwTagFilterButton activeCount={3} onPress={() => {}} testID="rnw-tags-active" />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
