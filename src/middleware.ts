import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSubdomainFromHost } from "@/lib/domain-config";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.startsWith("/icons")) {
    return NextResponse.next();
  }
  const host = request.headers.get("host") ?? request.nextUrl.hostname ?? "";
  const subdomain = getSubdomainFromHost(host);
  if (!subdomain) return NextResponse.next();
  const rewritePath = pathname === "/" ? `/_domain/${subdomain}` : `/_domain/${subdomain}${pathname}`;
  return NextResponse.rewrite(new URL(rewritePath, request.url));
}

export const config = {
  matcher: ["/((?!_next/|api/|icons/|favicon.ico).*)"],
};
