import { describe, expect, it } from "vitest";
import { finalise, toGreek } from "./translit.ts";

describe("toGreek", () => {
  it("maps each Beta Code letter", () => {
    expect(toGreek("abgdezhqiklmncoprstufxyw")).toBe(
      "αβγδεζηθικλμνξοπρστυφχψω",
    );
  });

  it("maps capitals to capitals", () => {
    expect(toGreek("ABGDEZHQIKLMNCOPRSTUFXYW")).toBe(
      "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ",
    );
  });

  it("converts a whole word", () => {
    expect(toGreek("euxaristew")).toBe("ευχαριστεω");
  });

  it("uses final sigma before a space", () => {
    expect(toGreek("logos ")).toBe("λογος ");
  });

  it("keeps medial sigma while typing", () => {
    expect(toGreek("logos")).toBe("λογοσ");
  });

  it("passes Greek, digits and punctuation through", () => {
    expect(toGreek("εὐχαριστῶ")).toBe("εὐχαριστῶ");
    expect(toGreek("12,.;")).toBe("12,.;");
  });
});

describe("finalise", () => {
  it("turns a trailing sigma into final sigma", () => {
    expect(finalise("logos")).toBe("λογος");
    expect(finalise("λογοσ")).toBe("λογος");
  });
});
