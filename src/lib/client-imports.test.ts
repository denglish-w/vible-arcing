// Client components must never reach the databases (src/db/README.md, design
// decision 6). `server-only` stops the build for src/db/server.ts; this also
// covers the core modules under src/db and the native driver, following imports
// through any number of modules in src/.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const srcDir = path.resolve(import.meta.dirname, "..");
const dbDir = path.join(srcDir, "db");
const SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(?\s*)["']([^"']+)["']/g;
const EXTENSIONS = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const p = path.join(dir, entry);
    if (statSync(p).isDirectory()) return sourceFiles(p);
    return /\.tsx?$/.test(p) && !/\.(test|stories)\.tsx?$/.test(p) ? [p] : [];
  });
}

function isClientModule(source: string): boolean {
  return isDirective(source, "use client");
}

function isDirective(source: string, directive: string): boolean {
  // The directive must come before any other statement; comments may precede it.
  const body = source.replace(
    /^(?:\s*(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/))*\s*/,
    "",
  );
  return body.startsWith(`"${directive}"`) || body.startsWith(`'${directive}'`);
}

/** The file a specifier resolves to inside src/, or the bare package name. */
function resolve(from: string, specifier: string): string {
  let base: string | undefined;
  if (specifier.startsWith("@/")) base = path.join(srcDir, specifier.slice(2));
  else if (specifier.startsWith("."))
    base = path.resolve(path.dirname(from), specifier);
  if (!base) return specifier;
  for (const ext of EXTENSIONS) {
    const candidate = base + ext;
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return base;
}

/** A chain of imports from `start` to the database or its driver, if any. */
function pathToDatabase(start: string): string[] | null {
  const seen = new Set<string>();
  const walk = (file: string, chain: string[]): string[] | null => {
    if (file === "better-sqlite3" || file.startsWith(dbDir + path.sep))
      return [...chain, file];
    if (!file.startsWith(srcDir) || seen.has(file) || !existsSync(file))
      return null;
    seen.add(file);
    const source = readFileSync(file, "utf8");
    // A client importing a server action gets an RPC reference, not the module.
    if (file !== start && isDirective(source, "use server")) return null;
    for (const [, specifier] of source.matchAll(SPECIFIER)) {
      const found = walk(resolve(file, specifier), [...chain, file]);
      if (found) return found;
    }
    return null;
  };
  return walk(start, []);
}

describe("client modules", () => {
  const clients = sourceFiles(srcDir).filter((file) =>
    isClientModule(readFileSync(file, "utf8")),
  );

  it("are found", () => {
    expect(clients.length).toBeGreaterThan(0);
  });

  it.each(clients.map((file) => [path.relative(srcDir, file), file]))(
    "%s does not import the databases",
    (_, file) => {
      const chain = pathToDatabase(file);
      expect(chain?.map((p) => path.relative(srcDir, p))).toBeUndefined();
    },
  );

  it("resolve aliases, relative paths and directives", () => {
    // No client module reaches the database today, so check the pieces.
    const here = path.join(srcDir, "lib", "example.ts");
    expect(resolve(here, "@/db/server")).toBe(path.join(dbDir, "server.ts"));
    expect(resolve(here, "../db/work.ts")).toBe(path.join(dbDir, "work.ts"));
    expect(pathToDatabase(path.join(dbDir, "server.ts"))).not.toBeNull();
    expect(isClientModule('// note\n"use client";\nimport x from "y";')).toBe(
      true,
    );
    expect(isClientModule('import x from "y";\n"use client";')).toBe(false);
    expect(
      isDirective("'use server';\nexport async function a() {}", "use server"),
    ).toBe(true);
  });
});
