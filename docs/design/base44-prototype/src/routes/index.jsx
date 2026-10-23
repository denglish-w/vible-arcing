import { createFileRoute, Link } from "@tanstack/react-router";
import Logo from "@/components/Logo";
import SiteFooter from "@/components/SiteFooter";
import { GROUPS, booksInGroup } from "@/lib/books";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Greek New Testament" },
      { name: "description", content: "Read the SBL Greek New Testament and select any word to see its lemma, parsing, gloss, and definition." },
    ],
  }),
  component: ContentsPage,
});

function ContentsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="mx-auto w-full max-w-5xl px-8 pt-8">
        <Logo />
      </header>
      <main className="mx-auto w-full max-w-5xl px-8 pt-10 pb-6 flex-1">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="small-caps">Contents</span>
          <span className="small-caps">SBLGNT</span>
        </div>
        <h1 className="mt-6 font-heading text-4xl text-foreground leading-tight">The Greek New Testament</h1>
        <p className="mt-3 max-w-2xl font-body text-[15px] leading-relaxed text-muted-foreground">
          Read the SBL Greek New Testament and select any word to see its lemma, parsing, gloss, and definition. Choose a book to begin.
        </p>
        <div className="mt-10 space-y-10">
          {GROUPS.map((group) => (
            <section key={group}>
              <h2 className="small-caps mb-3">{group}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10">
                {booksInGroup(group).map((book) => (
                  <Link
                    key={book.id}
                    to="/book/$bookId"
                    params={{ bookId: book.id }}
                    className="flex items-baseline justify-between border-b border-border/60 py-3 -mx-2 px-2 rounded transition-colors hover:bg-card/60"
                  >
                    <span className="font-heading text-lg text-foreground">{book.name}</span>
                    <span className="font-body text-sm text-muted-foreground">{book.chapters} chapters</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}