import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// assertAllowedHost reads the request's headers through next/headers.
const requestHeaders = vi.hoisted(() => ({ current: new Headers() }));
vi.mock("next/headers", () => ({
  headers: async () => requestHeaders.current,
}));

const { HostNotAllowedError, assertAllowedHost, hostName, isAllowedHost } =
  await import("./host.ts");
const { proxy } = await import("../proxy.ts");
const { register } = await import("../instrumentation.ts");
const { NextRequest } = await import("next/server");

const OPEN = {
  ALLOW_UNAUTHENTICATED_NETWORK: "1",
  ALLOWED_HOSTS: "studybox.local, 192.168.1.20",
};

describe("hostName", () => {
  it("strips the port and lower-cases", () => {
    expect(hostName("LocalHost:3000")).toBe("localhost");
    expect(hostName("[::1]:3000")).toBe("[::1]");
    expect(hostName("[::1]")).toBe("[::1]");
    expect(hostName("127.0.0.1")).toBe("127.0.0.1");
    expect(hostName("[::1]:3000".toUpperCase())).toBe("[::1]");
  });
  it("rejects malformed values", () => {
    for (const bad of [
      "",
      "a b",
      "user@localhost",
      "localhost/x",
      "localhost:",
      "a, b",
      "[::1",
      "::1",
      "[::1%25en0]",
    ])
      expect(hostName(bad)).toBeNull();
  });
});

describe("isAllowedHost", () => {
  it("allows this computer's names on any port", () => {
    for (const host of [
      "localhost",
      "localhost:3000",
      "127.0.0.1:3000",
      "[::1]:3000",
    ])
      expect(isAllowedHost(host, {})).toBe(true);
  });

  it("rejects other hosts, a missing Host and look-alikes", () => {
    for (const host of [
      undefined,
      null,
      "",
      "evil.example",
      "localhost.evil.example",
      "127.0.0.1.nip.io",
      "192.168.1.20:3000",
      // Other spellings of this computer are refused rather than parsed.
      "localhost.",
      "0.0.0.0",
      "127.1",
      "[::ffff:127.0.0.1]",
    ])
      expect(isAllowedHost(host, {})).toBe(false);
  });

  it("ignores ALLOWED_HOSTS unless the opt-in is set", () => {
    expect(
      isAllowedHost("studybox.local", { ALLOWED_HOSTS: OPEN.ALLOWED_HOSTS }),
    ).toBe(false);
    expect(
      isAllowedHost("studybox.local", {
        ...OPEN,
        ALLOW_UNAUTHENTICATED_NETWORK: "true",
      }),
    ).toBe(false);
  });

  it("allows listed hosts once opted in", () => {
    expect(isAllowedHost("studybox.local:3000", OPEN)).toBe(true);
    expect(isAllowedHost("192.168.1.20", OPEN)).toBe(true);
    expect(isAllowedHost("other.local", OPEN)).toBe(false);
  });
});

describe("enforcement", () => {
  const saved = { ...process.env };
  beforeEach(() => {
    delete process.env.ALLOW_UNAUTHENTICATED_NETWORK;
    delete process.env.ALLOWED_HOSTS;
  });
  afterEach(() => {
    process.env = { ...saved };
    vi.restoreAllMocks();
  });

  const request = (host: string, extra: Record<string, string> = {}) =>
    new NextRequest("http://localhost/work", {
      headers: { host, ...extra },
    });

  it("the proxy answers local hosts and refuses others with 403", async () => {
    expect(proxy(request("localhost:3000")).status).toBe(200);
    const refused = proxy(request("evil.example"));
    expect(refused.status).toBe(403);
    expect(await refused.text()).toBe(
      "This server only answers requests addressed to this computer.\n",
    );
  });

  it("the proxy does not trust X-Forwarded-Host", () => {
    expect(
      proxy(request("evil.example", { "x-forwarded-host": "localhost" }))
        .status,
    ).toBe(403);
  });

  it("assertAllowedHost guards actions and the export route", async () => {
    requestHeaders.current = new Headers({ host: "127.0.0.1:3000" });
    await expect(assertAllowedHost()).resolves.toBeUndefined();
    requestHeaders.current = new Headers({
      host: "evil.example",
      "x-forwarded-host": "localhost",
    });
    await expect(assertAllowedHost()).rejects.toThrow(HostNotAllowedError);
  });

  it("reads the opt-in at run time, on every request", async () => {
    requestHeaders.current = new Headers({ host: "studybox.local" });
    await expect(assertAllowedHost()).rejects.toThrow(HostNotAllowedError);
    expect(proxy(request("studybox.local")).status).toBe(403);

    Object.assign(process.env, OPEN);
    await expect(assertAllowedHost()).resolves.toBeUndefined();
    expect(proxy(request("studybox.local")).status).toBe(200);

    delete process.env.ALLOW_UNAUTHENTICATED_NETWORK;
    expect(proxy(request("studybox.local")).status).toBe(403);
  });

  it("warns at startup only when opted in", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    register();
    process.env.ALLOWED_HOSTS = OPEN.ALLOWED_HOSTS;
    register();
    expect(warn).not.toHaveBeenCalled();

    process.env.ALLOW_UNAUTHENTICATED_NETWORK = "1";
    register();
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toMatch(/studybox\.local, 192\.168\.1\.20/);
    expect(warn.mock.calls[0][0]).toMatch(/anyone who can reach/);

    process.env.ALLOWED_HOSTS = " , bad host";
    register();
    expect(warn.mock.calls[1][0]).toMatch(/only this computer is allowed/);
  });
});
