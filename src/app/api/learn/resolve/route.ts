import { NextResponse } from "next/server";
import { resolveDeck } from "@/lib/deck-platform/registry";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
} as const;

/**
 * GET /api/learn/resolve?app=&flow=&version=&schema=&includeBody=1
 * Returns metadata and optionally the merged deck JSON (flow-root `<version>.json` + optional schema overlay).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const appKey = searchParams.get("app")?.trim() ?? "";
    const flowKey = searchParams.get("flow")?.trim() ?? "";
    const version = searchParams.get("version");
    const schema = searchParams.get("schema");
    const includeBody =
      searchParams.get("includeBody") === "1" ||
      searchParams.get("includeBody") === "true" ||
      searchParams.get("body") === "1";

    if (!appKey || !flowKey) {
      return NextResponse.json(
        { error: "Query params `app` and `flow` are required." },
        { status: 400, headers: NO_CACHE }
      );
    }

    const result = resolveDeck({
      appKey,
      flowKey,
      version,
      schema,
      includeBody,
    });

    if (result.ok === false) {
      return NextResponse.json({ error: result.error }, { status: result.status, headers: NO_CACHE });
    }

    if (includeBody) {
      return NextResponse.json(
        {
          ...result.metadata,
          deck: result.deck,
        },
        { headers: NO_CACHE }
      );
    }

    return NextResponse.json(result.metadata, { headers: NO_CACHE });
  } catch (err) {
    console.error("[api/learn/resolve]", err);
    return NextResponse.json({ error: "Failed to resolve deck" }, { status: 500, headers: NO_CACHE });
  }
}
