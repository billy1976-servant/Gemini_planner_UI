import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { normalizeDeckAppKey } from "@/lib/deck-platform/legacy-app-keys";
import { stripLearnVersionStemInput } from "@/lib/deck-platform/learn-launcher-utils";
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

function isSafeVersionStem(versionKey: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(versionKey);
}

/**
 * POST /api/learn/create-version
 * Body: `{ appKey, flowKey, fromVersion, toVersion }` — copies deck JSON to a new `<toVersion>.json` in the same flow folder.
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
  const fromVersion =
    typeof b.fromVersion === "string" ? stripLearnVersionStemInput(b.fromVersion) : "";
  const toVersion = typeof b.toVersion === "string" ? stripLearnVersionStemInput(b.toVersion) : "";
  if (!appKey || !flowKey || !fromVersion || !toVersion) {
    return NextResponse.json({ error: "appKey, flowKey, fromVersion, and toVersion are required." }, { status: 400, headers: NO_CACHE });
  }
  if (fromVersion === toVersion) {
    return NextResponse.json({ error: "fromVersion and toVersion must differ." }, { status: 400, headers: NO_CACHE });
  }
  if (!isSafeVersionStem(fromVersion) || !isSafeVersionStem(toVersion)) {
    return NextResponse.json(
      { error: "Version names must use letters/digits and may include . _ - characters." },
      { status: 400, headers: NO_CACHE }
    );
  }

  const entry = loadCatalog().find((e) => e.deckRef.appKey === appKey && e.deckRef.flowKey === flowKey);
  if (!entry) {
    return NextResponse.json({ error: "Unknown app/flow." }, { status: 404, headers: NO_CACHE });
  }
  if (!entry.availableVersions.includes(fromVersion)) {
    return NextResponse.json({ error: "fromVersion is not an existing version for this flow." }, { status: 400, headers: NO_CACHE });
  }
  if (entry.availableVersions.includes(toVersion)) {
    return NextResponse.json({ error: "toVersion already exists." }, { status: 409, headers: NO_CACHE });
  }

  const src = learnVersionAbsPath(entry.flowRootAbsPath, fromVersion);
  const dst = learnVersionAbsPath(entry.flowRootAbsPath, toVersion);
  if (!isInsideDir(src, entry.flowRootAbsPath) || !isInsideDir(dst, entry.flowRootAbsPath)) {
    return NextResponse.json({ error: "Invalid version path." }, { status: 400, headers: NO_CACHE });
  }
  if (!fs.existsSync(src)) {
    return NextResponse.json({ error: "Source deck file missing." }, { status: 404, headers: NO_CACHE });
  }
  if (fs.existsSync(dst)) {
    return NextResponse.json({ error: "Target deck file already exists." }, { status: 409, headers: NO_CACHE });
  }

  try {
    fs.copyFileSync(src, dst);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api/learn/create-version] copy", e);
    return NextResponse.json({ error: `Copy failed: ${msg}` }, { status: 500, headers: NO_CACHE });
  }

  const refreshed = loadCatalog().find((e) => e.deckRef.appKey === appKey && e.deckRef.flowKey === flowKey);

  return NextResponse.json(
    {
      ok: true,
      versionFile: path.relative(process.cwd(), dst).split(path.sep).join("/"),
      availableVersions: refreshed?.availableVersions ?? [...entry.availableVersions, toVersion],
    },
    { headers: NO_CACHE }
  );
}
