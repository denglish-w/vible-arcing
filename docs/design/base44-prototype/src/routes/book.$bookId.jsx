import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import Logo from "@/components/Logo";
import { getBook } from "@/lib/books";

export const Route = createFileRoute("/book/$bookId")({
  loader: ({ params }) => {
    const book = getBook(params.bookId);
    if (!book) throw notFound();
    return { book };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.book?.name ?? "Book"} — The Greek New Testament` }],
  }),
  component: ChapterPicker,
});

function ChapterPicker() {
  const { book } = Route.useLoaderData();
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="mx-auto w-full max-w-5xl px-8 pt-8">
        <Logo />
      </header>
      <main className="mx-auto w-full max-w-3xl px-8 pt-8 pb-6 flex-1">
        <div className="flex items-center justify-between">
          <Link to="/" className="font-body text-sm font-medium text-primary hover:underline">← All books</Link>
          <span className="font-heading text-lg text-foreground">{book.greek}</span>
        </div>
        <h1 className="mt-8 font-heading text-5xl text-foreground leading-tight">{book.name}</h1>
        <p className="mt-2 font-body text-[15px] text-muted-foreground">Choose a chapter.</p>
        <div className="mt-8 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-3">
          {chapters.map((n) => (
            <Link
              key={n}
              to="/read/$bookId/$chapter"
              params={{ bookId: book.id, chapter: String(n) }}
              className="aspect-square flex items-center justify-center rounded-md bg-card font-heading text-lg text-foreground shadow-[0_1px_2px_rgba(43,38,32,0.05),0_6px_16px_-10px_rgba(43,38,32,0.18)] transition-colors hover:text-primary"
            >
              {n}
            </Link>
          ))}
        </div>
      </main>
      <footer className="mx-auto w-full max-w-3xl px-8 pb-10 pt-6 font-body text-xs text-muted-foreground">
        Greek text: SBLGNT (CC BY 4.0). Morphology: MACULA (CC BY 4.0).{" "}
        <Link to="/credits" className="text-primary underline underline-offset-2">Credits</Link>
      </footer>
    </div>
  );
}