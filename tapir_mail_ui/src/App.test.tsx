import { render, screen } from "@testing-library/react";
import App from "./App";
import React from "react";

describe("App", () => {
  test("Dummy test", async () => {
    render(<App />);
    await screen.findByTestId("App");
    expect(screen.getByTestId("App")).toBeInTheDocument();
  });
});
