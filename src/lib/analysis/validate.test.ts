import { describe, expect, it } from "vitest";
import { INVALID, VALID, WORDS } from "./fixtures.ts";
import {
  analysisWordIds,
  emptyAnalysis,
  invertConnection,
  type Analysis,
} from "./model.ts";
import { analysisStatus, validateAnalysis } from "./validate.ts";

const codesOf = (doc: unknown) => {
  const result = validateAnalysis(doc);
  return result.ok ? [] : [...new Set(result.errors.map((e) => e.code))].sort();
};

describe("valid analyses", () => {
  it.each(Object.entries(VALID))("%s is accepted", (_name, doc) => {
    expect(validateAnalysis(doc)).toEqual({ ok: true, analysis: doc });
  });

  it("survive a JSON round trip unchanged", () => {
    for (const doc of Object.values(VALID)) {
      const copy = JSON.parse(JSON.stringify(doc));
      expect(copy).toEqual(doc);
      expect(validateAnalysis(copy).ok).toBe(true);
    }
  });
});

describe("invalid analyses", () => {
  it.each(Object.entries(INVALID))(
    "%s is refused with the expected errors",
    (_name, { doc, codes }) => {
      expect(codesOf(doc)).toEqual(codes);
    },
  );

  it("report errors as sentences naming the nodes involved", () => {
    const result = validateAnalysis(INVALID["Ground over three members"].doc);
    expect(result).toEqual({
      ok: false,
      errors: [
        {
          code: "arity",
          message:
            "Ground relates one supporting member to one supported member.",
          ids: ["c1"],
        },
      ],
    });
  });

  it("explain how to support members on both sides", () => {
    const result = validateAnalysis(
      INVALID["one proposition supporting two members before it"].doc,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    const shared = result.errors.find((e) => e.code === "shared-member");
    expect(shared?.ids).toEqual(["p3", "c1", "c2"]);
    expect(shared?.message).toMatch(/Bilateral/);
  });
});

describe("analysisStatus", () => {
  it("reports a single outermost connection over every proposition as complete", () => {
    const doc = VALID["nested to three levels and complete"];
    expect(analysisStatus(doc)).toEqual({
      complete: true,
      roots: ["i"],
      unconnected: [],
    });
  });

  it("reports unconnected propositions and several roots as incomplete", () => {
    expect(analysisStatus(VALID.Ground)).toEqual({
      complete: false,
      roots: ["p3", "p4", "c1"],
      unconnected: ["p3", "p4"],
    });
  });

  it("reports a single proposition as complete", () => {
    const doc = {
      ...emptyAnalysis(WORDS),
      propositions: [{ id: "p1", first: WORDS[0], last: WORDS[2] }],
    };
    expect(validateAnalysis(doc).ok).toBe(true);
    expect(analysisStatus(doc)).toEqual({
      complete: true,
      roots: ["p1"],
      unconnected: ["p1"],
    });
  });

  it("treats an analysis with no propositions as incomplete", () => {
    expect(analysisStatus(emptyAnalysis(WORDS)).complete).toBe(false);
  });
});

describe("analysisWordIds", () => {
  it("returns the passage words, or null for anything else", () => {
    expect(analysisWordIds(VALID.Bilateral)).toEqual(WORDS);
    expect(analysisWordIds({ words: [1, 2] })).toBeNull();
    expect(analysisWordIds(null)).toBeNull();
  });
});

describe("invertConnection", () => {
  const only = (doc: Analysis) => doc.connections[0];

  it("turns a Ground into an Inference over the same members", () => {
    const result = invertConnection(only(VALID.Ground));
    expect(result).toEqual({
      ok: true,
      connection: {
        id: "c1",
        relationship: "inference",
        members: ["p1", "p2"],
        supporter: 0,
      },
    });
    if (!result.ok) return;
    const inverted = { ...VALID.Ground, connections: [result.connection] };
    expect(validateAnalysis(inverted).ok).toBe(true);
  });

  it("turns an Inference back into a Ground", () => {
    const result = invertConnection(only(VALID.Inference));
    expect(result.ok && result.connection).toMatchObject({
      relationship: "ground",
      supporter: 1,
    });
  });

  it("keeps the label of a relationship that allows either direction", () => {
    const result = invertConnection(
      only(VALID["Action-Purpose with the supporter first"]),
    );
    expect(result.ok && result.connection).toMatchObject({
      relationship: "action-purpose",
      supporter: 1,
    });
  });

  it("refuses coordinate and Bilateral connections", () => {
    expect(
      invertConnection(only(VALID["Series over four propositions"])),
    ).toMatchObject({
      ok: false,
      reason: "coordinate",
      message: expect.stringMatching(/no direction of support/),
    });
    expect(invertConnection(only(VALID.Bilateral))).toMatchObject({
      ok: false,
      reason: "bilateral",
    });
  });
});
