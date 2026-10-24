import Link from "next/link";

export function ChapterUnavailable() {
  return (
    <section className="unavailable">
      <h2>Text not yet available</h2>
      <p>
        This chapter’s Greek text has not been added yet. Philippians 1 is
        available to read.
      </p>
      <Link href="/read/php/1">Read Philippians 1</Link>
    </section>
  );
}

export function ChapterNotInstalled() {
  return (
    <section className="unavailable">
      <h2>Greek text not installed</h2>
      <p>
        The Greek text has not been installed on this server. Run{" "}
        <code>npm run db:seed</code> to install it.
      </p>
    </section>
  );
}
