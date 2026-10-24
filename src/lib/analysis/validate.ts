// The one structural validator for discourse analyses (foundation design
// decision 7). The editor runs it on every edit, and the server runs it before
// storing an analysis, so both refuse exactly the same structures. Pure
// TypeScript with no browser or Node dependency.
//
// Rules that depend on a relationship (how many members, whether a member
// supports, on which side) come from the taxonomy data, not from branches here.
// Shared with scripts (see src/db/README.md).
import type { Analysis, Connection, Proposition } from "./model.ts";
import {
  getRelationship,
  isRelationshipId,
  shapeOf,
  type RelationshipId,
} from "./taxonomy.ts";

export type ValidationErrorCode =
  /** The document does not have the analysis shape. */
  | "malformed"
  /** Two propositions or connections share an id. */
  | "duplicate-id"
  /** A word appears twice in the passage. */
  | "duplicate-word"
  /** A proposition starts or ends on a word that is not in the passage. */
  | "unknown-word"
  /** A proposition ends before it starts. */
  | "proposition-span"
  /** Propositions overlap or are out of passage order. */
  | "proposition-order"
  /** A connection has no relationship. */
  | "missing-relationship"
  /** A connection names a relationship the taxonomy does not have. */
  | "unknown-relationship"
  /** A connection refers to a proposition or connection that does not exist. */
  | "unknown-member"
  /** A connection has too few or too many members for its relationship. */
  | "arity"
  /** The supporting member is missing, out of range, or given where none supports. */
  | "supporter"
  /** The supporter is on the wrong side for the relationship (Ground, Inference). */
  | "direction"
  /** A connection contains itself, directly or through other connections. */
  | "cycle"
  /** A proposition or connection is a member of more than one connection. */
  | "shared-member"
  /** A connection's members are out of order or leave a gap. */
  | "non-contiguous"
  /** A Bilateral connection lacks a supported member on one side of its supporter. */
  | "bilateral-sides";

export type ValidationError = {
  code: ValidationErrorCode;
  /** A sentence that can be shown to the user. */
  message: string;
  /** The propositions and connections involved, if any. */
  ids: readonly string[];
};

export type ValidationResult =
  { ok: true; analysis: Analysis } | { ok: false; errors: ValidationError[] };

type Span = { start: number; end: number };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isId = (value: unknown): value is string =>
  typeof value === "string" && value !== "";

/** Checks only that `doc` has the analysis shape, collecting what is wrong. */
function parseShape(doc: unknown, errors: ValidationError[]): boolean {
  const malformed = (message: string) =>
    errors.push({ code: "malformed", message, ids: [] });
  if (!isObject(doc)) {
    malformed("The document is not an analysis.");
    return false;
  }
  const { words, propositions, connections } = doc;
  if (!Array.isArray(words) || !words.every(isId))
    malformed("The passage words must be a list of word ids.");
  if (!Array.isArray(propositions))
    malformed("The propositions must be a list.");
  else
    propositions.forEach((p, i) => {
      if (!isObject(p) || !isId(p.id) || !isId(p.first) || !isId(p.last))
        malformed(
          `Proposition ${i + 1} must have an id and first and last word ids.`,
        );
    });
  if (!Array.isArray(connections)) malformed("The connections must be a list.");
  else
    connections.forEach((c, i) => {
      if (
        !isObject(c) ||
        !isId(c.id) ||
        !Array.isArray(c.members) ||
        !c.members.every(isId) ||
        !(c.relationship === undefined || typeof c.relationship === "string")
      )
        malformed(`Connection ${i + 1} must have an id and a list of members.`);
    });
  return errors.length === 0;
}

function checkWordsAndPropositions(
  analysis: Analysis,
  errors: ValidationError[],
): Map<string, number> {
  const wordIndex = new Map<string, number>();
  analysis.words.forEach((word, i) => {
    if (wordIndex.has(word))
      errors.push({
        code: "duplicate-word",
        message: `The word ${word} appears twice in the passage.`,
        ids: [],
      });
    else wordIndex.set(word, i);
  });

  const propositionIndex = new Map<string, number>();
  let previous: { id: string; end: number } | null = null;
  analysis.propositions.forEach((p, i) => {
    propositionIndex.set(p.id, i);
    const start = wordIndex.get(p.first);
    const end = wordIndex.get(p.last);
    if (start === undefined || end === undefined) {
      errors.push({
        code: "unknown-word",
        message: `A proposition starts or ends on a word that is not in the passage.`,
        ids: [p.id],
      });
      return;
    }
    if (end < start) {
      errors.push({
        code: "proposition-span",
        message: "A proposition ends before it starts.",
        ids: [p.id],
      });
      return;
    }
    if (previous && start <= previous.end)
      errors.push({
        code: "proposition-order",
        message:
          "Propositions must follow the order of the text and must not overlap.",
        ids: [previous.id, p.id],
      });
    previous = { id: p.id, end };
  });
  return propositionIndex;
}

/** Arity, supporter and direction, all read from the taxonomy. */
function checkRelationship(
  connection: Connection,
  errors: ValidationError[],
): void {
  const raw = connection.relationship as unknown;
  if (raw === undefined || raw === "") {
    errors.push({
      code: "missing-relationship",
      message: "Choose a relationship for this connection.",
      ids: [connection.id],
    });
    return;
  }
  if (!isRelationshipId(raw)) {
    errors.push({
      code: "unknown-relationship",
      message: `"${String(raw)}" is not a known relationship.`,
      ids: [connection.id],
    });
    return;
  }
  const rel = getRelationship(raw as RelationshipId);
  const shape = shapeOf(rel.id);
  const count = connection.members.length;
  const supporter = (connection as { supporter?: unknown }).supporter;

  if (
    count < shape.minMembers ||
    (shape.maxMembers !== null && count > shape.maxMembers)
  ) {
    const message =
      shape.supporter === "none"
        ? `${rel.name} relates two or more equal members.`
        : shape.supporter === "middle"
          ? `${rel.name} relates one supporting member to one supported member before it and one after it.`
          : `${rel.name} relates one supporting member to one supported member.`;
    errors.push({ code: "arity", message, ids: [connection.id] });
    return;
  }

  if (shape.supporter !== "chosen") {
    if (supporter !== undefined)
      errors.push({
        code: "supporter",
        message:
          shape.supporter === "none"
            ? `In ${rel.name} no member supports another.`
            : `In ${rel.name} the middle member is always the supporter.`,
        ids: [connection.id],
      });
    return;
  }

  if (
    typeof supporter !== "number" ||
    !Number.isInteger(supporter) ||
    supporter < 0 ||
    supporter >= count
  ) {
    errors.push({
      code: "supporter",
      message: `Mark which member of the ${rel.name} connection is the supporting one.`,
      ids: [connection.id],
    });
    return;
  }
  // follows: the supporter comes after what it supports; precedes: before it.
  const expected =
    rel.direction === "follows"
      ? count - 1
      : rel.direction === "precedes"
        ? 0
        : null;
  if (expected !== null && supporter !== expected)
    errors.push({
      code: "direction",
      message:
        rel.direction === "follows"
          ? `In ${rel.name} the supporting member comes after the member it supports.`
          : `In ${rel.name} the supporting member comes before the member it supports.`,
      ids: [connection.id],
    });
}

/**
 * Checks every structural rule of the proposition-model spec: well-formed
 * propositions in text order, labelled connections with the right number of
 * members for their relationship, a supporter on the side the relationship
 * requires, each node in at most one connection (containment), no cycles,
 * members that cover a contiguous run of propositions in order, and Bilateral's
 * one supported member on each side.
 *
 * An incomplete analysis (propositions not yet connected) is valid; see
 * `analysisStatus` for completeness.
 */
export function validateAnalysis(doc: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  if (!parseShape(doc, errors)) return { ok: false, errors };
  const analysis = doc as Analysis;

  const ids = new Set<string>();
  for (const node of [...analysis.propositions, ...analysis.connections]) {
    if (ids.has(node.id))
      errors.push({
        code: "duplicate-id",
        message: `The id "${node.id}" is used more than once.`,
        ids: [node.id],
      });
    ids.add(node.id);
  }
  // With repeated ids, members cannot be resolved.
  if (errors.length > 0) return { ok: false, errors };

  const propositionIndex = checkWordsAndPropositions(analysis, errors);
  const connections = new Map(analysis.connections.map((c) => [c.id, c]));

  // Containment: every node belongs to at most one connection, once.
  const parentOf = new Map<string, string>();
  for (const connection of analysis.connections) {
    checkRelationship(connection, errors);
    for (const member of connection.members) {
      if (member === connection.id) continue; // reported as a cycle below
      if (!propositionIndex.has(member) && !connections.has(member)) {
        errors.push({
          code: "unknown-member",
          message: `"${member}" is not a proposition or connection in this analysis.`,
          ids: [connection.id],
        });
        continue;
      }
      const parent = parentOf.get(member);
      if (parent !== undefined)
        errors.push({
          code: "shared-member",
          message:
            "A proposition or group can belong to only one connection. To support members on both sides, use Bilateral.",
          ids: [member, parent, connection.id],
        });
      else parentOf.set(member, connection.id);
    }
  }

  // Cycles: walk each connection's members depth first.
  const state = new Map<string, "visiting" | "done">();
  const cyclic = new Set<string>();
  const visit = (id: string, path: string[]): void => {
    if (state.get(id) === "done") return;
    if (state.get(id) === "visiting") {
      const loop = path.slice(path.indexOf(id));
      loop.forEach((node) => cyclic.add(node));
      errors.push({
        code: "cycle",
        message: "A connection cannot contain itself.",
        ids: loop,
      });
      return;
    }
    state.set(id, "visiting");
    for (const member of connections.get(id)!.members)
      if (connections.has(member)) visit(member, [...path, id]);
    state.set(id, "done");
  };
  for (const id of connections.keys()) visit(id, []);

  // Contiguity: each connection's members, in order, must cover adjacent runs
  // of propositions. Spans are proposition indices.
  const spans = new Map<string, Span | null>();
  const spanOf = (id: string): Span | null => {
    const index = propositionIndex.get(id);
    if (index !== undefined) return { start: index, end: index };
    if (spans.has(id)) return spans.get(id)!;
    const connection = connections.get(id);
    if (!connection || cyclic.has(id)) return null;
    spans.set(id, null);
    const parts = connection.members.map(spanOf);
    if (parts.some((part) => part === null)) return null;
    const ordered = parts as Span[];
    const adjacent = ordered.every(
      (part, i) => i === 0 || part.start === ordered[i - 1].end + 1,
    );
    if (!adjacent) {
      const bilateral =
        isRelationshipId(connection.relationship) &&
        shapeOf(connection.relationship).supporter === "middle" &&
        connection.members.length === 3;
      errors.push(
        bilateral
          ? {
              code: "bilateral-sides",
              message: `${getRelationship(connection.relationship).name} needs one supported member directly before its supporter and one directly after it.`,
              ids: [connection.id],
            }
          : {
              code: "non-contiguous",
              message:
                "A connection's members must be next to each other, in the order of the text.",
              ids: [connection.id],
            },
      );
    }
    const span = {
      start: Math.min(...ordered.map((part) => part.start)),
      end: Math.max(...ordered.map((part) => part.end)),
    };
    spans.set(id, span);
    return span;
  };
  for (const id of connections.keys()) spanOf(id);

  return errors.length === 0 ? { ok: true, analysis } : { ok: false, errors };
}

export type AnalysisStatus = {
  /** True when one outermost connection reaches every proposition. */
  complete: boolean;
  /** Propositions and connections not inside any connection, in no set order. */
  roots: string[];
  /** Propositions not in any connection. */
  unconnected: string[];
};

/**
 * Whether a valid analysis is complete (proposition-model spec, "Analysis
 * validity"). Incomplete analyses can still be saved and rendered.
 */
export function analysisStatus(analysis: Analysis): AnalysisStatus {
  const contained = new Set(analysis.connections.flatMap((c) => c.members));
  const roots = [...analysis.propositions, ...analysis.connections]
    .map((node) => node.id)
    .filter((id) => !contained.has(id));
  const unconnected = analysis.propositions
    .map((p: Proposition) => p.id)
    .filter((id) => !contained.has(id));
  // A lone proposition has nothing to connect, so it is complete on its own.
  const complete =
    analysis.propositions.length > 0 &&
    roots.length === 1 &&
    (unconnected.length === 0 || analysis.propositions.length === 1);
  return { complete, roots, unconnected };
}
