import { Link } from "@tanstack/react-router";

export default function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-5xl px-8 py-10 text-center font-body text-xs text-muted-foreground">
      <div className="flex items-center justify-center gap-4">
        <Link to="/credits" className="text-primary underline-offset-2 hover:underline">Credits</Link>
        <span aria-hidden>·</span>
        <Link to="/privacy" className="text-primary underline-offset-2 hover:underline">Privacy Policy</Link>
      </div>
    </footer>
  );
}