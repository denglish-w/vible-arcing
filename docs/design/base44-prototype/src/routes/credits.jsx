import { createFileRoute, Link } from "@tanstack/react-router";
import Logo from "@/components/Logo";
import SiteFooter from "@/components/SiteFooter";

export const Route = createFileRoute("/credits")({
  head: () => ({ meta: [{ title: "Credits — The Greek New Testament" }] }),
  component: CreditsPage,
});

function CreditsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="mx-auto w-full max-w-3xl px-8 pt-8">
        <Logo />
      </header>
      <main className="mx-auto w-full max-w-3xl px-8 pt-8 pb-6 flex-1">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="small-caps">Credits</span>
          <Link to="/" className="small-caps text-primary hover:underline">Back</Link>
        </div>
        <h1 className="mt-6 font-heading text-3xl text-foreground">Credits &amp; Licenses</h1>
        <div className="mt-6 space-y-6 font-body text-[15px] leading-relaxed text-foreground/90">
          <section>
            <h2 className="font-heading text-xl text-foreground">SBL Greek New Testament</h2>
            <p className="mt-2">
              The Greek text is the <strong>SBL Greek New Testament (SBLGNT)</strong>, edited by{" "}
              <strong>Michael W. Holmes</strong>, published by the{" "}
              <strong>Society of Biblical Literature</strong> and{" "}
              <strong>Logos Bible Software</strong>. It is licensed under{" "}
              <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                Creative Commons Attribution 4.0 International (CC BY 4.0)
              </a>.
            </p>
            <p className="mt-2">The text has been modified to add parsing and morphological information.</p>
          </section>
          <section>
            <h2 className="font-heading text-xl text-foreground">MACULA Greek Linguistic Datasets</h2>
            <p className="mt-2">
              Lemma, morphology, and gloss data are from the{" "}
              <strong>MACULA Greek Linguistic Datasets</strong>, licensed under{" "}
              <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                CC BY 4.0
              </a>.
            </p>
          </section>
          <section>
            <h2 className="font-heading text-xl text-foreground">Berean Standard Bible</h2>
            <p className="mt-2">The English translation is the <strong>Berean Standard Bible</strong>, which is in the public domain.</p>
          </section>
          <section>
            <h2 className="font-heading text-xl text-foreground">Dodson Greek Lexicon</h2>
            <p className="mt-2">Definitions are from the <strong>Dodson Greek Lexicon</strong>, which is in the public domain.</p>
          </section>
          <section className="border-t border-border pt-4">
            <p className="text-muted-foreground">
              This platform is not affiliated with or endorsed by the Society of Biblical Literature,
              Logos Bible Software, Faithlife, or the authors of any source.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}