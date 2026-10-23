import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { checkAnswer, getPreviousAttempt } from "@/lib/server-fns";
import { FIELD_LABELS, fieldsForPos, fieldOptions } from "@/lib/greek";
import GreekInput from "./GreekInput";
import ParseDropdown from "./ParseDropdown";
import { fetchPreviousOnce, forgetPreviousAttempt } from "@/lib/previousAttemptCache";

// The learner's input form state + fields. `useParsingForm` owns the answer
// state, restores a previously parsed word, and runs the check; `ParsingFields`
// renders the lemma input and the parsing dropdowns (the bubble body), while the
// Check button lives in the bubble footer so it is always reachable. Nothing
// about the source parse is shown. The result is rendered by the bubble inside
// its body. Every parsing field uses the same ParseDropdown control; the part
// of speech / mood still drive which fields appear.
const EMPTY = {
  pos: "", tense: "", voice: "", mood: "",
  person: "", number: "", gender: "", case: "",
};

export function useParsingForm({ word, onResult, onDirtyChange }) {
  const check = useServerFn(checkAnswer);
  const fetchPrev = useServerFn(getPreviousAttempt);
  const [sel, setSel] = useState(EMPTY);
  const [typed, setTyped] = useState("");
  const [checking, setChecking] = useState(false);

  // Re-open a previously parsed word pre-filled with the user's last inputs and
  // showing that last result, so each word only needs to be parsed once.
  useEffect(() => {
    let active = true;
    fetchPreviousOnce(`${word.book}.${word.chapter}.${word.verse}.${word.word_num}`, () =>
      fetchPrev({
        data: {
          book: word.book,
          chapter: word.chapter,
          verse: word.verse,
          word_num: word.word_num,
        },
      })
    )
      .then((prev) => {
        if (!active || !prev) return;
        setSel({ ...EMPTY, ...(prev.selections || {}) });
        setTyped(prev.typed_word || "");
        const comparison = prev.comparison || [];
        onResult({
          result: prev.result,
          sourceParse: prev.source_parse || "",
          wordText: prev.word_text || "",
          comparison,
          diffCount: comparison.filter((c) => c.status === "diff").length,
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.book, word.chapter, word.verse, word.word_num]);

  // Report whether the learner has started entering an answer, so the bubble
  // can protect it from scroll/Esc dismissal.
  useEffect(() => {
    const hasInput = typed.trim() !== "" || Object.values(sel).some((v) => v !== "");
    onDirtyChange?.(hasInput);
  }, [typed, sel, onDirtyChange]);

  const shownFields = ["pos", ...fieldsForPos(sel.pos, sel.mood)];
  const allFilled = shownFields.every((f) => sel[f] && sel[f] !== "") && typed.trim() !== "";

  function setPos(value) {
    setSel((s) => ({ ...EMPTY, pos: value }));
  }
  function setMood(value) {
    setSel((s) => ({ ...s, mood: value, person: "", number: "", case: "", gender: "" }));
  }
  function setField(field, value) {
    setSel((s) => ({ ...s, [field]: value }));
  }

  function clearAnswer() {
    setSel(EMPTY);
    setTyped("");
  }

  async function handleCheck() {
    if (!allFilled || checking) return;
    setChecking(true);
    try {
      const r = await check({
        data: {
          book: word.book,
          chapter: word.chapter,
          verse: word.verse,
          word_num: word.word_num,
          typed_word: typed,
          selections: sel,
        },
      });
      forgetPreviousAttempt(`${word.book}.${word.chapter}.${word.verse}.${word.word_num}`);
      onResult(r);
    } catch (e) {
      toast.error("Could not check your answer. Please try again.");
      console.error("checkAnswer failed", e);
    } finally {
      setChecking(false);
    }
  }

  const hasInput = typed.trim() !== "" || Object.values(sel).some((v) => v !== "");

  return { sel, typed, setTyped, shownFields, allFilled, checking, hasInput, setPos, setMood, setField, handleCheck, clearAnswer };
}

export function ParsingFields({ form, options, compact = false }) {
  const { sel, typed, setTyped, shownFields, setPos, setMood, setField } = form;
  const cols = compact ? "grid-cols-3" : "grid-cols-2";

  function renderField(f) {
    const opts = fieldOptions(f, options?.[f], sel.pos);
    const handler = f === "pos" ? setPos : f === "mood" ? setMood : (v) => setField(f, v);
    return (
      <ParseDropdown
        key={f}
        label={FIELD_LABELS[f]}
        value={sel[f]}
        options={opts}
        onChange={handler}
        compact={compact}
        className={f === "pos" ? (compact ? "col-span-3" : "col-span-2") : ""}
      />
    );
  }

  return (
    <div className={compact ? "pt-2" : "pt-3"}>
      <div>
        <label className="small-caps mb-1 block">Lemma</label>
        <GreekInput
          value={typed}
          onChange={setTyped}
          compact={compact}
          placeholder="Type Latin keys, for example eimi"
        />
      </div>
      <div className={`${compact ? "mt-2 gap-x-3 gap-y-2" : "mt-4 gap-x-4 gap-y-3"} grid ${cols}`}>
        {shownFields.map(renderField)}
      </div>
    </div>
  );
}