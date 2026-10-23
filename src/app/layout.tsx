import type { Metadata } from "next";
import { ThemeSync } from "@/components/theme-sync";
import { cardo, didot, garamond, gentium } from "./fonts";
import "./globals.css";
export const metadata: Metadata = {
  title: "The Greek New Testament",
  description:
    "Read the SBL Greek New Testament with word-level gloss and morphology.",
};
const themeScript = `try{var s=JSON.parse(localStorage.getItem('vible.display')||'null');var t=s&&s.state&&s.state.settings&&s.state.settings.theme;if(t==='dark'||t==='sepia')document.documentElement.classList.add(t)}catch{}`;
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${garamond.variable} ${gentium.variable} ${cardo.variable} ${didot.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}
