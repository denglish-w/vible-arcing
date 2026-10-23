import { createFileRoute, notFound } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getLearningOptions } from "@/lib/server-fns";
import { loadStaticChapter, prefetchStaticChapter } from "@/lib/staticChapter";
import { prefetchWordDetail } from "@/lib/staticWordDetail";
import { getBook } from "@/lib/books";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useChapterAnnotations } from "@/hooks/useChapterAnnotations";
import { useAuth } from "@/lib/AuthContext";
import { useStudySettings } from "@/components/study/StudySettingsProvider";
import ReadingHeader from "@/components/reading/ReadingHeader";
import StudyMenu from "@/components/reading/StudyMenu";
import GreekText from "@/components/reading/GreekText";
import DiagrammingPlaceholder from "@/components/reading/DiagrammingPlaceholder";
import NewDiagramDialog from "@/components/reading/NewDiagramDialog";
import DiagrammingScreen from "@/components/reading/DiagrammingScreen";
import WordDetailPopover from "@/components/reading/WordDetailPopover";
import LearningBanner from "@/components/learning/LearningBanner";
import LearningBubble from "@/components/learning/LearningBubble";
import { useIsMobile } from "@/hooks/use-mobile";
import SignInPrompt from "@/components/learning/SignInPrompt";
import { canAddBracket } from "@/lib/diaglot";

export const Route = createFileRoute("/read/$bookId/$chapter")({
  ssr: false,
  loader: async ({ params }) => {
    const book = getBook(params.bookId);
    if (!book) throw notFound();
    const chapter = Number(params.chapter);
    if (!Number.isFinite(chapter) || chapter < 1 || chapter > book.chapters)
      throw notFound();
    const { words, english, morph } = await loadStaticChapter(book.code, chapter);
    return { book, chapter, words, english, morph };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.book?.name ?? ""} ${loaderData?.chapter ?? ""} — The Greek New Testament`,
      },
    ],
  }),
  component: ReadingPage,
});

function ReadingPage() {
  const { book, chapter, words, english, morph } = Route.useLoaderData();
  const { isAuthenticated, navigateToLogin } = useAuth();
  const { settings, update: updateSettings } = useStudySettings();
  const fetchOptions = useServerFn(getLearningOptions);
  const isMobile = useIsMobile();

  const [mode, setMode] = usePersistentState("gnt.mode", "reading");
  const translateOn = settings.translate;
  const toggleTranslate = () => updateSettings({ translate: !settings.translate });
  const englishOn = settings.english;
  const toggleEnglish = () => updateSettings({ english: !settings.english });
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeWord, setActiveWord] = useState(null);
  const [activeWordEl, setActiveWordEl] = useState(null);
  const [currentVerse, setCurrentVerse] = useState(1);
  const [greekScrollVerse, setGreekScrollVerse] = useState(null);
  const [options, setOptions] = useState(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const [focusBracket, setFocusBracket] = useState(null);
  const [diagramDialogOpen, setDiagramDialogOpen] = useState(false);
  const [diagramPassage, setDiagramPassage] = useState(null);
  const scrollRef = useRef(null);
  const closeBubble = useCallback(() => {
    setActiveWord(null);
    setActiveWordEl(null);
  }, []);

  // Study feature state: the per-word morphology cache (pos/mood/lemma, Reading
  // only) and the occurrence currently stepped to (a temporary pink highlight
  // that clears when the user clicks elsewhere). Same-word auto-highlighting was
  // removed; the cache is still used for part-of-speech coloring and for building
  // the occurrence stepper's chapter list on demand.
  // Reading only: the morphology comes with the chapter's static file and is
  // withheld in Learning mode so the source answers are never used there.
  const morphMap = mode === "reading" ? morph : null;

  const learning = mode === "learning" && isAuthenticated;
  const enableSelection = translateOn && mode === "reading" && isAuthenticated;
  const { annotations, onMutate, saveStatus } = useChapterAnnotations(book.code, chapter, translateOn);

  useEffect(() => {
    if (mode === "learning" && !options) {
      fetchOptions({ data: {} }).then(setOptions).catch(() => {});
    }
  }, [mode, options]);

  // Warm the word-bubble data (Reading only) for this chapter.
  useEffect(() => {
    if (mode === "reading") prefetchWordDetail(book.code, chapter);
  }, [mode, book.code, chapter]);

  // Warm the neighbouring chapters so turning the page is instant.
  useEffect(() => {
    prefetchStaticChapter(book.code, chapter + 1 <= book.chapters ? chapter + 1 : 0);
    prefetchStaticChapter(book.code, chapter - 1);
  }, [book.code, book.chapters, chapter]);

  // Reset per-chapter UI state on navigation, applying any pending cross-chapter
  // occurrence focus set by a "step through" jump.
  useEffect(() => {
    setActiveWord(null);
    setActiveWordEl(null);
    setCurrentVerse(1);
    setGreekScrollVerse(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id, chapter]);

  // Clear transient selections when Translate or the mode changes.
  useEffect(() => {
    if (mode !== "reading") {
      setActiveWord(null);
      setActiveWordEl(null);
    }
  }, [mode]);

  // Showing/hiding the translation boxes or the English line, or changing the
  // display size/font/spacing/BSB, moves the Greek text; close the word bubble so
  // its fixed position no longer mismatches the word.
  useEffect(() => {
    setActiveWord(null);
    setActiveWordEl(null);
  }, [translateOn, englishOn, settings.fontSizeIndex, settings.fontFamily, settings.lineSpacing, settings.showBsb]);

  // The translation boxes sit between verses, so typing in one (or opening a
  // split / notes field) grows it and shifts every word below. A bubble fixed to
  // a word would be left behind, so it closes as soon as the learner works in a
  // box, the same way it closes when the page scrolls.
  useEffect(() => {
    function onFocusIn(e) {
      if (e.target?.closest?.("[data-translate-box]")) closeBubble();
    }
    function onClick(e) {
      if (e.target?.closest?.("[data-translate-box]")) closeBubble();
    }
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("click", onClick);
    };
  }, [closeBubble]);

  // A window resize also invalidates the bubble's fixed position.
  useEffect(() => {
    function onResize() {
      setActiveWord(null);
      setActiveWordEl(null);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!focusBracket) return;
    const t = setTimeout(() => setFocusBracket(null), 2500);
    return () => clearTimeout(t);
  }, [focusBracket]);

  // Escape closes the menu first, then the word panel. Not while typing.
  useEffect(() => {
    function onKey(e) {
      if (e.key !== "Escape") return;
      if (menuOpen) {
        setMenuOpen(false);
        return;
      }
      if (mode !== "reading") return;
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      setActiveWord(null);
      setActiveWordEl(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mode, menuOpen]);

  const activateWord = useCallback((w, el) => {
    setCurrentVerse(w.verse);
    setActiveWord(w);
    setActiveWordEl(el);
  }, []);

  function handleModeChange(m) {
    if (m === "learning" && !isAuthenticated) {
      setSignInOpen(true);
      return;
    }
    setMode(m);
    setActiveWord(null);
    setActiveWordEl(null);
  }

  const handleVerseNav = useCallback((v) => {
    setCurrentVerse(v);
    setGreekScrollVerse(v);
  }, []);

  const onAddBracket = useCallback(
    (verse, br) => {
      onMutate(verse, (a) => {
        if (!canAddBracket(a.brackets || [], br)) return a;
        return { ...a, brackets: [...(a.brackets || []), br] };
      });
    },
    [onMutate]
  );
  const onBracketClickReading = useCallback((br, verse) => {
    setCurrentVerse(verse);
    setFocusBracket({ verse, id: br.id });
  }, []);

  // Everything the per-verse translation boxes need. One memoized object so the
  // memoized verses only re-render when an annotation or focus actually changes.
  const translate = useMemo(
    () =>
      translateOn
        ? { annotations, book, chapter, isAuthenticated, onMutate, focusBracket, onFocusBracket: setFocusBracket }
        : null,
    [translateOn, annotations, book, chapter, isAuthenticated, onMutate, focusBracket]
  );

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      <ReadingHeader
        book={book}
        chapter={chapter}
        mode={mode}
        onModeChange={handleModeChange}
        onOpenMenu={() => setMenuOpen(true)}
        englishOn={englishOn}
        onToggleEnglish={toggleEnglish}
        translateOn={translateOn}
        onToggleTranslate={toggleTranslate}
      />
      <StudyMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        book={book}
        chapter={chapter}
        mode={mode}
        onModeChange={handleModeChange}
      />
      <main className="flex min-h-0 flex-1">
        <section className="relative flex min-h-0 flex-1 flex-col">
          {mode === "diagramming" && diagramPassage ? (
            <DiagrammingScreen passage={diagramPassage} />
          ) : (
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-6 py-10">
              {mode === "diagramming" ? (
                <DiagrammingPlaceholder onNewDiagram={() => setDiagramDialogOpen(true)} />
              ) : (
                <>
                  <div className="mb-6 flex items-baseline justify-between border-b border-border pb-3">
                    <span className="small-caps">Greek · SBLGNT</span>
                    <span className="font-heading text-sm text-foreground">
                      {book.greek} {chapter}
                    </span>
                  </div>
                  {learning && <LearningBanner />}
                  <GreekText
                    words={words}
                    selectedWordId={activeWord?.id}
                    onWordActivate={activateWord}
                    onVerseNumberClick={handleVerseNav}
                    currentVerse={translateOn ? currentVerse : null}
                    scrollToVerse={greekScrollVerse}
                    tone={learning ? "learning" : "reading"}
                    enableSelection={enableSelection}
                    bracketsByVerse={translateOn && mode === "reading" ? annotations : null}
                    onAddBracket={onAddBracket}
                    onBracketClick={onBracketClickReading}
                    focusBracket={focusBracket}
                    morphMap={morphMap}
                    english={english}
                    englishOn={englishOn}
                    translate={translate}
                  />
                </>
              )}
            </div>
          </div>
          )}
        </section>
      </main>

      {learning ? (
        <LearningBubble
          word={activeWord}
          anchorEl={activeWordEl}
          onClose={closeBubble}
          words={words}
          book={book}
          chapter={chapter}
          options={options}
          onSelectWord={activateWord}
          rightInset={0}
          scrollContainerRef={scrollRef}
          isMobile={isMobile}
        />
      ) : mode === "reading" ? (
        <WordDetailPopover
          word={activeWord}
          anchorEl={activeWordEl}
          scrollContainerRef={scrollRef}
          onClose={closeBubble}
          isMobile={isMobile}
          rightInset={0}
          words={words}
          morph={morph}
        />
      ) : null}

      <NewDiagramDialog
        open={diagramDialogOpen}
        onOpenChange={setDiagramDialogOpen}
        onConfirm={(p) => setDiagramPassage(p)}
      />
      <SignInPrompt open={signInOpen} onOpenChange={setSignInOpen} onSignIn={navigateToLogin} />
    </div>
  );
}