// Shown in place of a saved-work page when the saved-work database cannot be
// opened. The error messages are path-free and say which command fixes it
// (src/db/README.md), so they are safe to show.
import { PageShell, LabelStrip } from "../site-shell";

export function StoreUnavailable({ error }: { error: Error }) {
  return (
    <PageShell narrow>
      <LabelStrip left="Saved work" right="Not available" />
      <h1>Saved work isn&rsquo;t available.</h1>
      <p className="intro">{error.message}</p>
    </PageShell>
  );
}
