import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RnwIconButton } from "../../rnw/components/RnwIconButton";

describe("RnwIconButton", () => {
  it("triggers onPress", async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();

    render(
      <RnwIconButton
        onPress={onPress}
        icon={<i className="fa-solid fa-magnifying-glass" aria-hidden="true" />}
        testID="rnw-icon"
      />
    );

    await user.click(screen.getByTestId("rnw-icon"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not trigger onPress when disabled", async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();

    render(
      <RnwIconButton
        onPress={onPress}
        icon={<i className="fa-solid fa-magnifying-glass" aria-hidden="true" />}
        disabled
        testID="rnw-icon-disabled"
      />
    );

    await user.click(screen.getByTestId("rnw-icon-disabled"));

    expect(onPress).not.toHaveBeenCalled();
  });
});
