## Purpose

Defines the canonical vocabulary of logical relationships used to label how one proposition relates to another in discourse analysis — the 18 core relationships of the Fuller/Piper/Schreiner arcing method, their categories, directionality, and the language-specific conjunctions that cue them.

## ADDED Requirements

### Requirement: Canonical relationship set

The system SHALL provide exactly 18 core logical relationships, each with a unique identifier, display name, abbreviation, and definition.

The 18 core relationships SHALL be: Series, Progression, Alternative, Action-Manner, Comparison, Negative-Positive, Idea-Explanation, Question-Answer, Ground, Inference, Bilateral, Action-Result, Action-Purpose, Conditional, Temporal, Locative, Concessive, Situation-Response.

The system SHALL additionally provide 4 extended relationships: Both-And, General-Specific, Fact-Interpretation, Anticipation-Fulfillment.

Extended relationships SHALL be excluded from relationship selection by default and available only when the user explicitly opts in.

#### Scenario: Core relationships available by default

- **WHEN** a user selects a relationship to label a connection between propositions
- **THEN** all 18 core relationships are offered
- **AND** the 4 extended relationships are not offered

#### Scenario: Extended relationships opted in

- **WHEN** a user enables extended relationships
- **THEN** all 22 relationships are offered
- **AND** extended relationships are visually distinguished from core relationships

#### Scenario: Every relationship carries its reference data

- **WHEN** any relationship is retrieved
- **THEN** it exposes a stable identifier, display name, abbreviation, and definition text

### Requirement: Relationship categorisation

Each relationship SHALL belong to exactly one category. Categories SHALL be: Coordinate, Support by Restatement, Support by Distinct Statement, Support by Contrary Statement.

Coordinate SHALL contain exactly 3 relationships: Series, Progression, Alternative.

Support by Restatement SHALL contain exactly 5: Action-Manner, Comparison, Negative-Positive, Idea-Explanation, Question-Answer.

Support by Distinct Statement SHALL contain exactly 8: Ground, Inference, Bilateral, Action-Result, Action-Purpose, Conditional, Temporal, Locative.

Support by Contrary Statement SHALL contain exactly 2: Concessive, Situation-Response.

The system SHALL classify every non-Coordinate relationship as subordinate.

#### Scenario: Category counts hold

- **WHEN** relationships are grouped by category
- **THEN** Coordinate contains 3, Support by Restatement contains 5, Support by Distinct Statement contains 8, and Support by Contrary Statement contains 2

#### Scenario: Coordinate and subordinate partition the set

- **WHEN** relationships are partitioned into coordinate and subordinate
- **THEN** exactly 3 are coordinate and exactly 15 are subordinate

#### Scenario: Selection is presented by category

- **WHEN** a user is offered relationships to choose from
- **THEN** the relationships are grouped under their category names

### Requirement: Relationship directionality

Each subordinate relationship SHALL declare the position of the supporting proposition relative to the supported proposition: `follows`, `precedes`, or `either`.

Ground SHALL declare `follows`. Inference SHALL declare `precedes`.

Coordinate relationships SHALL NOT declare a support direction, because neither member supports the other.

The system SHALL treat Ground and Inference as the same underlying relation differing only in direction, and SHALL allow a user to invert a Ground into an Inference (and the reverse) without discarding the connection.

#### Scenario: Ground inverts to Inference

- **WHEN** a user inverts the direction of a connection labelled Ground
- **THEN** the connection is relabelled Inference
- **AND** the two propositions it connects are unchanged

#### Scenario: Coordinate relationships cannot be inverted

- **WHEN** a user attempts to invert a connection labelled Series, Progression, or Alternative
- **THEN** the system rejects the operation and reports that coordinate relationships have no support direction

### Requirement: Bilateral relationship

Bilateral SHALL be a first-class, user-selectable relationship, presented alongside the other 17 core relationships.

A Bilateral connection SHALL relate one supporting proposition to exactly two supported propositions: one preceding the supporter and one following it.

The system SHALL record that Bilateral is semantically equivalent to a Ground toward the preceding proposition combined with an Inference toward the following proposition.

The system SHALL treat a Bilateral connection as a single named connection for the purposes of selection, labelling, and display, not as two independent connections the user must manage separately.

#### Scenario: Bilateral is selectable by name

- **WHEN** a user chooses a relationship to label a connection
- **THEN** Bilateral appears in the list under Support by Distinct Statement

#### Scenario: Bilateral requires two supported propositions

- **WHEN** a user labels a connection Bilateral
- **THEN** the system requires one supported proposition preceding the supporter and one following it
- **AND** rejects the connection if either is missing

#### Scenario: Bilateral is edited as one connection

- **WHEN** a user relabels or deletes a Bilateral connection
- **THEN** the change applies to the whole connection, including both supported propositions

### Requirement: Conjunction cues

The system SHALL maintain a mapping from conjunctions to the relationships they may signal, keyed by language, where each mapping entry carries a scripture reference exemplifying that pairing.

The system SHALL provide this mapping for Koine Greek, covering at least 64 conjunctions.

A conjunction MAY map to more than one relationship. The system SHALL NOT treat a conjunction as determining a relationship.

Where a conjunction maps to exactly one relationship, the system MAY present that suggestion with higher confidence than a conjunction mapping to several.

#### Scenario: Ambiguous conjunction yields multiple candidates

- **WHEN** the conjunction `εἰ` is looked up
- **THEN** the system returns Question-Answer, Idea-Explanation, Conditional, and Concessive as candidates
- **AND** does not designate any one of them as the relationship

#### Scenario: Unambiguous conjunction yields a single candidate

- **WHEN** the conjunction `καίπερ` is looked up
- **THEN** the system returns Concessive as the only candidate

#### Scenario: Cue entries carry examples

- **WHEN** any conjunction-to-relationship mapping is retrieved
- **THEN** it includes a scripture reference exemplifying that pairing

#### Scenario: Unmapped conjunction

- **WHEN** a conjunction absent from the mapping is looked up
- **THEN** the system returns no candidates and reports that the mapping is not exhaustive

#### Scenario: Relationships with no lexical cue

- **WHEN** candidates are requested for Situation-Response
- **THEN** the system reports that this relationship has no conjunction cue and cannot be suggested lexically

### Requirement: Language-agnostic taxonomy

The relationship set, categories, and directionality SHALL be independent of the language of the text being analysed.

Only the conjunction cue mapping SHALL be language-specific.

Adding support for an additional language SHALL require only new cue data, and SHALL NOT require changes to the relationship set, categories, or directionality.

#### Scenario: Taxonomy is identical across languages

- **WHEN** relationships are retrieved while analysing a text in any supported language
- **THEN** the same 18 core relationships with the same categories and directions are returned

#### Scenario: Cues are scoped to a language

- **WHEN** conjunction cues are requested for a language with no cue data
- **THEN** the system returns no cues
- **AND** relationship selection remains fully available

### Requirement: Attribution of taxonomy sources

The system SHALL attribute the relationship taxonomy and conjunction cue data to their sources in user-visible documentation.

#### Scenario: Attribution is reachable

- **WHEN** a user views information about the relationship taxonomy
- **THEN** the origin of the taxonomy and the conjunction cue data is stated
