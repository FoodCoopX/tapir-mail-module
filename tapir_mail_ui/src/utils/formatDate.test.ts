import { formatDate } from "./formatDate";

describe("formatDate", () => {
  test("Format is correct", () => {
    expect(formatDate(new Date(2023, 3, 29, 15, 30, 22, 33))).toBe(
      "29.04.23, 15:30",
    );
  });
});
