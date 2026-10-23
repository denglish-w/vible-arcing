import Link from "next/link";
import type { ReactNode } from "react";

export function ChiRho() {
  return (
    <svg
      viewBox="0 0 44 30"
      className="chi-rho"
      aria-hidden="true"
      focusable="false"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 26V4C29 4 29 12 22 12M13 11L31 21M31 11L13 21" />
      </g>
      <g fill="currentColor" fontSize="13" textAnchor="middle">
        <text x="6.5" y="20">
          Α
        </text>
        <text x="37.5" y="20">
          Ω
        </text>
      </g>
    </svg>
  );
}
export function Logo() {
  return (
    <Link href="/" className="logo">
      <ChiRho />
      <span>[Product Name]</span>
    </Link>
  );
}
export function SiteFooter() {
  return (
    <footer className="site-footer">
      Greek text: SBLGNT · Morphology: MACULA ·{" "}
      <Link href="/credits">Credits &amp; licences</Link>
    </footer>
  );
}
export function PageShell({
  children,
  narrow = false,
}: {
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <div className="page-shell">
      <header className="page-header">
        <Logo />
      </header>
      <main id="main" className={`content ${narrow ? "content-narrow" : ""}`}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
export function LabelStrip({
  left,
  right,
}: {
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <div className="label-strip">
      <span className="small-caps">{left}</span>
      <span>{right}</span>
    </div>
  );
}
