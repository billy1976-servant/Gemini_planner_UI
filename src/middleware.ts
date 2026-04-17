import { type NextRequest, NextResponse } from "next/server";

/**
 * Marks requests to `learn.*` hosts so the root layout can use the minimal shell even when
 * `beforeFiles` rewrites keep the browser pathname as `/flow/version` (not `/learn/...`).
 * `Host` alone is not always the visitor hostname behind proxies; this runs on the edge with the real host.
 */
export function middleware(request: NextRequest) {
  const forwardedHost =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    request.headers.get("x-vercel-forwarded-host")?.split(",")[0]?.trim() ??
    "";
  const host =
    (forwardedHost || request.nextUrl.hostname || request.headers.get("host") || "")
      .split(":")[0]
      ?.toLowerCase() ?? "";
  if (!host.startsWith("learn.")) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-learn-public-host", "1");

  /**
   * Safety net: force learn host URLs into canonical /learn/... route before legacy
   * domain-based catch-alls can handle /track-1 style public paths.
   */
  if (host === "learn.hiclarify.com") {
    const pathname = request.nextUrl.pathname;
    const toCanonicalLearn = pathname === "/" || pathname === "/track-1" || pathname === "/track-1/v1";
    if (toCanonicalLearn) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = "/learn/hiclarify/track-1/v1";
      return NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/).*)"],
};
