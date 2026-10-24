// Turns docs/data/relationships.json into the TypeScript module
// src/lib/analysis/taxonomy.generated.ts (foundation design decision 4: types
// are generated from the JSON, never written by hand). Used by
// scripts/generate-taxonomy.ts and by the test that keeps the committed output
// current. Shared with scripts (see src/db/README.md).
import { format, resolveConfig } from "prettier";

/** Paths relative to the project root. */
export const TAXONOMY_JSON_PATH = "docs/data/relationships.json";
export const GENERATED_TAXONOMY_PATH = "src/lib/analysis/taxonomy.generated.ts";

const SHAPE_IDS = ["coordinate", "binary", "bilateral"] as const;
const SUPPORTERS = ["none", "chosen", "middle"] as const;
const TIERS = ["core", "extended"] as const;
const DIRECTIONS = ["follows", "precedes", "either"] as const;
const SIDES = ["before", "after"] as const;

type Json = Record<string, unknown>;

function fail(message: string): never {
  throw new Error(`relationships.json: ${message}`);
}

function record(value: unknown, where: string): Json {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    fail(`${where} must be an object`);
  return value as Json;
}

function list(value: unknown, where: string): Json[] {
  if (!Array.isArray(value) || value.length === 0)
    fail(`${where} must be a non-empty array`);
  return value.map((item, i) => record(item, `${where}[${i}]`));
}

function str(item: Json, key: string, where: string): string {
  const value = item[key];
  if (typeof value !== "string" || value.trim() === "")
    fail(`${where}.${key} must be a non-empty string`);
  return value;
}

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  where: string,
): T {
  if (!allowed.includes(value as T))
    fail(`${where} must be one of ${allowed.join(", ")}`);
  return value as T;
}

function uniqueIds(items: Json[], where: string): string[] {
  const ids = items.map((item, i) => str(item, "id", `${where}[${i}]`));
  const repeated = ids.find((id, i) => ids.indexOf(id) !== i);
  if (repeated) fail(`${where} repeats the id "${repeated}"`);
  return ids;
}

/** Checks the taxonomy's shape and cross-references, then returns it. */
export function checkTaxonomy(data: unknown) {
  const root = record(data, "the file");
  const source = str(root, "source", "the file");
  const credit = str(root, "credit", "the file");

  const shapes = list(root.shapes, "shapes");
  const shapeIds = uniqueIds(shapes, "shapes");
  shapes.forEach((shape, i) => {
    const where = `shapes[${i}]`;
    oneOf(shape.id, SHAPE_IDS, `${where}.id`);
    str(shape, "description", where);
    oneOf(shape.supporter, SUPPORTERS, `${where}.supporter`);
    const { minMembers: min, maxMembers: max } = shape;
    if (!Number.isInteger(min) || (min as number) < 2)
      fail(`${where}.minMembers must be an integer of at least 2`);
    if (
      max !== null &&
      (!Number.isInteger(max) || (max as number) < (min as number))
    )
      fail(
        `${where}.maxMembers must be null or an integer of at least minMembers`,
      );
  });
  if (shapeIds.length !== SHAPE_IDS.length)
    fail(`shapes must define each of ${SHAPE_IDS.join(", ")}`);

  const categories = list(root.categories, "categories");
  const categoryIds = uniqueIds(categories, "categories");
  categories.forEach((category, i) => {
    const where = `categories[${i}]`;
    str(category, "name", where);
    str(category, "description", where);
    if (typeof category.subordinate !== "boolean")
      fail(`${where}.subordinate must be true or false`);
  });

  const relationships = list(root.relationships, "relationships");
  const relationshipIds = uniqueIds(relationships, "relationships");
  relationships.forEach((rel, i) => {
    const where = `relationships[${i}] (${rel.id})`;
    for (const key of ["name", "relation", "definition"]) str(rel, key, where);
    const tier = oneOf(rel.tier, TIERS, `${where}.tier`);
    // Core relationships carry the published abbreviation. The extended ones
    // have none in the sources, so they show their full name until one is chosen.
    if (tier === "core") str(rel, "abbreviation", where);
    else if (rel.abbreviation !== null)
      fail(`${where}.abbreviation must be null for an extended relationship`);
    const shape = oneOf(rel.shape, shapeIds, `${where}.shape`);
    const category = categories[categoryIds.indexOf(rel.category as string)];
    if (!category) fail(`${where}.category is not a known category`);
    const subordinate = category.subordinate === true;
    if (subordinate !== (shape !== "coordinate"))
      fail(
        `${where}: only coordinate-category relationships use the coordinate shape`,
      );
    if (subordinate) oneOf(rel.direction, DIRECTIONS, `${where}.direction`);
    else if (rel.direction !== null)
      fail(`${where}.direction must be null for a coordinate relationship`);
    if (rel.equivalentTo !== undefined) {
      list(rel.equivalentTo, `${where}.equivalentTo`).forEach((part, j) => {
        oneOf(
          part.relationship,
          relationshipIds,
          `${where}.equivalentTo[${j}].relationship`,
        );
        oneOf(part.toward, SIDES, `${where}.equivalentTo[${j}].toward`);
      });
    }
  });

  // One relation may carry several relationships only when each has its own direction.
  const byRelation = Map.groupBy(
    relationships,
    (rel) => rel.relation as string,
  );
  for (const [relation, members] of byRelation) {
    const directions = members.map((rel) => rel.direction);
    if (new Set(directions).size !== directions.length)
      fail(
        `relation "${relation}" has two relationships with the same direction`,
      );
    // A fixed direction must have its reverse, so inversion always has a target.
    for (const direction of directions) {
      const opposite = { follows: "precedes", precedes: "follows" }[
        direction as string
      ];
      if (opposite && !directions.includes(opposite))
        fail(`relation "${relation}" has "${direction}" but not "${opposite}"`);
    }
  }

  return { source, credit, shapes, categories, relationships };
}

const union = (values: readonly string[]) =>
  values.map((value) => JSON.stringify(value)).join(" | ") || "never";

/** The source text of taxonomy.generated.ts, before formatting. */
export function renderTaxonomyModule(data: unknown): string {
  const { source, credit, shapes, categories, relationships } =
    checkTaxonomy(data);
  const idsWhere = (shape: string) =>
    relationships
      .filter((rel) => rel.shape === shape)
      .map((rel) => rel.id as string);
  const strip = (items: Json[], keys: string[]) =>
    items.map((item) =>
      Object.fromEntries(
        keys.filter((k) => k in item).map((k) => [k, item[k]]),
      ),
    );

  return `// Generated from docs/data/relationships.json by scripts/generate-taxonomy.ts.
// Do not edit: change the JSON and run \`npm run taxonomy:generate\`.

export type ShapeId = ${union(SHAPE_IDS)};
export type CategoryId = ${union(categories.map((c) => c.id as string))};
export type RelationshipId = ${union(relationships.map((r) => r.id as string))};
/** Relationships whose members are all equal. */
export type CoordinateRelationshipId = ${union(idsWhere("coordinate"))};
/** Relationships with one supporting and one supported member. */
export type BinaryRelationshipId = ${union(idsWhere("binary"))};
/** Relationships with a supported member on each side of the supporter. */
export type BilateralRelationshipId = ${union(idsWhere("bilateral"))};
export type Tier = ${union(TIERS)};
/** Where the supporting member sits relative to the supported member. */
export type Direction = ${union(DIRECTIONS)};

export type Shape = {
  id: ShapeId;
  description: string;
  minMembers: number;
  /** \`null\`: no upper limit. */
  maxMembers: number | null;
  /** none: no member supports another; chosen: the connection names the supporter; middle: the middle member supports. */
  supporter: ${union(SUPPORTERS)};
};

export type Category = {
  id: CategoryId;
  name: string;
  subordinate: boolean;
  description: string;
};

export type Relationship = {
  id: RelationshipId;
  name: string;
  /** \`null\` for extended relationships, which have no published abbreviation. */
  abbreviation: string | null;
  category: CategoryId;
  tier: Tier;
  shape: ShapeId;
  /** Relationships sharing a relation differ only in direction (Ground and Inference). */
  relation: string;
  /** \`null\` for coordinate relationships, which have no supporting member. */
  direction: Direction | null;
  /** What this relationship amounts to in other relationships (Bilateral). */
  equivalentTo?: readonly { relationship: RelationshipId; toward: ${union(SIDES)} }[];
  definition: string;
};

export const TAXONOMY_SOURCE = ${JSON.stringify(source)};
export const TAXONOMY_CREDIT = ${JSON.stringify(credit)};

export const SHAPES: readonly Shape[] = ${JSON.stringify(strip(shapes, ["id", "description", "minMembers", "maxMembers", "supporter"]))};

export const CATEGORIES: readonly Category[] = ${JSON.stringify(strip(categories, ["id", "name", "subordinate", "description"]))};

export const RELATIONSHIPS: readonly Relationship[] = ${JSON.stringify(strip(relationships, ["id", "name", "abbreviation", "category", "tier", "shape", "relation", "direction", "equivalentTo", "definition"]))};
`;
}

/** The formatted module, exactly as it is committed at `outputPath`. */
export async function generateTaxonomyModule(
  data: unknown,
  outputPath: string,
): Promise<string> {
  const options = (await resolveConfig(outputPath)) ?? {};
  return format(renderTaxonomyModule(data), {
    ...options,
    filepath: outputPath,
  });
}
