import { NextResponse } from "next/server";
import { resolveStrictLowercaseRoute } from "@/lib/routing/strict-lowercase-router";

export async function GET(
  req: Request,
  { params }: { params: { path?: string[] } }
) {
  const hostHeader = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const host = hostHeader.trim().split(":")[0];
  const hostParts = host.toLowerCase().split(".").filter(Boolean);
  const subdomain = hostParts.length === 3 ? hostParts[0] : "";
  const rawSegments = params.path ?? [];
  const segments = subdomain && rawSegments[0]?.toLowerCase() === subdomain ? rawSegments.slice(1) : rawSegments;
  const route = segments.join("/");

  console.log("[resolve-strict] incoming", { hostHeader, segments, route });

  try {
    const resolved = resolveStrictLowercaseRoute(hostHeader, segments);
    console.log("[resolve-strict] resolved", {
      selectedScreenKey: route,
      finalResponse: { type: resolved.type, path: resolved.path, resolvedFilePath: resolved.resolvedFilePath },
    });
    return NextResponse.json(resolved);
  } catch (err) {
    console.error("RESOLVER ERROR:", err);
    const fallbackPayload = {
      type: "json",
      path: "fallback",
      resolvedFilePath: "",
      jsonData: {},
    };
    console.log("[resolve-strict] fallback-response", { selectedScreenKey: route, finalResponse: fallbackPayload });
    return NextResponse.json(fallbackPayload);
  }
}
