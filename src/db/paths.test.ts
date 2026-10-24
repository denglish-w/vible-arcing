import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { dataPaths, resolveDataDir } from "./paths.ts";

const root = path.resolve("/srv/vible-arcing");
const standalone = path.join(root, ".next", "standalone");

describe("resolveDataDir", () => {
  it("defaults to <cwd>/data from the project root", () => {
    expect(resolveDataDir({}, root)).toBe(path.join(root, "data"));
  });

  it("uses DATA_DIR when set, whatever the working directory", () => {
    const dir = path.resolve("/var/lib/vible/data");
    expect(resolveDataDir({ DATA_DIR: dir }, root)).toBe(dir);
    expect(resolveDataDir({ DATA_DIR: dir }, standalone)).toBe(dir);
  });

  it("makes a relative DATA_DIR absolute", () => {
    expect(resolveDataDir({ DATA_DIR: "data" }, root)).toBe(
      path.join(root, "data"),
    );
  });

  it("ignores a blank DATA_DIR", () => {
    expect(resolveDataDir({ DATA_DIR: "  " }, root)).toBe(
      path.join(root, "data"),
    );
  });

  it("refuses a data directory inside .next/standalone", () => {
    expect(() => resolveDataDir({}, standalone)).toThrow(/DATA_DIR/);
    expect(() => resolveDataDir({}, path.join(standalone, "sub"))).toThrow(
      /DATA_DIR/,
    );
    expect(() => resolveDataDir({ DATA_DIR: "data" }, standalone)).toThrow(
      /DATA_DIR/,
    );
    expect(() =>
      resolveDataDir({ DATA_DIR: path.join(standalone, "data") }, root),
    ).toThrow(/DATA_DIR/);
  });

  it("matches .next/standalone regardless of case", () => {
    expect(() =>
      resolveDataDir({}, path.join(root, ".Next", "Standalone")),
    ).toThrow(/DATA_DIR/);
  });

  it("does not mistake a similarly named directory for standalone output", () => {
    const other = path.join(root, ".next", "standalone-notes");
    expect(resolveDataDir({}, other)).toBe(path.join(other, "data"));
  });

  it("defaults from the real working directory", () => {
    expect(resolveDataDir({})).toBe(path.join(process.cwd(), "data"));
  });
});

describe("resolveDataDir run as a process", () => {
  const tmp = realpathSync(mkdtempSync(path.join(tmpdir(), "vible-paths-")));
  const standaloneDir = path.join(tmp, ".next", "standalone");
  mkdirSync(standaloneDir, { recursive: true });
  const script = `import { resolveDataDir } from ${JSON.stringify(pathToFileURL(path.join(import.meta.dirname, "paths.ts")).href)};
console.log(resolveDataDir());`;

  function run(cwd: string, env: Record<string, string> = {}) {
    const childEnv: NodeJS.ProcessEnv = {
      ...process.env,
      ...env,
    };
    if (!("DATA_DIR" in env)) delete childEnv.DATA_DIR;
    return execFileSync(
      process.execPath,
      ["--input-type=module", "-e", script],
      {
        cwd,
        env: childEnv,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    ).trim();
  }

  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  it("defaults to <cwd>/data from the project root", () => {
    expect(run(tmp)).toBe(path.join(tmp, "data"));
  });

  it("fails inside .next/standalone without DATA_DIR", () => {
    expect(() => run(standaloneDir)).toThrow(/DATA_DIR/);
  });

  it("uses DATA_DIR inside .next/standalone", () => {
    expect(run(standaloneDir, { DATA_DIR: path.join(tmp, "data") })).toBe(
      path.join(tmp, "data"),
    );
  });
});

describe("dataPaths", () => {
  it("puts both databases and the backups beside each other", () => {
    const dir = path.join(root, "data");
    expect(dataPaths(dir)).toEqual({
      dataDir: dir,
      corpus: path.join(dir, "corpus.sqlite"),
      app: path.join(dir, "app.sqlite"),
      backups: path.join(dir, "backups"),
    });
  });
});
