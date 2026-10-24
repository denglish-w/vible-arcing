import { describe, expect, it } from "vitest";
import { committedAttribution } from "./committed-attribution";

describe("committedAttribution", () => {
  it("holds the SBLGNT and MACULA notices for when the store is unavailable", () => {
    const names = committedAttribution().map((entry) => entry.name);
    expect(names).toContain("SBL Greek New Testament");
    expect(names).toContain("MACULA Greek Linguistic Datasets");
  });
});
