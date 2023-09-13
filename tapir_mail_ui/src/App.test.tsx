import { render } from "@testing-library/react";
import App from "./App";
import React from "react";

test("Dummy test", () => {
  const { container } = render(<App />);
  expect(container.getElementsByClassName("App").length).toBe(1);
});
