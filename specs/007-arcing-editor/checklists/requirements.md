# Specification Quality Checklist: Arcing Editor

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-11-05
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [ ] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Constitution Checks

- [x] No automatic proposition splitting, connection, or relationship suggestion, preselection or ranking (FR-002, FR-012, FR-037, SC-002)
- [x] Arcs and brackets are two views of one analysis; switching never changes it (FR-028 to FR-033, SC-004)
- [x] Keyboard, screen reader, touch-only tablet use and WCAG 2.2 AA in all themes; colour never alone (FR-047 to FR-050, SC-001, SC-009)
- [x] No mention, copy or tracing of other arcing tools; method credited to Fuller, Piper and Schreiner (FR-051, FR-052)
- [x] Words referenced by MACULA ids; re-ingest handled (Edge Cases, FR-044)

## Notes

- Three [NEEDS CLARIFICATION] markers remain, all scope decisions, to resolve with `/speckit-clarify` before `/speckit-plan`:
  1. FR-005: whether a passage (and a proposition) may cross a chapter boundary.
  2. FR-006: the largest passage the editor must support. SC-003 depends on this answer.
  3. FR-045: whether exporting or printing the arcs or brackets as a picture or printable page is in scope, or only the data file.
- Mentions of WCAG 2.2 AA, MACULA word ids and `DESIGN.md` are product standards and project constraints, not implementation choices.
- Relationship definitions in the taxonomy data are quoted from source sheets; the Assumptions section records that they must be reworded in the project's own words before the editor shows them (FR-014).
- Import (FR-046) is included because the foundation's portability requirement and the `app-server-and-sqlite` design both place the import half with the arcing editor.
