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

type LiveFolderResolution = {
  domainFolder: string;
  subdomainFolder: string;
  routeFolder: string;
  slug: string;
  folderPath: string;
};

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

function parseHostParts(host?: string): { subdomain: string; root: string } {
  const normalized = (host ?? "").trim().toLowerCase();
  const hostNoPort = normalized.split(":")[0] ?? "";
  if (!hostNoPort) return { subdomain: "", root: "" };
  const parts = hostNoPort.split(".").filter(Boolean);
  if (parts.length < 2) return { subdomain: "", root: hostNoPort };
  const root = parts.slice(-2).join(".");
  const subdomain = parts.length > 2 ? parts[0] : "";
  return { subdomain, root };
}

function assertNotRootFolder(folderPath: string): void {
  const normalized = path.normalize(folderPath);
  const appRoot = path.normalize(JSON_LIVE_ROOT);
  if (normalized === appRoot) {
    throw new Error(`[api/screens/resolve] Illegal resolver target: root folder used (${folderPath})`);
  }
}

function resolveLiveFolderFromHostAndSegments(
  host: string | undefined,
  segments: string[]
): LiveFolderResolution {
  const slug = stripJsonSuffix(segments[segments.length - 1] ?? "");

  let domainFolder = segments[0] ?? "";
  let subdomainFolder = segments[1] ?? "";
  let routeFolder = segments[2] ?? "landing";

  if (segments.length === 1) {
    const { subdomain, root } = parseHostParts(host);
    if (root.includes("containercreations")) {
      domainFolder = "ContainerCreations";
      subdomainFolder = subdomain ? subdomain[0].toUpperCase() + subdomain.slice(1) : "Learn";
      routeFolder = "landing";
    }
  } else {
    routeFolder = routeFolder.toLowerCase() === slug.toLowerCase() ? "landing" : routeFolder;
  }

  const folderPath = path.join(JSON_LIVE_ROOT, domainFolder, subdomainFolder, routeFolder);
  assertNotRootFolder(folderPath);
  return { domainFolder, subdomainFolder, routeFolder, slug, folderPath };
}

function runResolverRuntimeAssertions(host: string | undefined): void {
  const basePath = path.join(JSON_LIVE_ROOT, "ContainerCreations", "Learn", "landing");
  const cases = [
    {
      host: host ?? "learn.containercreations.com",
      segments: ["ContainerCreationsLanding-5"],
      expected: basePath,
    },
    {
      host: host ?? "learn.containercreations.com",
      segments: ["ContainerCreations", "Learn", "landing", "ContainerCreationsLanding-5"],
      expected: basePath,
    },
  ];

  for (const c of cases) {
    const result = resolveLiveFolderFromHostAndSegments(c.host, c.segments);
    console.log("RESOLVER TEST RESULT:", {
      host: c.host,
      segments: c.segments,
      domainFolder: result.domainFolder,
      subdomainFolder: result.subdomainFolder,
      routeFolder: result.routeFolder,
      folderPath: result.folderPath,
    });
    if (path.normalize(result.folderPath) !== path.normalize(c.expected)) {
      throw new Error(
        `[api/screens/resolve] Resolver assertion failed. Expected ${c.expected}, got ${result.folderPath}`
      );
    }
    if (path.normalize(result.folderPath) === path.normalize(JSON_LIVE_ROOT)) {
      throw new Error("[api/screens/resolve] Resolver assertion failed: folderPath points to src/01_App root");
    }
  }
}

function resolveJsonFromLiveRoot(segments: string[], host?: string): ResolvePayload | null {
  if (!segments.length) return null;

  const { domainFolder, subdomainFolder, routeFolder, slug, folderPath } =
    resolveLiveFolderFromHostAndSegments(host, segments);
  let files: string[] = [];
  try {
    files = fs
      .readdirSync(folderPath, { withFileTypes: true })
      .filter((e) => e.isFile())
      .map((e) => e.name);
  } catch {
    files = [];
  }
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
  req: Request,
  { params }: { params: { path?: string[] } }
) {
  if (!params?.path?.length) {
    return NextResponse.json({ error: "No screen path provided" }, { status: 400 });
  }

  const segments = params.path.filter(Boolean);
  const requestedPath = segments.join("/");
  const hostHeader = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? undefined;
  runResolverRuntimeAssertions(hostHeader);

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
  const jsonLive = resolveJsonFromLiveRoot(segments, hostHeader);
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

  const slugForTrace = stripJsonSuffix(segments[segments.length - 1] ?? "");
  const domainForTrace = segments[0] ?? "";
  const subdomainForTrace = segments[1] ?? "";
  const resolvedRouteForTrace = segments[2] ?? "landing";
  const routeFolderForTrace =
    resolvedRouteForTrace.toLowerCase() === slugForTrace.toLowerCase() ? "landing" : resolvedRouteForTrace;
  const folderForLiveJson = path.join(
    JSON_LIVE_ROOT,
    domainForTrace,
    subdomainForTrace,
    routeFolderForTrace
  );
  let dirListingAttempted: string[] = [];
  try {
    dirListingAttempted = fs
      .readdirSync(folderForLiveJson, { withFileTypes: true })
      .filter((e) => e.isFile())
      .map((e) => e.name);
  } catch {
    dirListingAttempted = [];
  }
  const canonicalLandingDir = path.join(JSON_LIVE_ROOT, "ContainerCreations", "Learn", "landing");
  const canonicalLandingListing = fs.existsSync(canonicalLandingDir)
    ? fs.readdirSync(canonicalLandingDir, { withFileTypes: true }).filter((e) => e.isFile()).map((e) => e.name)
    : [];
  console.warn("[api/screens/resolve] SCREEN_UNRESOLVED_AFTER_FS_LOOKUP", {
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
      error: "SCREEN_UNRESOLVED_AFTER_FS_LOOKUP",
      requested: requestedPath,
      code: "SCREEN_UNRESOLVED_AFTER_FS_LOOKUP",
    },
    { status: 404 }
  );
}

