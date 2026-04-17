import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createBlankLearnDeck } from "@/lib/deck-platform/learn-blank-deck";
import { normalizeDeckAppKey } from "@/lib/deck-platform/legacy-app-keys";
import { findLearnDirAbsForAppKey } from "@/lib/deck-platform/learn-fs";
import { isSafeLearnFlowKey } from "@/lib/deck-platform/learn-launcher-utils";

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

function isInsideDir(childAbs: string, dirAbs: string): boolean {
  const resolvedChild = path.resolve(childAbs);
  const resolvedDir = path.resolve(dirAbs);
  const rel = path.relative(resolvedDir, resolvedChild);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

/**
 * POST /api/learn/create-flow
 * Body: `{ appKey, flowKey, title?, shopUrl? }` — creates `.../learn/<flowKey>/v1.json`.
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
  const titleRaw = typeof b.title === "string" ? b.title.trim() : "";
  const title = titleRaw || "New learn flow";
  const shopUrl = typeof b.shopUrl === "string" && b.shopUrl.trim() ? b.shopUrl.trim() : undefined;

  if (!appKey) {
    return NextResponse.json({ error: "appKey is required." }, { status: 400, headers: NO_CACHE });
  }
  if (!isSafeLearnFlowKey(flowKey)) {
    return NextResponse.json(
      { error: "flowKey must be a safe slug (lowercase letters, digits, hyphens)." },
      { status: 400, headers: NO_CACHE }
    );
  }

  const learnDir = findLearnDirAbsForAppKey(appKey);
  if (!learnDir) {
    return NextResponse.json(
      { error: `No learn folder found for appKey "${appKey}" under src/01_App.` },
      { status: 404, headers: NO_CACHE }
    );
  }

  const flowRoot = path.join(learnDir, flowKey);
  if (fs.existsSync(flowRoot)) {
    return NextResponse.json({ error: "A flow with this key already exists." }, { status: 409, headers: NO_CACHE });
  }

  const v1Abs = path.join(flowRoot, "v1.json");

  if (!isInsideDir(flowRoot, learnDir)) {
    return NextResponse.json({ error: "Invalid flow path." }, { status: 400, headers: NO_CACHE });
  }

  try {
    fs.mkdirSync(flowRoot, { recursive: true });
    const deck = createBlankLearnDeck({ title, shopUrl });
    fs.writeFileSync(v1Abs, `${JSON.stringify(deck, null, 2)}\n`, "utf8");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    try {
      fs.rmSync(flowRoot, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
    console.error("[api/learn/create-flow]", e);
    return NextResponse.json({ error: `Create failed: ${msg}` }, { status: 500, headers: NO_CACHE });
  }

  return NextResponse.json(
    { ok: true, appKey, flowKey, versionKey: "v1" },
    { headers: NO_CACHE }
  );
}
