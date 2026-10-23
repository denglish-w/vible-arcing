import Link from "next/link";
import { GROUPS, booksInGroup } from "@/lib/books";
import { PageShell, LabelStrip } from "@/components/site-shell";
export default function ContentsPage() {
  return (
    <PageShell>
      <LabelStrip left="Contents" right="SBLGNT" />
      <h1>The Greek New Testament</h1>
      <p className="intro">
        Read the SBL Greek New Testament and select any word to see its lemma,
        gloss and parsing. Choose a book to begin.
      </p>
      <div className="book-groups">
        {GROUPS.map((group) => (
          <section key={group} aria-label={group}>
            <h2 className="small-caps">{group}</h2>
            <div className="book-grid">
              {booksInGroup(group).map((book) => (
                <Link
                  className="book-row"
                  href={`/book/${book.code}`}
                  key={book.code}
                >
                  <span>{book.name}</span>
                  <span>
                    {book.chapters}{" "}
                    {book.chapters === 1 ? "chapter" : "chapters"}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
