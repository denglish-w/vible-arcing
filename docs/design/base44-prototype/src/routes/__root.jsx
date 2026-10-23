import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { DefaultCatchBoundary } from "@/components/DefaultCatchBoundary";
import { NotFound } from "@/components/NotFound";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/AuthContext";
import { StudySettingsProvider } from "@/components/study/StudySettingsProvider";
import { Base44Scripts } from "base44:document";
import appCss from "@/index.css?url";

export const Route = createRootRoute({
  // Per-page <title>/meta come from each route's head(); this is the shared base.
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "The Greek New Testament" },
      { name: "description", content: "Read and study the SBL Greek New Testament: lemma, parsing, gloss, and definition for every word." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 28'%3E%3Cg fill='none' stroke='%23842020' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='12' y1='26' x2='12' y2='2'/%3E%3Cpath d='M12 2 C 19 2 19 9 12 9'/%3E%3Cline x1='4' y1='9.5' x2='20' y2='21.5'/%3E%3Cline x1='20' y1='9.5' x2='4' y2='21.5'/%3E%3C/g%3E%3C/svg%3E" },
    ],
  }),
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: () => <NotFound />,
  shellComponent: RootDocument,
  component: RootComponent,
});

function RootComponent() {
  return (
    <AuthProvider>
      <StudySettingsProvider>
        <Outlet />
        <Toaster />
      </StudySettingsProvider>
    </AuthProvider>
  );
}

// The document. There is no index.html: the server renders <html> from here.
function RootDocument({ children }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      {/* data-react-root: the builder's preview bridge looks for #root and falls back to this. */}
      <body data-react-root="true">
        {children}
        <Base44Scripts />
        <Scripts />
      </body>
    </html>
  );
}