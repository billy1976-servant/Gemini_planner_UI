import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const INTEGRATIONS_TEST_ROOT = path.join(
  process.cwd(),
  "src",
  "09_Integrations",
  "05_TESTS"
);

const JSON_APPS_ROOT = path.join(
  process.cwd(),
  "src",
  "01_App",
  "(dead) Json"
);

const JSON_LIVE_ROOT = path.join(process.cwd(), "src", "01_App");

const TSX_ROOT = path.join(
  process.cwd(),
  "src",
  "01_App",
  "(dead) Tsx"
);

type ResolvedType = "json" | "tsx";

type ResolvePayload = {
  type: ResolvedType;
  path: string;
  resolvedFilePath: string;
  source: "integrations" | "dead-json" | "live-json" | "tsx";
};

function hasExcludedFolder(segments: string[]): boolean {
  return segments.some((s) => s.startsWith("_") || s.startsWith("("));
}

function ensureJsonFilename(name: string): string {
  return name.toLowerCase().endsWith(".json") ? name : `${name}.json`;
}

function stripJsonSuffix(name: string): string {
  return name.toLowerCase().endsWith(".json") ? name.slice(0, -5) : name;
}

function fileExists(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function resolveJsonFromDeadRoot(segments: string[]): ResolvePayload | null {
  if (!segments.length) return null;
  const last = ensureJsonFilename(segments[segments.length - 1]);
  const jsonSegments = [...segments.slice(0, -1), last];
  const fullPath = path.join(JSON_APPS_ROOT, ...jsonSegments);
  const fullJsonPath = fullPath;
  console.log("FULL PATH CHECK:", fullJsonPath);
  if (!fileExists(fullPath)) return null;
  return {
    type: "json",
    path: jsonSegments.join("/"),
    resolvedFilePath: fullPath,
    source: "dead-json",
  };
}

function resolveJsonFromLiveRoot(segments: string[]): ResolvePayload | null {
  if (!segments.length || hasExcludedFolder(segments)) return null;

  const slug = stripJsonSuffix(segments[segments.length - 1] ?? "");
  const domainFolder = segments[0] ?? "";
  const subdomainFolder = segments[1] ?? "";
  const resolvedRoute = segments[2] ?? "landing";
  const routeFolder =
    resolvedRoute.toLowerCase() === slug.toLowerCase() ? "landing" : resolvedRoute;
  if (!domainFolder || !subdomainFolder || !routeFolder || !slug) return null;

  const folderPath = path.join(JSON_LIVE_ROOT, domainFolder, subdomainFolder, routeFolder);
  if (!fs.existsSync(folderPath)) return null;
  const files = fs.readdirSync(folderPath);
  const match = files.find(
    (f) =>
      f.toLowerCase().endsWith(".json") &&
      f.toLowerCase().replace(/\.(json|tsx)$/, "") === slug.toLowerCase()
  );
  if (!match) return null;

  const finalPath = path.join(folderPath, match);
  console.log("FINAL RESOLVED PATH:", finalPath);
  console.log("FULL PATH CHECK:", finalPath);
  if (fileExists(finalPath)) {
    return {
      type: "json",
      path: [domainFolder, subdomainFolder, routeFolder, match].join("/"),
      resolvedFilePath: finalPath,
      source: "live-json",
    };
  }

  return null;
}

function resolveTsx(segments: string[]): ResolvePayload | null {
  if (!segments.length) return null;
  const cleaned = [...segments.slice(0, -1), stripJsonSuffix(segments[segments.length - 1])];
  if (cleaned.length < 2) return null;

  const fullCandidate = path.join(TSX_ROOT, ...cleaned) + ".tsx";
  if (fileExists(fullCandidate)) {
    return {
      type: "tsx",
      path: cleaned.join("/"),
      resolvedFilePath: fullCandidate,
      source: "tsx",
    };
  }

  if (cleaned.length === 3) {
    const twoLevel = [cleaned[0], cleaned[2]];
    const twoLevelCandidate = path.join(TSX_ROOT, ...twoLevel) + ".tsx";
    if (fileExists(twoLevelCandidate)) {
      return {
        type: "tsx",
        path: twoLevel.join("/"),
        resolvedFilePath: twoLevelCandidate,
        source: "tsx",
      };
    }
  }

  return null;
}

export async function GET(
  _req: Request,
  { params }: { params: { path?: string[] } }
) {
  if (!params?.path?.length) {
    return NextResponse.json({ error: "No screen path provided" }, { status: 400 });
  }

  const segments = params.path.filter(Boolean);
  const requestedPath = segments.join("/");

  // Diagnostic: exact filename being searched (case-sensitive)
  const lastSegment = segments[segments.length - 1] ?? "";
  const exactJsonFilenameSearched = lastSegment.toLowerCase().endsWith(".json")
    ? lastSegment
    : `${lastSegment}.json`;
  console.log("[api/screens/resolve] EXACT FILENAME BEING SEARCHED (case-sensitive)", {
    requestedPath,
    segments,
    lastSegment,
    exactJsonFilenameSearched,
    fullPathAttemptedLive: path.join(JSON_LIVE_ROOT, ...segments.slice(0, -1), exactJsonFilenameSearched),
  });

  const isIntegrationLab = requestedPath === "integration-lab" || requestedPath === "integration-lab.json";
  if (isIntegrationLab) {
    const integrationPath = path.join(INTEGRATIONS_TEST_ROOT, "IntegrationLab.screen.json");
    if (fileExists(integrationPath)) {
      const payload: ResolvePayload = {
        type: "json",
        path: "integration-lab.json",
        resolvedFilePath: integrationPath,
        source: "integrations",
      };
      console.log("[api/screens/resolve] RESOLVED TYPE: JSON", payload);
      return NextResponse.json(payload);
    }
  }

  const jsonDead = resolveJsonFromDeadRoot(segments);
  const jsonLive = resolveJsonFromLiveRoot(segments);
  const jsonResolved = jsonDead ?? jsonLive;
  const tsxResolved = resolveTsx(segments);

  if (jsonResolved && tsxResolved) {
    console.warn("[api/screens/resolve] Both JSON and TSX exist; preferring JSON", {
      requestedPath,
      json: jsonResolved.resolvedFilePath,
      tsx: tsxResolved.resolvedFilePath,
    });
  }

  const resolved = jsonResolved ?? tsxResolved;
  if (resolved) {
    console.log(
      `[api/screens/resolve] RESOLVED TYPE: ${resolved.type.toUpperCase()}`,
      {
        requestedPath,
        path: resolved.path,
        resolvedFilePath: resolved.resolvedFilePath,
        source: resolved.source,
      }
    );
    return NextResponse.json(resolved);
  }

  const folderForLiveJson = path.join(JSON_LIVE_ROOT, ...segments.slice(0, -1));
  const dirListingAttempted = fs.existsSync(folderForLiveJson)
    ? fs.readdirSync(folderForLiveJson, { withFileTypes: true }).filter((e) => e.isFile()).map((e) => e.name)
    : [];
  const canonicalLandingDir = path.join(JSON_LIVE_ROOT, "ContainerCreations", "Learn", "landing");
  const canonicalLandingListing = fs.existsSync(canonicalLandingDir)
    ? fs.readdirSync(canonicalLandingDir, { withFileTypes: true }).filter((e) => e.isFile()).map((e) => e.name)
    : [];
  console.warn("[api/screens/resolve] SCREEN_NOT_FOUND", {
    requestedPath,
    segments,
    exactJsonFilenameSearched,
    folderAttempted: folderForLiveJson,
    filesInFolderAttempted: dirListingAttempted,
    canonicalLandingFolder: canonicalLandingDir,
    filesInCanonicalLanding: canonicalLandingListing,
    caseSensitiveMismatch:
      requestedPath.toLowerCase().includes("landing") && requestedPath.toLowerCase().includes("containercreationslanding-5")
        ? `Requested filename "${exactJsonFilenameSearched}" vs on disk: ${canonicalLandingListing.filter((f) => f.toLowerCase().includes("containercreationslanding-5")).join(", ") || "none"}`
        : undefined,
  });
  return NextResponse.json(
    {
      error: "Screen not found",
      requested: requestedPath,
      code: "SCREEN_NOT_FOUND",
    },
    { status: 404 }
  );
}

