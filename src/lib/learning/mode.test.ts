import { describe, expect, it } from "vitest";
import { parseMode } from "./mode.ts";

describe("parseMode", () => {
  it.each([undefined, "", "LEARNING", "reading", "other"])(
    "reads %j as Reading",
    (value) => {
      expect(parseMode(value)).toBe("reading");
    },
  );

  it("reads learning", () => {
    expect(parseMode("learning")).toBe("learning");
  });
});
