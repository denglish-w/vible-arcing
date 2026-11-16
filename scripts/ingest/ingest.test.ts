// Runs scripts/ingest/ingest.py against small synthetic MACULA-shaped sources:
// the real 27 files are ~110 MB and are never committed. Checks the command's
// contract (specs/009-full-new-testament-text/contracts/ingest-cli.md): it
// writes every chapter, refuses bad input naming the file, and on failure
// leaves the output directory exactly as it was.
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BOOKS } from "../../src/lib/books.ts";

const script = path.join(import.meta.dirname, "ingest.py");
const COMMIT = "8423afe47b9e8f24b7772e808af45c7159a6fe7e";

type BookFile = [file: string, code: string, chapters: number];

function pythonBooks(): BookFile[] {
  const run = spawnSync(
    "python3",
    [
      "-I",
      "-c",
      "import importlib.util, json, sys\n" +
        "s = importlib.util.spec_from_file_location('ingest', sys.argv[1])\n" +
        "m = importlib.util.module_from_spec(s); s.loader.exec_module(m)\n" +
        "print(json.dumps(m.BOOKS))",
      script,
    ],
    { encoding: "utf8" },
  );
  if (run.status !== 0) throw new Error(run.stderr);
  return JSON.parse(run.stdout) as BookFile[];
}

const books = pythonBooks();

/** One word per chapter, with a MACULA-style id and reference. */
function bookXml(code: string, number: number, chapters: number): string {
  const words = Array.from({ length: chapters }, (_, i) => {
    const id = `n${String(number).padStart(2, "0")}${String(i + 1).padStart(3, "0")}001001`;
    return `<w xml:id="${id}" ref="${code} ${i + 1}:1!1" lemma="λόγος" class="noun" case="nominative" after=".">λόγος</w>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<book id="${code}">${words.join("")}</book>\n`;
}

let tmp: string;
let source: string;
let out: string;

beforeEach(() => {
  tmp = mkdtempSync(path.join(tmpdir(), "vible-ingest-"));
  source = path.join(tmp, "source");
  out = path.join(tmp, "out");
  mkdirSync(source);
  books.forEach(([file, code, chapters], i) =>
    writeFileSync(path.join(source, file), bookXml(code, i + 40, chapters)),
  );
});
afterEach(() => rmSync(tmp, { recursive: true, force: true }));

const ingest = (commit = COMMIT) =>
  spawnSync(
    "python3",
    ["-I", script, "--source", source, "--commit", commit, "--out", out],
    { encoding: "utf8" },
  );

function snapshot(dir: string): Record<string, string> {
  return Object.fromEntries(
    readdirSync(dir, { recursive: true, encoding: "utf8" })
      .filter((f) => f.endsWith(".json"))
      .sort()
      .map((f) => [f, readFileSync(path.join(dir, f), "utf8")]),
  );
}

describe("ingest.py", () => {
  it("lists the same 27 books and chapter counts as src/lib/books.ts", () => {
    expect(books.map(([, code, n]) => [code, n])).toEqual(
      BOOKS.map((b) => [b.code, b.chapters]),
    );
  });

  it("writes every chapter and the attribution, identically on a re-run", () => {
    const run = ingest();
    expect(run.stderr).toBe("");
    expect(run.status).toBe(0);
    expect(run.stdout).toContain("wrote 27 books, 260 chapters, 260 words");
    const first = snapshot(out);
    expect(Object.keys(first)).toHaveLength(261);
    const mat1 = JSON.parse(first[path.join("MAT", "1.json")]);
    expect(mat1).toMatchObject({
      book: "MAT",
      chapter: 1,
      source: { commit: COMMIT },
    });
    expect(mat1.words[0]).toEqual({
      id: "n40001001001",
      v: 1,
      text: "λόγος",
      after: ". ",
      lemma: "λόγος",
      pos: "noun",
      m: { case: "nominative" },
    });
    expect(ingest().status).toBe(0);
    expect(snapshot(out)).toEqual(first);
    expect(existsSync(`${out}.new`) || existsSync(`${out}.old`)).toBe(false);
  });

  // Each case breaks the source after a good run, then checks the error names
  // the problem and the previous output is untouched.
  const failures: [string, () => void, RegExp][] = [
    [
      "a missing book file",
      () => rmSync(path.join(source, "27-revelation.xml")),
      /27-revelation\.xml is missing/,
    ],
    [
      "a book with too few chapters",
      () =>
        writeFileSync(
          path.join(source, "01-matthew.xml"),
          bookXml("MAT", 40, 27),
        ),
      /01-matthew\.xml has 27 chapters, expected 28/,
    ],
    [
      "a file holding another book",
      () =>
        writeFileSync(path.join(source, "02-mark.xml"), bookXml("LUK", 41, 16)),
      /02-mark\.xml holds LUK, expected MRK/,
    ],
    [
      "malformed XML",
      () =>
        writeFileSync(
          path.join(source, "18-philemon.xml"),
          '<book id="PHM"><w',
        ),
      /18-philemon\.xml is not well-formed XML/,
    ],
    [
      "a DTD",
      () =>
        writeFileSync(
          path.join(source, "18-philemon.xml"),
          '<!DOCTYPE book [<!ENTITY x "y">]>' + bookXml("PHM", 57, 1),
        ),
      /18-philemon\.xml declares a DTD or entities/,
    ],
    [
      "markup characters in a word",
      () =>
        writeFileSync(
          path.join(source, "18-philemon.xml"),
          bookXml("PHM", 57, 1).replace(">λόγος</w>", ">λό&lt;γος</w>"),
        ),
      /18-philemon\.xml: word n57001001001 has markup characters in text/,
    ],
  ];

  for (const [name, breakSource, message] of failures) {
    it(`stops on ${name} and leaves the output as it was`, () => {
      expect(ingest().status).toBe(0);
      const before = snapshot(out);
      breakSource();
      const run = ingest();
      expect(run.status).toBe(1);
      expect(run.stderr).toMatch(message);
      expect(snapshot(out)).toEqual(before);
      expect(existsSync(`${out}.new`) || existsSync(`${out}.old`)).toBe(false);
    });
  }

  it("restores output left in <out>.old by an interrupted swap", () => {
    expect(ingest().status).toBe(0);
    const before = snapshot(out);
    rmSync(path.join(source, "27-revelation.xml"));
    // As if a previous run stopped between its two renames.
    spawnSync("mv", [out, `${out}.old`]);
    expect(ingest().status).toBe(1);
    expect(snapshot(out)).toEqual(before);
  });

  it("refuses a commit that is not a full SHA", () => {
    const run = ingest("abc123");
    expect(run.status).toBe(2);
    expect(existsSync(out)).toBe(false);
  });
});
