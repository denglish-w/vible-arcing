# Domain

The discourse-analysis method this app implements, and the modelling findings that follow from it.

## Arcing method

Arcing is a discourse-analysis method developed by Daniel Fuller and popularised by John Piper and Thomas Schreiner. Propositions are linked by labelled logical relationships.

The only paid tool is Biblearc. The only open competitor, `SotS1689/DA-Tool`, has no licence, so its code must not be copied. The relationship taxonomy itself originates in scholarship and is independently implementable.

## One model, two renderings

Arcing and bracketing differ only in how the same analysis is drawn. They are never two features.

Biblearc's own material says the two methods "differ only in how they display the text graphically". A user can switch renderings without altering the stored analysis, and edits in either appear in the other. See [[architecture#One renderer-neutral model]].

## Discourse versus grammatical models

Discourse analysis links propositions by logical relationship; grammatical diagramming links words by syntactic role. They are separate models and must not be conflated.

Discourse analysis works across sentences on bare text plus user segmentation. Grammatical diagramming works within a sentence, needs morphological tagging, and is rendered Reed-Kellogg style. Grammatical diagramming is deferred on scope grounds, not data: MACULA syntax trees already supply what it needs.

## The 18 logical relationships

Eighteen core relationships in four categories, plus four optional extended ones.

Categories are Coordinate (3: Series, Progression, Alternative), Support by Restatement (5), Support by Distinct Statement (8) and Support by Contrary Statement (2). Coordinate relationships have no support direction; the other 15 are subordinate. The extended four are Both-And, General-Specific, Fact-Interpretation and Anticipation-Fulfillment, hidden by default and offered only on opt-in. The canonical definitions are in `docs/reference/logical-relationships.md`.

## Ground and Inference are one relation

Ground and Inference share an identical definition and differ only in whether the supporting proposition follows or precedes.

Relationships are therefore data records with a direction field, not eighteen flat enum values. Ground is `{support, follows}` and Inference is `{support, precedes}`. Inverting a connection flips the direction and re-derives the identifier, so the connection survives. Coordinate relationships carry no direction and reject inversion.

## Conjunction cues suggest, never decide

A table maps 64 Greek conjunctions to 105 relationship associations, each with a scripture example. It supports suggestion only.

Most conjunctions are ambiguous: `εἰ` maps to four relationships. A few are near-unambiguous, such as `καίπερ` mapping only to Concessive. Action-Result versus Action-Purpose cannot be separated lexically, since both surface as "so that". Situation-Response has no conjunction signal at all. The suggestion engine itself is later work.
