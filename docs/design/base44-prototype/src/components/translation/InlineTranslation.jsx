import { memo } from "react";
import VerseEditor from "./VerseEditor";

// The translation boxes shown directly beneath a verse's Greek (and its English
// line) when Translate is on, in both Reading and Learning mode. It is the same
// editor the side panel used, so splitting, brackets, notes, autosave and the
// sign-in prompt behave as before. Everything is stopped from bubbling to the
// Greek line above, so typing or clicking here never activates a word.
function InlineTranslation({
  verse,
  vwords,
  bsbVerse,
  bsbVisible,
  annotation,
  book,
  chapter,
  isAuthenticated,
  onMutate,
  focusBracket,
  onFocusBracket,
  splitting,
  onToggleSplit,
}) {
  return (
    <div
      data-translate-box
      className="mt-2"
      style={{ fontSize: "1rem", lineHeight: 1.5 }}
    >
      <VerseEditor
        inline
        verse={verse}
        vwords={vwords}
        bsbVerse={bsbVerse}
        bsbVisible={bsbVisible}
        annotation={annotation}
        book={book}
        chapter={chapter}
        isAuthenticated={isAuthenticated}
        onMutate={onMutate}
        focusBracket={focusBracket}
        onFocusBracket={onFocusBracket}
        splitting={splitting}
        onToggleSplit={onToggleSplit}
      />
    </div>
  );
}

export default memo(InlineTranslation);