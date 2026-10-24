import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  GENERATED_TAXONOMY_PATH,
  TAXONOMY_JSON_PATH,
  checkTaxonomy,
  generateTaxonomyModule,
} from "./taxonomy-codegen.ts";
import {
  CATEGORIES,
  RELATIONSHIPS,
  getRelationship,
  invertedRelationship,
  relationshipChoices,
} from "./taxonomy.ts";

const root = path.resolve(import.meta.dirname, "../../..");
const readJson = (file: string) =>
  JSON.parse(readFileSync(path.join(root, file), "utf8"));

const core = RELATIONSHIPS.filter((rel) => rel.tier === "core");

describe("the generated module", () => {
  it("matches docs/data/relationships.json (run `npm run taxonomy:generate`)", async () => {
    const output = path.join(root, GENERATED_TAXONOMY_PATH);
    expect(readFileSync(output, "utf8")).toBe(
      await generateTaxonomyModule(readJson(TAXONOMY_JSON_PATH), output),
    );
  });

  it("refuses data that breaks the taxonomy's own rules", () => {
    const data = readJson(TAXONOMY_JSON_PATH);
    const groundAlone = structuredClone(data);
    groundAlone.relationships.find(
      (rel: { id: string }) => rel.id === "inference",
    ).direction = "either";
    expect(() => checkTaxonomy(groundAlone)).toThrow(
      /"follows" but not "precedes"/,
    );
    const coordinateWithDirection = structuredClone(data);
    coordinateWithDirection.relationships[0].direction = "follows";
    expect(() => checkTaxonomy(coordinateWithDirection)).toThrow(
      /must be null/,
    );
    const unknownCategory = structuredClone(data);
    unknownCategory.relationships[3].category = "elsewhere";
    expect(() => checkTaxonomy(unknownCategory)).toThrow(/known category/);
  });
});

describe("relationship set", () => {
  it("has the 18 core relationships and 4 extended ones", () => {
    expect(core.map((rel) => rel.name)).toEqual([
      "Series",
      "Progression",
      "Alternative",
      "Action-Manner",
      "Comparison",
      "Negative-Positive",
      "Idea-Explanation",
      "Question-Answer",
      "Ground",
      "Inference",
      "Bilateral",
      "Action-Result",
      "Action-Purpose",
      "Conditional",
      "Temporal",
      "Locative",
      "Concessive",
      "Situation-Response",
    ]);
    expect(
      RELATIONSHIPS.filter((rel) => rel.tier === "extended").map(
        (rel) => rel.name,
      ),
    ).toEqual([
      "Both-And",
      "General-Specific",
      "Fact-Interpretation",
      "Anticipation-Fulfillment",
    ]);
  });

  it("gives every relationship a unique id, name and abbreviation, and a definition", () => {
    for (const key of ["id", "name"] as const)
      expect(new Set(RELATIONSHIPS.map((rel) => rel[key])).size).toBe(22);
    for (const rel of RELATIONSHIPS) expect(rel.definition).not.toBe("");
    const core = RELATIONSHIPS.filter((rel) => rel.tier === "core");
    expect(new Set(core.map((rel) => rel.abbreviation)).size).toBe(18);
    expect(core.every((rel) => typeof rel.abbreviation === "string")).toBe(
      true,
    );
  });

  it("gives extended relationships no abbreviation", () => {
    const extended = RELATIONSHIPS.filter((rel) => rel.tier === "extended");
    expect(extended).toHaveLength(4);
    expect(extended.every((rel) => rel.abbreviation === null)).toBe(true);
  });

  it("puts the core relationships in categories of 3, 5, 8 and 2", () => {
    const counts = Object.fromEntries(
      CATEGORIES.map((c) => [
        c.name,
        core.filter((rel) => rel.category === c.id).length,
      ]),
    );
    expect(counts).toEqual({
      Coordinate: 3,
      "Support by Restatement": 5,
      "Support by Distinct Statement": 8,
      "Support by Contrary Statement": 2,
    });
  });

  it("splits the core into 3 coordinate and 15 subordinate relationships", () => {
    const subordinate = new Set(
      CATEGORIES.filter((c) => c.subordinate).map((c) => c.id),
    );
    expect(core.filter((rel) => subordinate.has(rel.category))).toHaveLength(
      15,
    );
    expect(core.filter((rel) => rel.direction === null)).toHaveLength(3);
  });
});

describe("directionality", () => {
  it("has Ground follow and Inference precede, as one relation", () => {
    const ground = getRelationship("ground");
    const inference = getRelationship("inference");
    expect([ground.direction, inference.direction]).toEqual([
      "follows",
      "precedes",
    ]);
    expect(ground.relation).toBe(inference.relation);
  });

  it("inverts Ground and Inference into each other", () => {
    expect(invertedRelationship("ground")).toEqual({
      ok: true,
      relationship: "inference",
    });
    expect(invertedRelationship("inference")).toEqual({
      ok: true,
      relationship: "ground",
    });
  });

  it.each(["series", "progression", "alternative"] as const)(
    "refuses to invert %s",
    (id) => {
      expect(invertedRelationship(id)).toMatchObject({
        ok: false,
        reason: "coordinate",
      });
    },
  );

  it("records Bilateral as a Ground toward the member before and an Inference toward the one after", () => {
    expect(getRelationship("bilateral")).toMatchObject({
      category: "distinct",
      shape: "bilateral",
      equivalentTo: [
        { relationship: "ground", toward: "before" },
        { relationship: "inference", toward: "after" },
      ],
    });
  });
});

describe("relationshipChoices", () => {
  const names = (groups: ReturnType<typeof relationshipChoices>) =>
    groups.flatMap((group) => group.relationships.map((rel) => rel.name));

  it("offers the 18 core relationships by default, grouped by category", () => {
    const groups = relationshipChoices();
    expect(groups.map((group) => group.category.name)).toEqual([
      "Coordinate",
      "Support by Restatement",
      "Support by Distinct Statement",
      "Support by Contrary Statement",
    ]);
    expect(names(groups)).toHaveLength(18);
    expect(
      groups[2].relationships.map((rel) => rel.name).includes("Bilateral"),
    ).toBe(true);
  });

  it("offers all 22 when extended relationships are turned on", () => {
    expect(names(relationshipChoices({ includeExtended: true }))).toHaveLength(
      22,
    );
  });
});

describe("conjunction cue data", () => {
  it("only names relationships in the taxonomy, by abbreviation", () => {
    const cues = readJson("docs/data/greek-conjunctions.json") as {
      conjunctions: { relationships: { rel: string }[] }[];
    };
    const abbreviations = new Set(RELATIONSHIPS.map((rel) => rel.abbreviation));
    const unknown = cues.conjunctions
      .flatMap((c) => c.relationships.map((r) => r.rel))
      .filter((rel) => !abbreviations.has(rel));
    expect(unknown).toEqual([]);
  });
});
