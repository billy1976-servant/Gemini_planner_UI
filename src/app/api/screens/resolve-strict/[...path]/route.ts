import { NextResponse } from "next/server";
import { resolveStrictLowercaseRoute } from "@/lib/routing/strict-lowercase-router";

export async function GET(
  req: Request,
  { params }: { params: { path?: string[] } }
) {
  const hostHeader = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const segments = params.path ?? [];
  const resolved = resolveStrictLowercaseRoute(hostHeader, segments);
  return NextResponse.json(resolved);
}
