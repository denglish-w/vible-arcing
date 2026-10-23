# Domain

The discourse-analysis method this app implements, and the modelling findings that follow from it.

## Arcing method

Arcing is a discourse-analysis method developed by Daniel Fuller and popularised by John Piper and Thomas Schreiner. Propositions are linked by labelled logical relationships.

The only paid tool is Biblearc. The only open competitor, `SotS1689/DA-Tool`, has no licence, so its code must not be copied. The relationship taxonomy itself originates in scholarship and is independently implementable.

## Clean design from prior art

The project aims to respect Biblearc and build something better, so it learns from existing tools without copying their expression.

Requirements are written as user needs in the project's own words, and screens are designed from the [[design-system]]. Biblearc's code, assets, help text, labels, reference-sheet wording, name and logo are never reused, and the product must not be confusable with it. Its screenshots are not committed. The method and taxonomy are implemented from the scholarly sources and credited.

## One model, two renderings

Arcing and bracketing differ only in how the same analysis is drawn. They are never two features.

Biblearc's own material says the two methods "differ only in how they display the text graphically". A user can switch renderings without altering the stored analysis, and edits in either appear in the other. See [[architecture#One renderer-neutral model]].

## Discourse versus grammatical models

Discourse analysis links propositions by logical relationship; grammatical diagramming links words by syntactic role. They are separate models and must not be conflated.

Discourse analysis works across sentences on bare text plus user segmentation. Grammatical diagramming works within a sentence and is drawn in school-style Reed-Kellogg notation adapted for Greek, defined in `docs/reference/diagramming-notation.md`. It is in scope. The user places every word: MACULA supplies the text and each word's grammar, but its syntax trees are never used to draw or suggest a diagram.

## The 18 logical relationships

Eighteen core relationships in four categories, plus four optional extended ones.

Categories are Coordinate (3: Series, Progression, Alternative), Support by Restatement (5), Support by Distinct Statement (8) and Support by Contrary Statement (2). Coordinate relationships have no support direction; the other 15 are subordinate. The extended four are Both-And, General-Specific, Fact-Interpretation and Anticipation-Fulfillment, hidden by default and offered only on opt-in. The canonical definitions are in `docs/reference/logical-relationships.md`.

## Ground and Inference are one relation

Ground and Inference share an identical definition and differ only in whether the supporting proposition follows or precedes.

Relationships are therefore data records with a direction field, not eighteen flat enum values. Ground is `{support, follows}` and Inference is `{support, precedes}`. Inverting a connection flips the direction and re-derives the identifier, so the connection survives. Coordinate relationships carry no direction and reject inversion.

## Conjunction cues are reference only

A table maps 64 Greek conjunctions to 105 relationship associations, each with a scripture example. Users can look entries up; the app never suggests from it.

Most conjunctions are ambiguous: `εἰ` maps to four relationships. A few are near-unambiguous, such as `καίπερ` mapping only to Concessive. Action-Result versus Action-Purpose cannot be separated lexically, since both surface as "so that". Situation-Response has no conjunction signal at all. There is no suggestion engine: the app never proposes, preselects or ranks a relationship, because interpretation is the user's job (see `PRODUCT.md`).
