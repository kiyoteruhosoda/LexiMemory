import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { RnwTextField } from "../../rnw/components/RnwTextField";

function Harness() {
  const [value, setValue] = useState("");

  return (
    <RnwTextField
      label="Username"
      value={value}
      onChange={setValue}
      placeholder="Input"
      testID="rnw-text-field"
    />
  );
}

describe("RnwTextField", () => {
  it("renders label and input", () => {
    render(<Harness />);
    expect(screen.getByText("Username")).toBeInTheDocument();
    expect(screen.getByTestId("rnw-text-field")).toBeInTheDocument();
  });

  it("updates value on input", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = screen.getByTestId("rnw-text-field");
    await user.type(input, "alice");

    expect(input).toHaveValue("alice");
  });
  it("keeps input height to a single row", () => {
    render(<Harness />);

    const input = screen.getByTestId("rnw-text-field");
    expect(input).toHaveStyle({ height: "40px" });
  });

});
