// Enforces the import rules in src/db/README.md that `tsc` cannot check, for every
// module that scripts/ load through Node's type stripping.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const srcDir = path.resolve(import.meta.dirname, "..");

// Next-facing entry points carry `server-only` on purpose and are never loaded by scripts.
const NEXT_ONLY = new Set([path.join(srcDir, "db", "server.ts")]);

const SHARED_ROOTS = [
  path.join(srcDir, "db"),
  path.join(srcDir, "lib", "corpus"),
  path.join(srcDir, "lib", "analysis"),
  path.join(srcDir, "lib", "books.ts"),
];

function sharedModules(): string[] {
  const files: string[] = [];
  const visit = (p: string) => {
    if (!existsSync(p)) return;
    if (statSync(p).isDirectory()) {
      for (const entry of readdirSync(p)) visit(path.join(p, entry));
    } else if (
      p.endsWith(".ts") &&
      !p.endsWith(".test.ts") &&
      !NEXT_ONLY.has(p)
    ) {
      files.push(p);
    }
  };
  SHARED_ROOTS.forEach(visit);
  return files;
}

// Static `import … from "x"`, `export … from "x"`, bare `import "x"` and dynamic `import("x")`.
const SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(?\s*)["']([^"']+)["']/g;

function importProblems(source: string): string[] {
  const problems: string[] = [];
  for (const [, spec] of source.matchAll(SPECIFIER)) {
    if (spec === "server-only") problems.push(`imports "server-only"`);
    else if (spec.startsWith("@/"))
      problems.push(`uses the @/ alias: "${spec}"`);
    else if (spec.startsWith(".") && !spec.endsWith(".ts"))
      problems.push(`relative import without .ts: "${spec}"`);
  }
  return problems;
}

describe("importProblems", () => {
  it("flags each rule", () => {
    expect(importProblems(`import "server-only";`)).toHaveLength(1);
    expect(importProblems(`import { a } from "@/lib/books";`)).toHaveLength(1);
    expect(importProblems(`import { a } from "./format";`)).toHaveLength(1);
    expect(importProblems(`export { a } from "../lib/books.js";`)).toHaveLength(
      1,
    );
    expect(importProblems(`const m = await import("./x");`)).toHaveLength(1);
  });

  it("accepts the allowed forms", () => {
    expect(
      importProblems(
        `import path from "node:path";\nimport type { A } from "./a.ts";\nimport { b } from "drizzle-orm";`,
      ),
    ).toEqual([]);
  });
});

describe("script-shared modules", () => {
  it.each(sharedModules().map((f) => [path.relative(srcDir, f), f]))(
    "%s follows the script import rules",
    (_name, file) => {
      expect(importProblems(readFileSync(file, "utf8"))).toEqual([]);
    },
  );
});
