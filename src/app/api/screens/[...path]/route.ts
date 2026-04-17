import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  isLearnDeckScreensRelativePath,
  isLegacyRuntimeDisabledFromHeaders,
} from "@/lib/learn-public-host";
import { normalizeDeckAppKey } from "@/lib/deck-platform/legacy-app-keys";
import { resolveDeck } from "@/lib/deck-platform/registry";

/**
 * 09_Integrations test screens (Integration Lab).
 * integration-lab.json → 09_Integrations/05_TESTS/IntegrationLab.screen.json
 */
const INTEGRATIONS_TEST_ROOT = path.join(
  process.cwd(),
  "src",
  "09_Integrations",
  "05_TESTS"
);

/**
 * JSON APPS ROOT — src/01_App/(dead) Json
 * Serves HiClarify and other JSON screens (e.g. osb-home-registry.json).
 */
const JSON_APPS_ROOT = path.join(
  process.cwd(),
  "src",
  "01_App",
  "(dead) Json"
);

/**
 * TSX SCREEN ROOT — src/01_App/(dead) Tsx
 * Runtime resolution of TSX screens; returns marker, not source.
 */
const TSX_ROOT = path.join(
  process.cwd(),
  "src",
  "01_App",
  "(dead) Tsx"
);

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
} as const;

export async function GET(
  req: Request,
  { params }: { params: { path?: string[] } }
) {
  try {
    if (!params?.path?.length) {
      return NextResponse.json(
        { error: "No screen path provided" },
        { status: 400 }
      );
    }

    const requestedPath = params.path.join("/");

    if (isLegacyRuntimeDisabledFromHeaders(req.headers)) {
      if (isLearnDeckScreensRelativePath(requestedPath)) {
        const segs = params.path as string[];
        const appKey = normalizeDeckAppKey(decodeURIComponent(segs[0] ?? ""));
        const flowKey = decodeURIComponent(segs[2] ?? "").trim();
        let versionKey = decodeURIComponent(segs[3] ?? "").trim();
        if (versionKey.toLowerCase().endsWith(".json")) {
          versionKey = versionKey.slice(0, -".json".length).trim();
        }
        if (segs[1]?.toLowerCase() !== "learn" || !appKey || !flowKey || !versionKey) {
          return NextResponse.json({ error: "Not Found" }, { status: 404, headers: NO_CACHE });
        }
        const result = resolveDeck({
          appKey,
          flowKey,
          version: versionKey,
          includeBody: true,
        });
        if (result.ok === false) {
          return NextResponse.json({ error: result.error }, { status: result.status, headers: NO_CACHE });
        }
        return NextResponse.json(result.deck, { headers: NO_CACHE });
      }
      return NextResponse.json({ error: "Not Found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
    }

    /* ===============================
       0️⃣ 09_INTEGRATIONS LAB (single path)
       integration-lab.json → 09_Integrations/05_TESTS/IntegrationLab.screen.json
    =============================== */
    const isIntegrationLab =
      requestedPath === "integration-lab.json" ||
      requestedPath === "integration-lab";
    if (isIntegrationLab) {
      const labPath = path.join(INTEGRATIONS_TEST_ROOT, "IntegrationLab.screen.json");
      if (fs.existsSync(labPath)) {
        const fileContent = fs.readFileSync(labPath, "utf8");
        if (!fileContent.trim()) {
          return NextResponse.json(
            { error: "File is empty", path: labPath },
            { status: 500 }
          );
        }
        try {
          const json = JSON.parse(fileContent);
          return NextResponse.json(json, {
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "Pragma": "no-cache",
              "Expires": "0",
            },
          });
        } catch (parseError: unknown) {
          const message = parseError instanceof Error ? parseError.message : String(parseError);
          return NextResponse.json(
            { error: `Invalid JSON: ${message}`, path: labPath },
            { status: 500 }
          );
        }
      }
    }

    /* ===============================
       TSX PATH (FLEXIBLE 2-LEVEL OR 3-LEVEL)
       Try: folder/file.tsx, then folder/subfolder/file.tsx
       Extension: .tsx (not .screen.tsx)
    =============================== */
    const pathSegments = params.path as string[];
    const withExt = (segments: string[]) =>
      path.join(TSX_ROOT, ...segments) + ".tsx";
    let tsxResolved: string | null = null;
    if (pathSegments.length >= 2) {
      if (fs.existsSync(withExt(pathSegments))) {
        tsxResolved = pathSegments.join("/");
      }
      if (!tsxResolved && pathSegments.length === 3) {
        const twoLevel = [pathSegments[0], pathSegments[2]];
        if (fs.existsSync(withExt(twoLevel))) {
          tsxResolved = twoLevel.join("/");
        }
      }
    }
    if (tsxResolved) {
      return NextResponse.json({
        __type: "tsx-screen",
        __tsx__: true,
        screen: tsxResolved,
        path: tsxResolved,
      });
    }

    /* ===============================
       JSON APPS (e.g. HiClarify/home/osb-home-registry.json)
       Path may or may not include .json
    =============================== */
    const jsonSegments = params.path as string[];
    const jsonPathNoExt = path.join(JSON_APPS_ROOT, ...jsonSegments);
    const jsonPathWithExt = jsonPathNoExt.endsWith(".json")
      ? jsonPathNoExt
      : jsonPathNoExt + ".json";
    const jsonPath = fs.existsSync(jsonPathWithExt)
      ? jsonPathWithExt
      : fs.existsSync(jsonPathNoExt)
        ? jsonPathNoExt
        : null;
    if (jsonPath) {
      try {
        const fileContent = fs.readFileSync(jsonPath, "utf8");
        if (!fileContent.trim()) {
          return NextResponse.json(
            { error: "File is empty", path: jsonPath },
            { status: 500 }
          );
        }
        const json = JSON.parse(fileContent);
        return NextResponse.json(json, {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
          },
        });
      } catch (parseError: unknown) {
        const message = parseError instanceof Error ? parseError.message : String(parseError);
        return NextResponse.json(
          { error: `Invalid JSON: ${message}`, path: jsonPath },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Screen not found",
        requested: requestedPath,
      },
      { status: 404 }
    );
  } catch (err: any) {
    console.error("[api/screens/[...path]] ❌ Error in GET handler", {
      error: err.message,
      stack: err.stack,
      requestedPath: params?.path?.join("/"),
    });
    return NextResponse.json(
      { error: err.message, path: params?.path?.join("/") },
      { status: 500 }
    );
  }
}
