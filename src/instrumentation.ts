// Runs once when the server starts (design decision 9).
import { optedInHosts } from "./lib/host";

export function register() {
  // Once per server, not again for an edge runtime.
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.ALLOW_UNAUTHENTICATED_NETWORK !== "1") return;
  const hosts = optedInHosts();
  console.warn(
    hosts.length > 0
      ? `WARNING: ALLOW_UNAUTHENTICATED_NETWORK is set. This server also answers ` +
          `${hosts.join(", ")}, and there are no accounts: anyone who can reach ` +
          `it can read, change and delete all saved work.`
      : "WARNING: ALLOW_UNAUTHENTICATED_NETWORK is set but ALLOWED_HOSTS names " +
          "no valid host, so only this computer is allowed.",
  );
}
