import { type NextRequest, NextResponse } from "next/server";
import { isLearnDeckScreensApiPathname, isLegacyRuntimeDisabledHostname } from "@/lib/learn-public-host";

/**
 * Universal learn-host entry gate:
 * - marks `learn.*` host requests for minimal-shell rendering
 * - rewrites non-`/learn/*` public paths to canonical Learn routes before any legacy
 *   host/domain resolver can run
 * - blocks legacy screen APIs for any host in the legacy-runtime-disabled policy (learn.* + product hosts)
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

  const pathname = request.nextUrl.pathname || "/";

  /** Legacy screen/config APIs are disabled on all Learn-system / product hosts. */
  const legacyApiBlocked =
    pathname === "/api/screens" ||
    pathname.startsWith("/api/screens/") ||
    pathname === "/api/container-creations-landing-config" ||
    pathname.startsWith("/api/container-creations-landing-config/");
  if (
    legacyApiBlocked &&
    isLegacyRuntimeDisabledHostname(host) &&
    !(pathname.startsWith("/api/screens/") && isLearnDeckScreensApiPathname(pathname))
  ) {
    return NextResponse.json({ error: "Not Found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  /**
   * Request headers consumed by `src/app/layout.tsx` so the root layout never mounts
   * `UserLayoutChrome` / legacy top bar on learn.* or other legacy-runtime-disabled hosts,
   * even when `usePathname()` still shows the public URL (`/track-1/v1`) after rewrites.
   */
  const requestHeaders = new Headers(request.headers);
  if (isLegacyRuntimeDisabledHostname(host)) {
    requestHeaders.set("x-legacy-runtime-disabled", "1");
  }

  if (!host.startsWith("learn.")) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  requestHeaders.set("x-learn-public-host", "1");
  const nextResp = () => NextResponse.next({ request: { headers: requestHeaders } });

  const bypassInfrastructurePath =
    pathname.startsWith("/learn/") ||
    pathname === "/learn" ||
    pathname.startsWith("/api/") ||
    pathname === "/api" ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/videos/") ||
    pathname.startsWith("/Videos/") ||
    pathname.startsWith("/audio/") ||
    pathname.startsWith("/fonts/") ||
    pathname.startsWith("/assets/") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest" ||
    pathname.startsWith("/icons/") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml";
  const hasLikelyStaticExtension = /\.[a-z0-9]{2,6}$/i.test(pathname);
  if (bypassInfrastructurePath || hasLikelyStaticExtension) {
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
