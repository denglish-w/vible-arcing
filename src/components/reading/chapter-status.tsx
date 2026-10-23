import Link from "next/link";

export function ChapterLoading() {
  return <output>Loading Greek text…</output>;
}
export function ChapterUnavailable() {
  return (
    <section className="unavailable">
      <h2>Text not yet available</h2>
      <p>
        This chapter’s Greek text could not be loaded. Philippians 1 is
        available to read.
      </p>
      <Link href="/read/php/1">Read Philippians 1</Link>
    </section>
  );
}
