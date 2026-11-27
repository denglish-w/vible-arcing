"use client";
// The parsing form (spec 010 FR-007 to FR-019, FR-026, FR-029 to FR-035;
// contracts/ui.md "Parsing form"). It holds the user's answers only; the
// source's values arrive in the response to a check and nowhere else (FR-020).
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FIELD_LABELS,
  FIELD_VALUES,
  FORM_POS,
  fieldsFor,
  type FieldName,
  type FormPos,
} from "@/lib/learning/fields";
import { finalise, toGreek } from "@/lib/learning/translit";
import type {
  AttemptSummary,
  CheckResult,
  ComparedField,
  FieldComparison,
  LeanWord,
  ParsingAnswer,
  SourceParsing,
} from "@/lib/learning/types";

export type SaveState = "pending" | "refused" | undefined;

/** Where Next word leads after the last word of a chapter (FR-031). */
export type EndOfChapter = { href: string; label: string } | null;

type Checked = Extract<CheckResult, { ok: true }>;

const COMPARED_LABELS: Record<ComparedField, string> = {
  lemma: "Dictionary form",
  pos: "Part of speech",
  ...FIELD_LABELS,
};

const SOURCE_ORDER = [
  "tense",
  "voice",
  "mood",
  "person",
  "number",
  "gender",
  "case",
  "degree",
] as const;

const OUTCOME = {
  agrees: { symbol: "✓", label: "Agrees" },
  differs: { symbol: "✗", label: "Differs" },
  unanswered: { symbol: "–", label: "Unanswered" },
} as const;

const REFUSALS: Record<string, string> = {
  invalid:
    "This answer couldn't be checked because it isn't in the expected form.",
  "unknown-word":
    "This word is not in the corpus store, so it couldn't be checked.",
  "corpus-missing":
    "The Greek corpus has not been built, so words can't be checked yet.",
};

const valueLabel = (value: string) =>
  value === "n/a" ? "not applicable" : value;

/** "16 November 2026" in the reader's locale, without a time. */
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export function outcomeAnnouncement(differCount: number): string {
  if (differCount === 0) return "All fields agree with the source";
  return differCount === 1
    ? "1 field differs from the source"
    : `${differCount} fields differ from the source`;
}

function emptyAnswer(wordId: string): ParsingAnswer {
  return { wordId, lemma: "", pos: "", fields: {} };
}

export function ParsingForm({
  word,
  reference,
  previous,
  onCheck,
  saveState,
  saveRefusal,
  onPrevious,
  onNext,
  onClose,
  endOfChapter,
  onDirtyChange,
  confirmingDiscard: confirmingInitially = false,
  initialResult,
}: {
  word: LeanWord;
  /** e.g. "Philippians 1:3". */
  reference: string;
  /** The last attempt at this word, used to pre-fill (FR-026). */
  previous?: AttemptSummary;
  /** Rejects when the server cannot be reached. */
  onCheck: (answer: ParsingAnswer) => Promise<CheckResult>;
  saveState?: SaveState;
  saveRefusal?: string;
  /** Absent on the first word. */
  onPrevious?: () => void;
  onNext: () => void;
  /** Called once closing is confirmed; the caller returns focus to the word. */
  onClose: () => void;
  /** Set after Next word on the last word: the chapter is finished. */
  endOfChapter?: EndOfChapter;
  onDirtyChange?: (dirty: boolean) => void;
  /** For stories: open with the discard confirmation showing. */
  confirmingDiscard?: boolean;
  /** For stories: open on a checked result. */
  initialResult?: Checked;
}) {
  const id = useId();
  const lemmaRef = useRef<HTMLInputElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [answer, setAnswer] = useState<ParsingAnswer>(() =>
    previous ? { ...previous.answer, wordId: word.id } : emptyAnswer(word.id),
  );
  const [result, setResult] = useState<Checked | null>(initialResult ?? null);
  const [problem, setProblem] = useState<
    { kind: "unreachable" } | { kind: "refused"; reason: string } | null
  >(null);
  const [checking, setChecking] = useState(false);
  const [dirty, setDirty] = useState(confirmingInitially);
  const [confirming, setConfirming] = useState(confirmingInitially);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    lemmaRef.current?.focus();
  }, []);
  useEffect(() => {
    if (confirming) keepRef.current?.focus();
  }, [confirming]);
  // Escape anywhere in the form closes it, asking first if answers are
  // unchecked (FR-034). The popover leaves Escape to this handler.
  const onEscape = useRef(() => {});
  useEffect(() => {
    onEscape.current = () => {
      if (endOfChapter !== undefined) onClose();
      else if (confirming) setConfirming(false);
      else if (dirty) setConfirming(true);
      else onClose();
    };
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        event.target instanceof Node &&
        rootRef.current?.contains(event.target)
      ) {
        event.preventDefault();
        onEscape.current();
      }
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, []);
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const shown = fieldsFor(answer.pos, answer.fields.mood);

  function edit(next: ParsingAnswer) {
    // Only fields that still apply are kept (FR-012).
    const allowed = fieldsFor(next.pos, next.fields.mood);
    const fields: ParsingAnswer["fields"] = {};
    for (const field of allowed)
      if (next.fields[field]) fields[field] = next.fields[field];
    setAnswer({ ...next, fields });
    setDirty(true);
    setConfirming(false);
  }

  async function check() {
    const submitted = { ...answer, lemma: finalise(answer.lemma).trim() };
    setAnswer(submitted);
    setChecking(true);
    setProblem(null);
    try {
      const outcome = await onCheck(submitted);
      if (outcome.ok) {
        setResult(outcome);
        setDirty(false);
        setConfirming(false);
        setAnnouncement(outcomeAnnouncement(outcome.differCount));
      } else {
        setProblem({ kind: "refused", reason: outcome.reason });
        setAnnouncement(
          REFUSALS[outcome.reason] ?? "This word couldn't be checked.",
        );
      }
    } catch {
      setProblem({ kind: "unreachable" });
      setAnnouncement("Couldn't check this word. Your answers are kept.");
    } finally {
      setChecking(false);
    }
  }

  function requestClose() {
    if (dirty) setConfirming(true);
    else onClose();
  }

  if (endOfChapter !== undefined) {
    return (
      <div className="parsing-form" lang="en" ref={rootRef}>
        <div className="popover-heading">
          <h2>
            {endOfChapter ? "End of the chapter" : "End of the New Testament"}
          </h2>
          <Button aria-label="Close parsing form" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>
        {endOfChapter ? (
          <p>
            <Link href={endOfChapter.href}>
              Continue with {endOfChapter.label}
            </Link>
          </p>
        ) : (
          <p>There are no more words to parse.</p>
        )}
        <div className="parsing-actions">
          <Button onClick={onPrevious} disabled={!onPrevious}>
            <ChevronLeft size={16} aria-hidden />
            Previous word
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="parsing-form" lang="en" ref={rootRef}>
      <div className="popover-heading">
        <h2>
          <span lang="grc">{word.text}</span>
          <span className="parsing-reference">{reference}</span>
        </h2>
        <Button aria-label="Close parsing form" onClick={requestClose}>
          <X size={16} />
        </Button>
      </div>

      {previous && !result && (
        <p className="parsing-previous">
          Checked before on {formatDate(previous.checkedAt)}:{" "}
          {previous.allAgreed
            ? "all agreed"
            : `${previous.differCount} differed`}
        </p>
      )}

      <form
        className="parsing-body"
        onSubmit={(event) => {
          event.preventDefault();
          if (!checking) void check();
        }}
      >
        <div className="parsing-field">
          <label htmlFor={`${id}-lemma`}>Dictionary form</label>
          <input
            ref={lemmaRef}
            id={`${id}-lemma`}
            lang="grc"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            maxLength={200}
            value={answer.lemma}
            onChange={(event) =>
              edit({ ...answer, lemma: toGreek(event.target.value) })
            }
          />
        </div>
        <div className="parsing-field">
          <label htmlFor={`${id}-pos`}>Part of speech</label>
          <select
            id={`${id}-pos`}
            value={answer.pos}
            onChange={(event) =>
              edit({ ...answer, pos: event.target.value as FormPos | "" })
            }
          >
            <option value="">Choose…</option>
            {FORM_POS.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>
        {shown.map((field: FieldName) => (
          <div className="parsing-field" key={field}>
            <label htmlFor={`${id}-${field}`}>{FIELD_LABELS[field]}</label>
            <select
              id={`${id}-${field}`}
              value={answer.fields[field] ?? ""}
              onChange={(event) =>
                edit({
                  ...answer,
                  fields: { ...answer.fields, [field]: event.target.value },
                })
              }
            >
              <option value="">Choose…</option>
              {FIELD_VALUES[field].map((value) => (
                <option key={value} value={value}>
                  {valueLabel(value)}
                </option>
              ))}
            </select>
          </div>
        ))}

        {problem?.kind === "unreachable" && (
          <p className="parsing-problem" role="alert">
            Couldn&rsquo;t check this word. Your answers are kept; try again.
          </p>
        )}
        {problem?.kind === "refused" && (
          <p className="parsing-problem" role="alert">
            {REFUSALS[problem.reason] ?? "This word couldn't be checked."}
          </p>
        )}

        {confirming ? (
          <fieldset className="parsing-confirm">
            <legend>Discard your answers?</legend>
            <div className="parsing-actions">
              <Button onClick={onClose}>Discard</Button>
              <Button ref={keepRef} onClick={() => setConfirming(false)}>
                Keep editing
              </Button>
            </div>
          </fieldset>
        ) : (
          <div className="parsing-actions">
            <Button type="submit" className="button-check" disabled={checking}>
              {problem?.kind === "unreachable" ? "Check again" : "Check"}
            </Button>
            <Button onClick={onPrevious} disabled={!onPrevious}>
              <ChevronLeft size={16} aria-hidden />
              Previous word
            </Button>
            <Button onClick={onNext}>
              Next word
              <ChevronRight size={16} aria-hidden />
            </Button>
          </div>
        )}
      </form>

      <output className="sr-only" aria-live="polite">
        {announcement}
      </output>

      {result && (
        <Comparison
          result={result}
          saveState={saveState}
          saveRefusal={saveRefusal}
        />
      )}
    </div>
  );
}

function Comparison({
  result,
  saveState,
  saveRefusal,
}: {
  result: Checked;
  saveState: SaveState;
  saveRefusal?: string;
}) {
  return (
    <section className="parsing-result" aria-label="Comparison with the source">
      <p className="parsing-outcome">
        {outcomeAnnouncement(result.differCount)}.
      </p>
      {saveState === "pending" && (
        <p className="parsing-save">Not saved yet — retrying</p>
      )}
      {saveState === "refused" && (
        <p className="parsing-save" role="alert">
          This attempt was not saved
          {saveRefusal ? `: ${REFUSALS[saveRefusal] ?? saveRefusal}` : "."}
        </p>
      )}
      <table className="comparison">
        <thead>
          <tr>
            <th scope="col">Field</th>
            <th scope="col">Your answer</th>
            <th scope="col">Source</th>
            <th scope="col">Outcome</th>
          </tr>
        </thead>
        <tbody>
          {result.comparisons.map((row: FieldComparison) => (
            <tr key={row.field} data-outcome={row.outcome}>
              <th scope="row">{COMPARED_LABELS[row.field]}</th>
              <td lang={row.field === "lemma" ? "grc" : undefined}>
                {row.answer === null ? "—" : valueLabel(row.answer)}
              </td>
              <td lang={row.field === "lemma" ? "grc" : undefined}>
                {row.source === null ? "blank" : row.source}
              </td>
              <td className="outcome">
                <span aria-hidden>{OUTCOME[row.outcome].symbol}</span>{" "}
                {OUTCOME[row.outcome].label}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <SourceDetails source={result.source} />
    </section>
  );
}

function SourceDetails({ source }: { source: SourceParsing }) {
  return (
    <div className="source-parsing">
      <h3 className="small-caps">Source parsing</h3>
      <p>
        <span lang="grc">{source.lemma}</span>
        {source.gloss && <span className="gloss"> — {source.gloss}</span>}
      </p>
      <dl>
        <dt>Part of speech</dt>
        <dd>{source.pos}</dd>
        {SOURCE_ORDER.filter((field) => source[field]).map((field) => (
          <Fragment key={field}>
            <dt>{field}</dt>
            <dd>{source[field]}</dd>
          </Fragment>
        ))}
      </dl>
    </div>
  );
}
