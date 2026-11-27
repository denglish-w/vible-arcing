// Checks shared by the download routes (saved-work spec "Exporting an
// analysis"; app-server-and-sqlite design decisions 6 and 9).
import { headers } from "next/headers";
import { assertAllowedHost, HostNotAllowedError } from "../../lib/host";

export const refuse = (status: number, message: string) =>
  new Response(`${message}\n`, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-content-type-options": "nosniff",
    },
  });

/**
 * Route handlers have no Origin check of their own, so a page on another local
 * port could otherwise request this one. A browser sends Origin on cross-origin
 * requests but not on a same-origin link click, so a request passes when its
 * Origin is this server, or when it has none and the browser marks it as
 * same-origin or typed by the user.
 */
function fromThisOrigin(request: Request, host: string | null): boolean {
  const origin = request.headers.get("origin");
  if (origin !== null) {
    try {
      return host !== null && new URL(origin).host === host.toLowerCase();
    } catch {
      return false;
    }
  }
  const site = request.headers.get("sec-fetch-site");
  return site === "same-origin" || site === "none";
}

/** A refusal for a disallowed host or a cross-origin request, else null. */
export async function exportRefusal(
  request: Request,
): Promise<Response | null> {
  try {
    await assertAllowedHost();
  } catch (error) {
    if (error instanceof HostNotAllowedError) return refuse(403, error.message);
    throw error;
  }
  if (!fromThisOrigin(request, (await headers()).get("host")))
    return refuse(403, "Exports can only be requested from this app.");
  return null;
}
