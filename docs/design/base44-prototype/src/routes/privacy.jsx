import { createFileRoute, Link } from "@tanstack/react-router";
import Logo from "@/components/Logo";
import SiteFooter from "@/components/SiteFooter";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — The Greek New Testament" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="mx-auto w-full max-w-3xl px-8 pt-8">
        <Logo />
      </header>
      <main className="mx-auto w-full max-w-3xl px-8 pt-8 pb-6 flex-1">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="small-caps">Privacy</span>
          <Link to="/" className="small-caps text-primary hover:underline">Back</Link>
        </div>
        <h1 className="mt-6 font-heading text-3xl text-foreground">Privacy Policy</h1>
        <div className="mt-6 space-y-4 font-body text-[15px] leading-relaxed text-foreground/90">
          <p>
            This app stores, for each registered user, the following information: your name, your email
            address, your Learning mode results (the passages and words you studied, your answers, and
            whether each was matched or disputed), your personal translations, your notes, and your
            display settings.
          </p>
          <p>
            Your name and email are used to create and sign in to your account and to identify you across
            your devices. Your Learning mode results, translations, notes, and display settings are used
            to show your work back to you and to sync it across your devices.
          </p>
          <p>Your information is never sold and is never shared with third parties.</p>
          <p>
            You can delete your account and all of its associated data at any time using “Delete my
            account” on the Progress page.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}