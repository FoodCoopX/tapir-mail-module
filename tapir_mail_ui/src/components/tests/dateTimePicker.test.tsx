import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import DateTimePicker from "../dateTimePicker";

describe("DateTimePicker", () => {
  test("Initial value gets set", () => {
    const initialValue = new Date(2022, 2, 13, 15, 35);
    render(
      <DateTimePicker
        onChange={() => {}}
        initialValue={initialValue}
      />,
    );

    const input: HTMLInputElement = document.getElementsByTagName("input")[0];
    expect(input).toHaveValue("13.03.2022 15:35");
  });

  test.skip("When the value changes, the callback is called with the new value", async () => {
    // Skipped because of an error with matchMedia not being defined, I couldn't find a good solution.
    let onChange = jest.fn();
    render(
      <DateTimePicker
        onChange={onChange}
        initialValue={new Date()}
      />,
    );
    const input: HTMLInputElement = document.getElementsByTagName("input")[0];

    await userEvent.clear(input);
    await userEvent.type(input, "13.03.2022 15:35{enter}");
    expect(input).toHaveValue("13.03.2022 15:35");
    expect(onChange).toHaveBeenCalledTimes(2); // once when setting the initial value, once on change
    expect(onChange).toHaveBeenCalledWith("13.03.2022 15:35");
  });
});
