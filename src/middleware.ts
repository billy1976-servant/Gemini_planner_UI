import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getDomainSegmentForHost } from "@/lib/domain-config";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const searchParams = request.nextUrl.searchParams;

  // Protect API, assets, and static routes — never rewrite
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/.well-known") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/static")
  ) {
    return NextResponse.next();
  }

  // Dev tools: when a TSX dev screen is explicitly requested (e.g. /dev?screen=...),
  // bypass domain routing completely so FlowRuntimeScreen and other TSX screens mount directly.
  if (pathname === "/dev" && searchParams.has("screen")) {
    if (process.env.NODE_ENV === "development") {
      console.log("[middleware] bypassing domain routing for /dev with screen query");
    }
    return NextResponse.next();
  }

  const host = request.headers.get("host") ?? request.nextUrl.hostname ?? "";
  const hostname = host.includes(":") ? host.slice(0, host.indexOf(":")) : host;

  if (process.env.NODE_ENV === "development") {
    console.log("[middleware] Step 1 — hostname parse", { host, hostname, pathname });
  }

  const domainSegment = getDomainSegmentForHost(host);
  console.log("[DOMAIN CHECK]", host, domainSegment);

  if (process.env.NODE_ENV === "development") {
    console.log("[middleware] Step 2 — resolver output (getDomainSegmentForHost)", {
      host,
      domainSegment,
      ...(domainSegment === null ? { "FALLBACK": "resolver returned null" } : {}),
    });
  }

  // Path-based fallback: no domain segment but /prayer → rewrite to /christian/prayer so (domain) route can serve it
  if (!domainSegment && pathname.startsWith("/prayer")) {
    if (process.env.NODE_ENV === "development") {
      console.log("[middleware] Step 3 — path fallback: rewrite /prayer → /christian/prayer");
    }
    return NextResponse.rewrite(new URL(`/christian${pathname}`, request.url));
  }

  if (!domainSegment) {
    if (process.env.NODE_ENV === "development") {
      console.log("[middleware] Step 3 — FALLBACK: no domain segment, returning next() (no rewrite)");
    }
    return NextResponse.next();
  }

  const domainPrefix = `/${domainSegment}`;
  if (pathname === domainPrefix || pathname.startsWith(`${domainPrefix}/`)) {
    return NextResponse.next();
  }

  // Domain rewrite: christian.hiclarify.com → /christian; learn.containercreations.com → /learn.containercreations.com
  const rewritePath = pathname === "/" ? domainPrefix : `${domainPrefix}${pathname}`;
  if (process.env.NODE_ENV === "development") {
    console.log("[middleware] Step 3 — selected layout (rewrite target)", {
      domainSegment,
      rewritePath,
      note: "Request will hit (domain)/[domain]/[[...path]] with domain=" + domainSegment,
    });
  }
  return NextResponse.rewrite(new URL(rewritePath, request.url));
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
};
