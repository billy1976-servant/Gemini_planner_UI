import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSubdomainFromHost } from "@/lib/domain-config";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect API, assets, and static routes — never rewrite
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/static")
  ) {
    return NextResponse.next();
  }

  const host = request.headers.get("host") ?? request.nextUrl.hostname ?? "";
  const subdomain = getSubdomainFromHost(host);

  if (process.env.NODE_ENV === "development") {
    console.log("[middleware]", host, pathname);
  }

  // Path-based fallback: no subdomain but /prayer → rewrite to /christian/prayer so (domain) route can serve it
  if (!subdomain && pathname.startsWith("/prayer")) {
    return NextResponse.rewrite(new URL(`/christian${pathname}`, request.url));
  }

  if (!subdomain) return NextResponse.next();

  // Subdomain rewrite: e.g. christian.hiclarify.com/prayer → /christian/prayer
  const rewritePath = pathname === "/" ? `/${subdomain}` : `/${subdomain}${pathname}`;
  if (process.env.NODE_ENV === "development") {
    console.log("[middleware] host=", host, "subdomain=", subdomain, "pathname=", pathname, "rewritePath=", rewritePath);
  }
  return NextResponse.rewrite(new URL(rewritePath, request.url));
}

export const config = {
  matcher: ["/((?!_next/|api/|icons/|favicon|manifest|static/).*)"],
};
