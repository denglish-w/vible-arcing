import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
async function loader() {
  vi.resetModules();
  return (await import("./load")).loadChapter;
}
const fixture = () =>
  JSON.parse(
    readFileSync(
      new URL("../../../public/corpus/v1/PHP/1.json", import.meta.url),
      "utf8",
    ),
  );
const missing = () => ({ ok: false, status: 404 });
const available = () => ({
  ok: true,
  status: 200,
  json: async () => fixture(),
});
describe("chapter loading", () => {
  it("caches missing chapter promises and prefetches adjacent chapters across book boundaries", async () => {
    const fetcher = vi
      .fn<(url: string) => Promise<{ ok: boolean; status: number }>>()
      .mockResolvedValue(missing());
    const diagnostic = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", fetcher);
    const loadChapter = await loader();
    const first = loadChapter("mat", 28);
    expect(loadChapter("mat", 28)).toBe(first);
    expect(await first).toEqual({ status: "unavailable", reason: "not-found" });
    expect(loadChapter("mat", 28)).toBe(first);
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      "/corpus/v1/MAT/28.json",
      "/corpus/v1/MAT/27.json",
      "/corpus/v1/MRK/1.json",
    ]);
    expect(diagnostic).not.toHaveBeenCalled();
  });
  it("retains successful chapter promises", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes("PHP/1.json") ? available() : missing(),
      ),
    );
    const loadChapter = await loader();
    const first = loadChapter("php", 1);
    expect(await first).toMatchObject({
      status: "available",
      chapter: { book: "PHP" },
    });
    expect(loadChapter("php", 1)).toBe(first);
  });
  it("reports malformed JSON, invalid shape and mismatched passage with their cause", async () => {
    const diagnostic = vi.spyOn(console, "error").mockImplementation(() => {});
    for (const json of [
      async () => {
        throw new SyntaxError("Unexpected token");
      },
      async () => ({ format: 9 }),
      async () => ({ ...fixture(), chapter: 2 }),
    ]) {
      vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string) =>
          url.includes("PHP/1.json")
            ? { ok: true, status: 200, json }
            : missing(),
        ),
      );
      expect(await (await loader())("php", 1)).toEqual({
        status: "unavailable",
        reason: "invalid-data",
      });
    }
    expect(diagnostic).toHaveBeenCalledTimes(3);
    expect(diagnostic).toHaveBeenNthCalledWith(
      1,
      "Invalid corpus chapter php/1",
      expect.any(SyntaxError),
    );
    expect(diagnostic).toHaveBeenNthCalledWith(
      2,
      "Invalid corpus chapter php/1",
      expect.objectContaining({ message: "Invalid corpus chapter" }),
    );
    expect(diagnostic).toHaveBeenNthCalledWith(
      3,
      "Invalid corpus chapter php/1",
      expect.objectContaining({ message: "Expected PHP 1, received PHP 2" }),
    );
  });
  it("evicts transient network failures so a later visit can recover", async () => {
    let attempts = 0;
    const diagnostic = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (!url.includes("PHP/1.json")) return missing();
        if (attempts++ === 0) throw new Error("offline");
        return available();
      }),
    );
    const loadChapter = await loader();
    expect(await loadChapter("php", 1)).toEqual({
      status: "unavailable",
      reason: "network",
    });
    expect(await loadChapter("php", 1)).toMatchObject({ status: "available" });
    expect(attempts).toBe(2);
    expect(diagnostic).not.toHaveBeenCalled();
  });
  it("reports unexpected HTTP status and retries server failures", async () => {
    let attempts = 0;
    const diagnostic = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (!url.includes("PHP/1.json")) return missing();
        return attempts++ === 0 ? { ok: false, status: 503 } : available();
      }),
    );
    const loadChapter = await loader();
    expect(await loadChapter("php", 1)).toEqual({
      status: "unavailable",
      reason: "http",
      httpStatus: 503,
    });
    expect(await loadChapter("php", 1)).toMatchObject({ status: "available" });
    expect(attempts).toBe(2);
    expect(diagnostic).toHaveBeenCalledExactlyOnceWith(
      "Could not load corpus chapter php/1",
      expect.objectContaining({ message: "HTTP 503" }),
    );
  });
  it("retains non-transient HTTP errors with diagnostics", async () => {
    const diagnostic = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes("PHP/1.json") ? { ok: false, status: 403 } : missing(),
      ),
    );
    const loadChapter = await loader();
    const first = loadChapter("php", 1);
    expect(await first).toEqual({
      status: "unavailable",
      reason: "http",
      httpStatus: 403,
    });
    expect(loadChapter("php", 1)).toBe(first);
    expect(diagnostic).toHaveBeenCalledExactlyOnceWith(
      "Could not load corpus chapter php/1",
      expect.objectContaining({ message: "HTTP 403" }),
    );
  });
  it("does not request invalid chapter locations", async () => {
    const fetcher = vi.fn<(url: string) => Promise<unknown>>();
    vi.stubGlobal("fetch", fetcher);
    const loadChapter = await loader();
    expect(await loadChapter("missing", 1)).toEqual({
      status: "unavailable",
      reason: "not-found",
    });
    expect(await loadChapter("php", 5)).toEqual({
      status: "unavailable",
      reason: "not-found",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
