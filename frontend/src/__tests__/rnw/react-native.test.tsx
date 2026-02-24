import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Pressable } from "../../rnw/react-native";

describe("RNW Pressable shim", () => {
  it("applies pressed style callback", () => {
    render(
      <Pressable
        style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
        testID="pressable"
      >
        label
      </Pressable>,
    );

    const button = screen.getByTestId("pressable");
    expect(button).toHaveStyle({ opacity: "1" });

    fireEvent.mouseDown(button);
    expect(button).toHaveStyle({ opacity: "0.5" });

    fireEvent.mouseUp(button);
    expect(button).toHaveStyle({ opacity: "1" });
  });

  it("does not invoke onPress when disabled", () => {
    const onPress = vi.fn();
    render(
      <Pressable onPress={onPress} disabled testID="disabled-pressable">
        label
      </Pressable>,
    );

    fireEvent.click(screen.getByTestId("disabled-pressable"));
    expect(onPress).not.toHaveBeenCalled();
  });
});
