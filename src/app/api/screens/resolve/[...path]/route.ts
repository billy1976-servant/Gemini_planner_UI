import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type ResolvedType = "json" | "tsx";

type ResolvePayload = {
  type: ResolvedType;
  path: string;
  resolvedFilePath: string;
  source: "live-json" | "tsx";
};

type LiveFolderResolution = {
  domainFolder: string;
  subdomainFolder: string;
  routeFolder: string;
  slug: string;
  folderPath: string;
};

function parseHostParts(host?: string): { subdomain: string; root: string } {
  if (!host) throw new Error("RESOLVE FAILED — INVALID PATH OR FILE NOT FOUND");
  const normalized = host.trim().toLowerCase();
  const hostNoPort = normalized.split(":")[0];
  if (!hostNoPort) throw new Error("RESOLVE FAILED — INVALID PATH OR FILE NOT FOUND");

  // Contract requires exactly: {subdomain}.{root}
  // Examples:
  // - learn.containercreations.com
  // - christian.hiclarify.com
  const parts = hostNoPort.split(".").filter(Boolean);
  if (parts.length !== 3) {
    throw new Error(
      `[api/screens/resolve] Invalid host format for filesystem contract (expected subdomain.root with 2 TLD parts): ${hostNoPort}`
    );
  }

  const root = parts.slice(-2).join(".");
  const subdomain = parts[0];
  return { subdomain, root };
}

function resolveLiveFolderFromHostAndSegments(
  host: string | undefined,
  segments: string[],
  domainFolder: string,
  basePath: string
): LiveFolderResolution {
  if (segments.length < 2) {
    throw new Error("INVALID PATH — MUST BE routeFolder/fileStem");
  }

  const { subdomain } = parseHostParts(host);

  // subdomainFolder = from host subdomain
  const subdomainFolder =
    subdomain === "learn"
      ? "Learn"
      : subdomain === "christian"
        ? "Christian"
        : (() => {
            throw new Error(`[api/screens/resolve] INVALID HOST SUBDOMAIN — ${subdomain}`);
          })();

  // routeFolder = from URL FIRST segment
  const routeFolder = segments[0];

  // fileStem = from URL LAST segment (NO suffix stripping; contract is prefix-match against on-disk filenames)
  const slug = segments[segments.length - 1];

  const folderPath = path.join(basePath, subdomainFolder, routeFolder);

  // HARD ASSERTION (NEVER SILENT FAIL)
  if (!folderPath.includes(domainFolder) || !folderPath.includes(subdomainFolder)) {
    throw new Error("FOLDER RESOLUTION BROKE — HOST MAPPING FAILED");
  }

  const folderPathUnix = folderPath.replace(/\\/g, "/");
  if (folderPathUnix.endsWith("src/01_App")) {
    throw new Error("INVALID ROOT FALLBACK — NOT ALLOWED");
  }

  return { domainFolder, subdomainFolder, routeFolder, slug, folderPath };
}

function runResolverRuntimeAssertions(host: string | undefined): void {
  const tests = [
    {
      host: "learn.containercreations.com",
      segments: ["landing", "ContainerCreationsLanding-5"],
      expected: path.join(process.cwd(), "src", "01_App", "ContainerCreations", "Learn", "landing"),
    },
    {
      host: "christian.hiclarify.com",
      segments: ["prayer", "prayerapp"],
      expected: path.join(process.cwd(), "src", "01_App", "HIClarify", "Christian", "prayer"),
    },
  ];

  try {
    for (const t of tests) {
      const domainFolder = t.host?.includes("containercreations.com")
        ? "ContainerCreations"
        : "HIClarify";
      const basePath = path.join(process.cwd(), "src", "01_App", domainFolder);
      const result = resolveLiveFolderFromHostAndSegments(t.host, t.segments, domainFolder, basePath);
      if (path.normalize(result.folderPath).toLowerCase() !== path.normalize(t.expected).toLowerCase()) {
        throw new Error(
          `[api/screens/resolve] Resolver assertion failed.\nhost=${t.host}\nsegments=${JSON.stringify(t.segments)}\nexpectedFolder=${t.expected}\ngotFolder=${result.folderPath}`
        );
      }
    }
  } catch (err) {
    console.error("[api/screens/resolve] ❌ Filesystem contract runtime tests failed (full trace below)");
    console.error(err);
    throw err;
  }
}

function resolveLiveScreenFromFilesystemContract(
  host: string | undefined,
  segments: string[],
  domainFolder: string,
  basePath: string
): ResolvePayload {
  const { subdomainFolder, routeFolder, slug: fileStem, folderPath } = resolveLiveFolderFromHostAndSegments(
    host,
    segments,
    domainFolder,
    basePath
  );

  console.log("COMPUTED PATH:", {
    domainFolder,
    subdomainFolder,
    routeFolder,
    fileStem,
    folderPath,
  });

  // STEP 2 — SCAN FOLDER (NO DIRECT FILE BUILDING)
  // Contract: match filename prefix against `fileStem`
  let files: string[];
  try {
    files = fs.readdirSync(folderPath);
  } catch (err) {
    console.error("FILES IN TARGET FOLDER read failed:", {
      folderPath,
      err,
    });
    throw new Error("RESOLVE FAILED — INVALID PATH OR FILE NOT FOUND");
  }

  console.log("FILES IN TARGET FOLDER:", files);

  const fileStemLower = fileStem.toLowerCase();
  const matching = files.filter((filename) => filename.toLowerCase().startsWith(fileStemLower));

  if (!matching.length) {
    throw new Error("RESOLVE FAILED — INVALID PATH OR FILE NOT FOUND");
  }

  // STEP 3 — TSX + JSON SUPPORT (SAME FOLDER)
  const tsxFile = matching.find((filename) => filename.toLowerCase().endsWith(".tsx"));
  if (tsxFile) {
    return {
      type: "tsx",
      // Frontend TSX loader keys are domain/subdomain/route (fileStem is not part of loader keys)
      path: [domainFolder, subdomainFolder, routeFolder].join("/"),
      resolvedFilePath: path.join(folderPath, tsxFile),
      source: "tsx",
    };
  }

  const jsonFile = matching.find((filename) => filename.toLowerCase().endsWith(".json"));
  if (jsonFile) {
    return {
      type: "json",
      path: [domainFolder, subdomainFolder, routeFolder, jsonFile].join("/"),
      resolvedFilePath: path.join(folderPath, jsonFile),
      source: "live-json",
    };
  }

  throw new Error("RESOLVE FAILED — INVALID PATH OR FILE NOT FOUND");
}

export async function GET(
  req: Request,
  { params }: { params: { path?: string[] } }
) {
  if (!params?.path?.length) {
    throw new Error("RESOLVE FAILED — INVALID PATH OR FILE NOT FOUND");
  }

  const rawSegments = params.path || [];

  const segments = rawSegments.filter((s) => {
    if (!s) return false;
    if (s.includes(".")) return false; // REMOVE ANY DOMAIN OR HOST VALUES
    return true;
  });

  console.log("CLEAN SEGMENTS:", segments);
  console.log("RAW PARAMS.PATH:", params.path);
  console.log("FINAL SEGMENTS USED:", segments);
  let hostHeader = req.headers.get("x-forwarded-host");
  if (!hostHeader) hostHeader = req.headers.get("host");

  const host = req.headers.get("host") || "";

  let domainFolder = null;

  if (host.includes("hiclarify.com")) {
    domainFolder = "HiClarify";
  } else if (host.includes("containercreations.com")) {
    domainFolder = "ContainerCreations";
  } else {
    throw new Error("UNKNOWN DOMAIN — BLOCKED");
  }

  const basePath = path.join(process.cwd(), "src", "01_App", domainFolder);

  console.log("LOCKED BASE PATH:", basePath);

  console.log("RESOLVER INPUT:", {
    host: hostHeader,
    segments: params.path,
  });

  runResolverRuntimeAssertions(hostHeader);

  // Strict contract resolution only
  const resolved = resolveLiveScreenFromFilesystemContract(hostHeader, segments, domainFolder, basePath);
  return NextResponse.json(resolved);
}

