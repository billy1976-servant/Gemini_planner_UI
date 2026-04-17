import { type NextRequest, NextResponse } from "next/server";

/**
 * Universal learn-host entry gate:
 * - marks `learn.*` host requests for minimal-shell rendering
 * - rewrites non-`/learn/*` public paths to canonical Learn routes before any legacy
 *   host/domain resolver can run
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
  const nextResp = () => NextResponse.next({ request: { headers: requestHeaders } });

  const pathname = request.nextUrl.pathname || "/";
  const bypassInfrastructurePath =
    pathname.startsWith("/learn/") ||
    pathname === "/learn" ||
    pathname.startsWith("/api/") ||
    pathname === "/api" ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest" ||
    pathname.startsWith("/icons/") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml";
  if (bypassInfrastructurePath) {
    return nextResp();
  }

  const parts = host.split(".");
  const hostAppRaw = parts.length >= 3 && parts[0] === "learn" ? parts[1] ?? "" : "";
  const hostApp = hostAppRaw.trim().toLowerCase();
  if (!hostApp) {
    return nextResp();
  }

  const routeSegments = pathname
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);
  const rewriteUrl = request.nextUrl.clone();

  if (routeSegments.length === 0) {
    rewriteUrl.pathname = `/learn/${encodeURIComponent(hostApp)}`;
    return NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
  }
  if (routeSegments.length === 1) {
    rewriteUrl.pathname = `/learn/${encodeURIComponent(hostApp)}/${encodeURIComponent(routeSegments[0])}`;
    return NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
  }
  if (routeSegments.length === 2) {
    rewriteUrl.pathname =
      `/learn/${encodeURIComponent(hostApp)}/${encodeURIComponent(routeSegments[0])}/${encodeURIComponent(routeSegments[1])}`;
    return NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
  }

  rewriteUrl.pathname = `/learn/${encodeURIComponent(hostApp)}`;
  return NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/).*)"],
};
