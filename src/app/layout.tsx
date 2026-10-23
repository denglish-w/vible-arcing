import type { Metadata } from "next";
import { EB_Garamond, Gentium_Plus, Cardo, GFS_Didot } from "next/font/google";
import { ThemeSync } from "@/components/theme-sync";
import "./globals.css";
const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin", "greek", "greek-ext"],
});
const gentium = Gentium_Plus({
  variable: "--font-gentium",
  weight: ["400", "700"],
  subsets: ["latin", "greek", "greek-ext"],
  preload: false,
});
const cardo = Cardo({
  variable: "--font-cardo",
  weight: ["400", "700"],
  subsets: ["latin", "greek", "greek-ext"],
  preload: false,
});
const didot = GFS_Didot({
  variable: "--font-didot",
  weight: "400",
  subsets: ["latin", "greek", "greek-ext"],
  preload: false,
});
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
