import { afterEach, describe, expect, it, vi } from "vitest";

// server.ts is Next-only: stub the guard module and the request headers, and
// replace the connections so no database file is needed.
vi.mock("server-only", () => ({}));
const requestHeaders = vi.hoisted(() => ({ current: new Headers() }));
vi.mock("next/headers", () => ({
  headers: async () => requestHeaders.current,
}));
const connections = vi.hoisted(() => ({
  getAppDb: vi.fn<() => string>(() => "app"),
  getCorpusDb: vi.fn<() => string>(() => "corpus"),
}));
vi.mock("./client.ts", async (original) => ({
  ...(await original<typeof import("./client.ts")>()),
  ...connections,
}));

const { appDb, corpusDb, HostNotAllowedError } = await import("./server.ts");

afterEach(() => vi.clearAllMocks());

describe("src/db/server.ts", () => {
  it("opens the databases for this computer's hosts", async () => {
    requestHeaders.current = new Headers({ host: "localhost:3000" });
    expect(await appDb()).toBe("app");
    expect(await corpusDb()).toBe("corpus");
  });

  it("refuses other hosts before touching either database", async () => {
    requestHeaders.current = new Headers({ host: "evil.example" });
    await expect(appDb()).rejects.toThrow(HostNotAllowedError);
    await expect(corpusDb()).rejects.toThrow(HostNotAllowedError);
    expect(connections.getAppDb).not.toHaveBeenCalled();
    expect(connections.getCorpusDb).not.toHaveBeenCalled();
  });
});
