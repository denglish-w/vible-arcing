# Proposition model

How an analysis is represented in memory. This is the single structure both renderers consume.

## Containment tree

An analysis is an ordered list of propositions plus a forest of connection nodes, each covering a contiguous range of proposition indices.

The stored document ([[src/lib/analysis/model.ts]]) holds the passage's MACULA word ids, propositions that name their first and last word, and connections. Members of a connection are propositions or other connections, mirroring a constituency tree over the proposition sequence. Contiguity plus containment is exactly what both renderers need. A flat edge list was rejected because arcs span groups, not pairs, and a general graph would admit crossing arcs and cycles.

## Bilateral as a ternary node

Bilateral is one node with three ordered members: the supported member before, the supporting proposition, and the supported member after.

This keeps every connection a single node over one contiguous span, so the tree has no node with two parents. It is the only non-binary subordinate form, and the type asserts that. The Ground-plus-Inference equivalence stated on the Greek conjunctions sheet is recorded as semantics on the node, not as its storage form, which leaves a future "split into two relationships" action available.

The spec requirement on multiple support participation is worded structurally and should be reworded behaviourally before archive. All its scenarios pass under this design.

## Segmentation

Propositions are non-overlapping, ordered spans of source text, referenced by word identifiers and preserving text verbatim.

A user can split a proposition or merge two adjacent ones; non-adjacent merges are rejected. Not every word needs to belong to a proposition. How split and merge treat existing connections is unresolved: preserving them and reporting them are both permitted, and one behaviour must be chosen and applied consistently.

## Validity and completeness

Structural rules are enforced at all times, but completeness is only reported, never required.

Contiguity, arity and acyclicity are always enforced. An analysis is complete when a single outermost connection covers all its propositions, or when it has exactly one proposition and so nothing to connect. An analysis with no propositions is incomplete. Incomplete analyses can be saved, resumed and rendered. Coordinate connections relate two or more equal members; subordinate connections relate exactly one supporter to its supported member or members.

## Portability

Exported analyses round-trip losslessly and name the passage and text edition they were built over.

Word identifiers come from MACULA, not from positional indices, so saved analyses survive re-ingest and upstream corrections. See [[corpus#Stable word identifiers]].
