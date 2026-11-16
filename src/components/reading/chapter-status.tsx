export function ChapterUnavailable() {
  return (
    <section className="unavailable">
      <h2>Text not available</h2>
      <p>
        This chapter is missing from the installed Greek text, which is out of
        date. Run <code>npm run db:seed</code> to rebuild it.
      </p>
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
