// The discourse analysis model (proposition-model spec; foundation design
// decisions 1–3 and 6). One model that both the arc and the bracket renderings
// read: an ordered list of propositions over the passage's words, plus a forest
// of connections, each covering a contiguous run of propositions.
//
// This is the `doc` stored for an analysis at document version 1 (see
// src/db/work.ts). Structural rules are checked by ./validate.ts.
// Shared with scripts (see src/db/README.md).
import {
  invertedRelationship,
  type BilateralRelationshipId,
  type BinaryRelationshipId,
  type CoordinateRelationshipId,
  type Inversion,
} from "./taxonomy.ts";

/** The document version of an analysis stored in this shape. */
export const ANALYSIS_DOC_VERSION = 1;

/** A MACULA word id, such as "n50001003001". Never a position. */
export type WordId = string;

/**
 * A contiguous span of the passage, from `first` to `last` inclusive. Its text
 * is the corpus text of those words, so it is always verbatim.
 */
export type Proposition = { id: string; first: WordId; last: WordId };

/** Equal members, in passage order; none supports another. */
export type CoordinateConnection = {
  id: string;
  relationship: CoordinateRelationshipId;
  members: string[];
};

/** Two members in passage order; `supporter` is the index of the supporting one. */
export type BinaryConnection = {
  id: string;
  relationship: BinaryRelationshipId;
  members: [string, string];
  supporter: 0 | 1;
};

/**
 * One node with three members in passage order: the supported member before,
 * the supporter, the supported member after (design decision 2). It is a single
 * connection, so the structure stays a tree.
 */
export type BilateralConnection = {
  id: string;
  relationship: BilateralRelationshipId;
  members: [string, string, string];
};

/** Members are ids of propositions or other connections. */
export type Connection =
  CoordinateConnection | BinaryConnection | BilateralConnection;

export type Analysis = {
  /** The passage's words in reading order. Not every word needs a proposition. */
  words: WordId[];
  propositions: Proposition[];
  connections: Connection[];
};

/** A new analysis: the passage with no propositions or connections. */
export function emptyAnalysis(words: readonly WordId[]): Analysis {
  return { words: [...words], propositions: [], connections: [] };
}

/**
 * Every word id an analysis document refers to, or `null` if `doc` does not
 * have the analysis shape. Supplied to src/db/work.ts so storage can check the
 * ids and derive the passage without knowing this model.
 */
export function analysisWordIds(doc: unknown): readonly WordId[] | null {
  const words = (doc as { words?: unknown } | null)?.words;
  return Array.isArray(words) && words.every((id) => typeof id === "string")
    ? words
    : null;
}

/**
 * Reverses a subordinate connection's direction of support, keeping the
 * connection and its members: Ground becomes Inference and the reverse
 * (relationship-taxonomy spec, "Relationship directionality").
 */
export function invertConnection(
  connection: Connection,
): { ok: true; connection: Connection } | Extract<Inversion, { ok: false }> {
  const inversion = invertedRelationship(connection.relationship);
  if (!inversion.ok) return inversion;
  // Only binary connections have a direction that can be reversed.
  const binary = connection as BinaryConnection;
  return {
    ok: true,
    connection: {
      ...binary,
      relationship: inversion.relationship as BinaryRelationshipId,
      supporter: binary.supporter === 0 ? 1 : 0,
    },
  };
}
