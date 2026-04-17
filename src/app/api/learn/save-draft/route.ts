import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { normalizeDeckAppKey } from "@/lib/deck-platform/legacy-app-keys";
import { learnVersionAbsPath, loadCatalog } from "@/lib/deck-platform/registry";

export const dynamic = "force-dynamic";

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
} as const;

function assertAuthoringAllowed(): NextResponse | null {
  if (process.env.NODE_ENV === "production" && process.env.DECK_AUTHORING !== "1") {
    return NextResponse.json({ error: "Deck authoring is disabled in production." }, { status: 403, headers: NO_CACHE });
  }
  return null;
}

function isInsideDir(fileAbs: string, dirAbs: string): boolean {
  const resolvedChild = path.resolve(fileAbs);
  const resolvedDir = path.resolve(dirAbs);
  const rel = path.relative(resolvedDir, resolvedChild);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

/**
 * POST /api/learn/save-draft
 * Body: `{ appKey, flowKey, versionKey, deck }` — overwrites `<versionKey>.json` in the flow root.
 */
export async function POST(request: Request) {
  const denied = assertAuthoringAllowed();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400, headers: NO_CACHE });
  }
  if (body == null || typeof body !== "object") {
    return NextResponse.json({ error: "Body must be an object." }, { status: 400, headers: NO_CACHE });
  }
  const b = body as Record<string, unknown>;
  const appKey = typeof b.appKey === "string" ? normalizeDeckAppKey(b.appKey) : "";
  const flowKey = typeof b.flowKey === "string" ? b.flowKey.trim() : "";
  const versionKey = typeof b.versionKey === "string" ? b.versionKey.trim() : "";
  const deck = b.deck;
  if (!appKey || !flowKey || !versionKey) {
    return NextResponse.json({ error: "appKey, flowKey, and versionKey are required." }, { status: 400, headers: NO_CACHE });
  }
  if (deck == null || typeof deck !== "object") {
    return NextResponse.json({ error: "deck must be an object." }, { status: 400, headers: NO_CACHE });
  }

  const entry = loadCatalog().find((e) => e.deckRef.appKey === appKey && e.deckRef.flowKey === flowKey);
  if (!entry) {
    return NextResponse.json({ error: "Unknown app/flow." }, { status: 404, headers: NO_CACHE });
  }
  if (!entry.availableVersions.includes(versionKey)) {
    return NextResponse.json({ error: "versionKey not allowed for this flow." }, { status: 400, headers: NO_CACHE });
  }

  const target = learnVersionAbsPath(entry.flowRootAbsPath, versionKey);
  if (!isInsideDir(target, entry.flowRootAbsPath)) {
    return NextResponse.json({ error: "Invalid version path." }, { status: 400, headers: NO_CACHE });
  }

  try {
    fs.writeFileSync(target, `${JSON.stringify(deck, null, 2)}\n`, "utf8");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api/learn/save-draft]", e);
    return NextResponse.json({ error: `Write failed: ${msg}` }, { status: 500, headers: NO_CACHE });
  }

  return NextResponse.json({ ok: true, path: path.relative(process.cwd(), target).split(path.sep).join("/") }, { headers: NO_CACHE });
}
