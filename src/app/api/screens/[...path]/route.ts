import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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
 * JSON ROOT (live) — src/01_App/**
 * Domain-driven JSON files live here (e.g. ContainerCreations/Learn/landing/*.json).
 */
const JSON_LIVE_ROOT = path.join(process.cwd(), "src", "01_App");

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

function isExcludedByFolderRules(segments: string[]): boolean {
  return segments.some((s) => s.startsWith("_") || s.startsWith("("));
}

function tryResolveLiveJson(
  jsonSegments: string[]
): { json: any; resolvedRelativePath: string } | null {
  if (!jsonSegments?.length) return null;
  if (isExcludedByFolderRules(jsonSegments)) return null;

  const slug = (jsonSegments[jsonSegments.length - 1] ?? "").replace(/\.json$/i, "");
  const domainFolder = jsonSegments[0] ?? "";
  const subdomainFolder = jsonSegments[1] ?? "";
  const resolvedRoute = jsonSegments[2] ?? "landing";
  const routeFolder =
    resolvedRoute.toLowerCase() === slug.toLowerCase() ? "landing" : resolvedRoute;
  if (!domainFolder || !subdomainFolder || !routeFolder || !slug) return null;

  const folderPath = path.join(JSON_LIVE_ROOT, domainFolder, subdomainFolder, routeFolder);
  if (!fs.existsSync(folderPath)) return null;
  const stat = fs.statSync(folderPath);
  if (!stat.isDirectory()) return null;

  const files = fs.readdirSync(folderPath);
  const match = files.find(
    (f) =>
      f.toLowerCase().endsWith(".json") &&
      f.toLowerCase().replace(/\.(json|tsx)$/, "") === slug.toLowerCase()
  );
  if (!match) return null;

  const finalPath = path.join(folderPath, match);
  console.log("FINAL RESOLVED PATH:", finalPath);
  const fileContent = fs.readFileSync(finalPath, "utf8");
  if (!fileContent.trim()) return null;
  const parsed = JSON.parse(fileContent);
  return {
    json: parsed,
    resolvedRelativePath: [domainFolder, subdomainFolder, routeFolder, match].join("/"),
  };

  return null;
}


export async function GET(
  _req: Request,
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
    console.debug("[api/screens/[...path]] requested JSON path", {
      requestedPath,
      segments: params.path,
    });

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
    const jsonPathWithExtExists = fs.existsSync(jsonPathWithExt);
    const jsonPathNoExtExists = fs.existsSync(jsonPathNoExt);
    const jsonPath = jsonPathWithExtExists
      ? jsonPathWithExt
      : jsonPathNoExtExists
        ? jsonPathNoExt
        : null;
    console.debug("[api/screens/[...path]] resolved filesystem path(s)", {
      jsonPathNoExt,
      jsonPathNoExtExists,
      jsonPathWithExt,
      jsonPathWithExtExists,
      chosenJsonPath: jsonPath,
    });
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
        const resolvedRelativePath = path.relative(JSON_APPS_ROOT, jsonPath).replace(/\\/g, "/");
        return NextResponse.json(json, {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "X-Screen-Resolved-Path": resolvedRelativePath,
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

    // Live JSON (src/01_App/**)
    try {
      const liveResolved = tryResolveLiveJson(jsonSegments);
      if (liveResolved) {
        return NextResponse.json(liveResolved.json, {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "X-Screen-Resolved-Path": liveResolved.resolvedRelativePath,
          },
        });
      }
    } catch (e: any) {
      // Fall through to dead behavior or 404
      console.warn("[api/screens/[...path]] Live JSON resolution failed; continuing", {
        requested: requestedPath,
        err: e?.message ?? String(e),
      });
    }

    console.warn("[api/screens/[...path]] FILE_NOT_FOUND is returned (404)", {
      requestedPath,
      jsonPathNoExt,
      jsonPathNoExtExists,
      jsonPathWithExt,
      jsonPathWithExtExists,
      chosenJsonPath: jsonPath,
    });
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
