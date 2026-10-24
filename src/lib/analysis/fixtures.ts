// Valid and invalid analyses shared by the validation tests and the save-action
// tests (foundation design decision 7). Word ids are Philippians 1:3, so the
// same documents can be stored against a corpus holding that verse.
import type { Analysis } from "./model.ts";
import type { ValidationErrorCode } from "./validate.ts";

/** Philippians 1:3, word by word: εὐχαριστῶ τῷ θεῷ μου ἐπὶ πάσῃ τῇ μνείᾳ ὑμῶν. */
export const WORDS = Array.from(
  { length: 9 },
  (_, i) => `n50001003${String(i + 1).padStart(3, "0")}`,
);
const [w1, w2, w3, w4, w5, w6, , w8, w9] = WORDS;

/** Four one- or two-word propositions over the verse, with a word left out. */
const p = [
  { id: "p1", first: w1, last: w1 },
  { id: "p2", first: w2, last: w3 },
  { id: "p3", first: w4, last: w5 },
  { id: "p4", first: w6, last: w8 },
];

const analysis = (doc: Partial<Analysis>): Analysis => ({
  words: WORDS,
  propositions: p,
  connections: [],
  ...doc,
});

export const VALID: Record<string, Analysis> = {
  "new and unsegmented": { words: WORDS, propositions: [], connections: [] },
  "segmented, nothing connected": analysis({}),
  "one proposition over the whole verse": analysis({
    propositions: [{ id: "p1", first: w1, last: w9 }],
  }),
  Ground: analysis({
    connections: [
      { id: "c1", relationship: "ground", members: ["p1", "p2"], supporter: 1 },
    ],
  }),
  Inference: analysis({
    connections: [
      {
        id: "c1",
        relationship: "inference",
        members: ["p1", "p2"],
        supporter: 0,
      },
    ],
  }),
  "Action-Purpose with the supporter first": analysis({
    connections: [
      {
        id: "c1",
        relationship: "action-purpose",
        members: ["p1", "p2"],
        supporter: 0,
      },
    ],
  }),
  "Action-Purpose with the supporter second": analysis({
    connections: [
      {
        id: "c1",
        relationship: "action-purpose",
        members: ["p1", "p2"],
        supporter: 1,
      },
    ],
  }),
  "Series over four propositions": analysis({
    connections: [
      { id: "c1", relationship: "series", members: ["p1", "p2", "p3", "p4"] },
    ],
  }),
  "nested to three levels and complete": analysis({
    connections: [
      { id: "g", relationship: "ground", members: ["p1", "p2"], supporter: 1 },
      { id: "s", relationship: "series", members: ["g", "p3"] },
      {
        id: "i",
        relationship: "inference",
        members: ["s", "p4"],
        supporter: 0,
      },
    ],
  }),
  Bilateral: analysis({
    connections: [
      { id: "b", relationship: "bilateral", members: ["p1", "p2", "p3"] },
    ],
  }),
  "Bilateral over groups": analysis({
    connections: [
      { id: "s", relationship: "series", members: ["p1", "p2"] },
      { id: "b", relationship: "bilateral", members: ["s", "p3", "p4"] },
    ],
  }),
  "an extended relationship": analysis({
    connections: [
      { id: "c1", relationship: "both-and", members: ["p3", "p4"] },
    ],
  }),
};

export type InvalidFixture = {
  doc: unknown;
  /** Every error code the validator must report, sorted. */
  codes: ValidationErrorCode[];
};

/** A connection as it might arrive from a client, not as the types allow. */
const raw = (connections: unknown[]) => ({ ...analysis({}), connections });

export const INVALID: Record<string, InvalidFixture> = {
  "not an object": { doc: "analysis", codes: ["malformed"] },
  "words missing": {
    doc: { propositions: [], connections: [] },
    codes: ["malformed"],
  },
  "a connection without members": {
    doc: raw([{ id: "c1", relationship: "series" }]),
    codes: ["malformed"],
  },
  "a repeated id": {
    doc: raw([{ id: "p1", relationship: "series", members: ["p2", "p3"] }]),
    codes: ["duplicate-id"],
  },
  "a repeated word": {
    doc: { ...analysis({}), words: [...WORDS, w1] },
    codes: ["duplicate-word"],
  },
  "a proposition on a word outside the passage": {
    doc: analysis({
      propositions: [{ id: "p1", first: w1, last: "n50001004001" }],
    }),
    codes: ["unknown-word"],
  },
  "a proposition that ends before it starts": {
    doc: analysis({ propositions: [{ id: "p1", first: w3, last: w1 }] }),
    codes: ["proposition-span"],
  },
  "overlapping propositions": {
    doc: analysis({
      propositions: [
        { id: "p1", first: w1, last: w3 },
        { id: "p2", first: w3, last: w4 },
      ],
    }),
    codes: ["proposition-order"],
  },
  "propositions out of order": {
    doc: analysis({ propositions: [p[1], p[0]] }),
    codes: ["proposition-order"],
  },
  "an unlabelled connection": {
    doc: raw([{ id: "c1", members: ["p1", "p2"] }]),
    codes: ["missing-relationship"],
  },
  "an unknown relationship": {
    doc: raw([{ id: "c1", relationship: "because", members: ["p1", "p2"] }]),
    codes: ["unknown-relationship"],
  },
  "a member that does not exist": {
    doc: raw([{ id: "c1", relationship: "series", members: ["p1", "p9"] }]),
    codes: ["unknown-member"],
  },
  "Ground over three members": {
    doc: raw([
      {
        id: "c1",
        relationship: "ground",
        members: ["p1", "p2", "p3"],
        supporter: 2,
      },
    ]),
    codes: ["arity"],
  },
  "Series with one member": {
    doc: raw([{ id: "c1", relationship: "series", members: ["p1"] }]),
    codes: ["arity"],
  },
  "Bilateral missing one side": {
    doc: raw([{ id: "b", relationship: "bilateral", members: ["p1", "p2"] }]),
    codes: ["arity"],
  },
  "Ground with no supporter marked": {
    doc: raw([{ id: "c1", relationship: "ground", members: ["p1", "p2"] }]),
    codes: ["supporter"],
  },
  "Series with a supporter": {
    doc: raw([
      {
        id: "c1",
        relationship: "series",
        members: ["p1", "p2"],
        supporter: 0,
      },
    ]),
    codes: ["supporter"],
  },
  "Ground with the supporter first": {
    doc: raw([
      { id: "c1", relationship: "ground", members: ["p1", "p2"], supporter: 0 },
    ]),
    codes: ["direction"],
  },
  "Inference with the supporter second": {
    doc: raw([
      {
        id: "c1",
        relationship: "inference",
        members: ["p1", "p2"],
        supporter: 1,
      },
    ]),
    codes: ["direction"],
  },
  "a connection inside itself": {
    doc: raw([{ id: "c1", relationship: "series", members: ["p1", "c1"] }]),
    codes: ["cycle"],
  },
  "two connections inside each other": {
    doc: raw([
      { id: "a", relationship: "series", members: ["p1", "b"] },
      { id: "b", relationship: "series", members: ["a", "p2"] },
    ]),
    codes: ["cycle"],
  },
  "one proposition supporting two members before it": {
    doc: raw([
      { id: "c1", relationship: "ground", members: ["p2", "p3"], supporter: 1 },
      { id: "c2", relationship: "ground", members: ["p1", "p3"], supporter: 1 },
    ]),
    codes: ["non-contiguous", "shared-member"],
  },
  "a proposition in two connections": {
    doc: raw([
      { id: "c1", relationship: "series", members: ["p1", "p2"] },
      { id: "c2", relationship: "series", members: ["p2", "p3"] },
    ]),
    codes: ["shared-member"],
  },
  "members separated by one belonging to neither": {
    doc: raw([{ id: "c1", relationship: "series", members: ["p1", "p3"] }]),
    codes: ["non-contiguous"],
  },
  "members out of order": {
    doc: raw([{ id: "c1", relationship: "series", members: ["p2", "p1"] }]),
    codes: ["non-contiguous"],
  },
  "Bilateral with both supported members before the supporter": {
    doc: raw([
      { id: "b", relationship: "bilateral", members: ["p1", "p3", "p2"] },
    ]),
    codes: ["bilateral-sides"],
  },
};
