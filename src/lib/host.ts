// Which Host headers the server answers (local-only-server spec; design
// decision 9). Without accounts, anyone who can send a request can read and
// delete all saved work, so only this computer's names are allowed unless the
// operator opts in. Settings are read from the environment on every call, never
// from next.config.ts, which is fixed at build time.
//
// Only the Host header counts. X-Forwarded-Host is ignored: a DNS-rebinding page
// is same-origin with the server, so it can send that header without a CORS
// preflight, but it cannot change Host.
import { headers } from "next/headers";

type Env = Readonly<Record<string, string | undefined>>;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** The host name from a Host header, lower-cased and without its port. */
export function hostName(host: string): string | null {
  const value = host.trim().toLowerCase();
  // [IPv6] or [IPv6]:port
  const bracketed = /^(\[[0-9a-f:.]+\])(?::\d+)?$/.exec(value);
  if (bracketed) return bracketed[1];
  const named = /^([^:\s/@[\]]+)(?::\d+)?$/.exec(value);
  return named ? named[1] : null;
}

/** Hosts the operator opened the server to, if they opted in. */
export function optedInHosts(env: Env = process.env): string[] {
  if (env.ALLOW_UNAUTHENTICATED_NETWORK !== "1") return [];
  return (env.ALLOWED_HOSTS ?? "")
    .split(",")
    .map((entry) => hostName(entry))
    .filter((name): name is string => name !== null);
}

export function isAllowedHost(
  host: string | null | undefined,
  env: Env = process.env,
): boolean {
  if (!host) return false;
  const name = hostName(host);
  if (name === null) return false;
  return LOCAL_HOSTS.has(name) || optedInHosts(env).includes(name);
}

export class HostNotAllowedError extends Error {
  constructor() {
    super("This server only answers requests addressed to this computer.");
    this.name = "HostNotAllowedError";
  }
}

/**
 * Throws unless the current request's Host is allowed. Called by every server
 * action, the export route and src/db/server.ts, so the proxy is not the only
 * check.
 */
export async function assertAllowedHost(): Promise<void> {
  if (!isAllowedHost((await headers()).get("host")))
    throw new HostNotAllowedError();
}
