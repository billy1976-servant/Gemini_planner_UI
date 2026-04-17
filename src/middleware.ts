import { type NextRequest, NextResponse } from "next/server";

/**
 * Marks requests to `learn.*` hosts so the root layout can use the minimal shell even when
 * `beforeFiles` rewrites keep the browser pathname as `/flow/version` (not `/learn/...`).
 * `Host` alone is not always the visitor hostname behind proxies; this runs on the edge with the real host.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  if (!host.startsWith("learn.")) {
    return NextResponse.next();
  }
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-learn-public-host", "1");
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/).*)"],
};
