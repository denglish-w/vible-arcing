// Lookups over the relationship taxonomy (relationship-taxonomy spec). The data
// and its types are generated from docs/data/relationships.json; nothing here
// restates it. Shared with scripts (see src/db/README.md).
import {
  CATEGORIES,
  RELATIONSHIPS,
  SHAPES,
  type Category,
  type Relationship,
  type RelationshipId,
  type Shape,
} from "./taxonomy.generated.ts";

export * from "./taxonomy.generated.ts";

const byId = new Map(RELATIONSHIPS.map((rel) => [rel.id, rel]));
const shapeById = new Map(SHAPES.map((shape) => [shape.id, shape]));

export function isRelationshipId(value: unknown): value is RelationshipId {
  return typeof value === "string" && byId.has(value as RelationshipId);
}

export function getRelationship(id: RelationshipId): Relationship {
  return byId.get(id)!;
}

export function shapeOf(id: RelationshipId): Shape {
  return shapeById.get(getRelationship(id).shape)!;
}

/**
 * The relationships a user may choose from, grouped under their categories in
 * taxonomy order. Extended relationships are left out unless asked for.
 */
export function relationshipChoices({
  includeExtended = false,
}: { includeExtended?: boolean } = {}): {
  category: Category;
  relationships: Relationship[];
}[] {
  return CATEGORIES.map((category) => ({
    category,
    relationships: RELATIONSHIPS.filter(
      (rel) =>
        rel.category === category.id &&
        (includeExtended || rel.tier === "core"),
    ),
  })).filter((group) => group.relationships.length > 0);
}

export type Inversion =
  | { ok: true; relationship: RelationshipId }
  | { ok: false; reason: "coordinate" | "bilateral"; message: string };

/**
 * The relationship a connection takes when its direction of support is
 * reversed: the relationship with the same relation and the opposite direction
 * (Ground and Inference), or the same one if its direction is `either`.
 */
export function invertedRelationship(id: RelationshipId): Inversion {
  const rel = getRelationship(id);
  if (rel.direction === null)
    return {
      ok: false,
      reason: "coordinate",
      message: `${rel.name} is a coordinate relationship, so it has no direction of support to reverse.`,
    };
  if (shapeOf(id).supporter === "middle")
    return {
      ok: false,
      reason: "bilateral",
      message: `${rel.name} supports members on both sides, so it has no single direction to reverse.`,
    };
  if (rel.direction === "either") return { ok: true, relationship: id };
  const opposite = rel.direction === "follows" ? "precedes" : "follows";
  const partner = RELATIONSHIPS.find(
    (other) => other.relation === rel.relation && other.direction === opposite,
  );
  // The data check in taxonomy-codegen.ts guarantees the partner exists.
  return { ok: true, relationship: partner!.id };
}
