import { NextResponse } from "next/server";
import { loadCatalog } from "@/lib/deck-platform/registry";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
} as const;

/**
 * GET /api/learn/catalog
 * Lists learn deck flows discovered from flow folders + root-level version `*.json` files.
 */
export async function GET() {
  try {
    const catalog = loadCatalog();
    const body = catalog.map((e) => ({
      appKey: e.deckRef.appKey,
      flowKey: e.deckRef.flowKey,
      title: e.title,
      defaultVersion: e.deckRef.defaultVersion,
      availableVersions: e.availableVersions,
      flowRootRelPath: e.flowRootRelPath,
    }));
    return NextResponse.json({ catalog: body }, { headers: NO_CACHE });
  } catch (err) {
    console.error("[api/learn/catalog]", err);
    return NextResponse.json({ error: "Failed to load deck catalog" }, { status: 500, headers: NO_CACHE });
  }
}
