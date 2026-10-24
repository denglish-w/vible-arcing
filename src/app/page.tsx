import Link from "next/link";
import { GROUPS, booksInGroup } from "@/lib/books";
import { connection } from "next/server";
import { PageShell, LabelStrip } from "@/components/site-shell";
import { listBooks } from "@/db/corpus";
import { readCorpus } from "@/app/corpus-store";

export default async function ContentsPage() {
  await connection();
  const summaries = await readCorpus(listBooks);
  const availableCount = new Map(
    summaries?.map((entry) => [entry.code, entry.available.length]),
  );
  return (
    <PageShell>
      <LabelStrip left="Contents" right="SBLGNT" />
      <h1>The Greek New Testament</h1>
      <p className="intro">
        Read the SBL Greek New Testament and select any word to see its lemma,
        gloss and parsing. Choose a book to begin.
      </p>
      {!summaries && (
        <p role="note">
          The Greek text has not been installed on this server. Run{" "}
          <code>npm run db:seed</code> to install it.
        </p>
      )}
      <div className="book-groups">
        {GROUPS.map((group) => (
          <section key={group} aria-label={group}>
            <h2 className="small-caps">{group}</h2>
            <div className="book-grid">
              {booksInGroup(group).map((book) => (
                <Link
                  className="book-row"
                  href={`/book/${book.slug}`}
                  key={book.code}
                >
                  <span>{book.name}</span>
                  <span>
                    {book.chapters}{" "}
                    {book.chapters === 1 ? "chapter" : "chapters"}
                    {availableCount.get(book.code) === 0 &&
                      " · not yet available"}
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
