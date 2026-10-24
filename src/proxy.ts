// Rejects requests for hosts other than this computer's (design decision 9).
// No matcher, so it covers every page, static file, /api route and server
// action. Actions, the export route and src/db/server.ts check again.
import { NextResponse, type NextRequest } from "next/server";
import { isAllowedHost } from "./lib/host";

export function proxy(request: NextRequest) {
  if (isAllowedHost(request.headers.get("host"))) return NextResponse.next();
  return new NextResponse(
    "This server only answers requests addressed to this computer.\n",
    { status: 403, headers: { "content-type": "text/plain; charset=utf-8" } },
  );
}
