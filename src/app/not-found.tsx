import Link from "next/link";
import { PageShell, LabelStrip } from "@/components/site-shell";
export default function NotFound() {
  return (
    <PageShell narrow>
      <LabelStrip left="Page not found" right="404" />
      <h1>This page could not be found.</h1>
      <p className="intro">Choose a book and chapter to return to the text.</p>
      <p>
        <Link href="/">Browse the New Testament</Link>
      </p>
    </PageShell>
  );
}
