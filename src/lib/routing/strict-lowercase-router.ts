import fs from "fs";
import path from "path";

export type StrictResolvedType = "json" | "tsx";

export type StrictResolvedPayload = {
  type: StrictResolvedType;
  path: string;
  resolvedFilePath: string;
  jsonData?: any;
};

const ROOT_DOMAIN_TO_FOLDER: Record<string, string> = {
  "containercreations.com": "containercreations",
  "hiclarify.com": "hiclarify",
};

function assertLowercaseExact(value: string, label: string): void {
  if (!value || value !== value.toLowerCase()) {
    throw new Error(`STRICT_ROUTER_INVALID_${label.toUpperCase()}`);
  }
}

function parseStrictHost(hostHeader: string): { host: string; domain: string; subdomain: string } {
  const hostWithPort = hostHeader.trim();
  if (!hostWithPort) {
    throw new Error("STRICT_ROUTER_INVALID_HOST");
  }

  assertLowercaseExact(hostWithPort, "host");

  const host = hostWithPort.split(":")[0];
  const parts = host.split(".").filter(Boolean);
  if (parts.length !== 3) {
    throw new Error("STRICT_ROUTER_INVALID_HOST_FORMAT");
  }

  const subdomain = parts[0];
  const domain = `${parts[1]}.${parts[2]}`;

  assertLowercaseExact(subdomain, "subdomain");
  assertLowercaseExact(domain, "domain");

  if (!ROOT_DOMAIN_TO_FOLDER[domain]) {
    throw new Error("STRICT_ROUTER_UNKNOWN_DOMAIN");
  }

  return { host, domain, subdomain };
}

function parseStrictSegments(segments: string[]): { route: string; file: string } {
  if (!Array.isArray(segments) || segments.length < 1) {
    throw new Error("STRICT_ROUTER_INVALID_PATH_FORMAT");
  }

  for (const segment of segments) {
    assertLowercaseExact(segment, "route_segment");
    if (!segment || segment.includes(".") || segment.includes("/")) {
      throw new Error("STRICT_ROUTER_INVALID_PATH_SEGMENT");
    }
  }

  const route = segments.join("/");
  const file = segments[segments.length - 1];
  return { route, file };
}

export function resolveStrictLowercaseRoute(hostHeader: string, segments: string[]): StrictResolvedPayload {
  const { host, domain, subdomain } = parseStrictHost(hostHeader);
  const { route, file } = parseStrictSegments(segments);

  const domainFolder = ROOT_DOMAIN_TO_FOLDER[domain];
  const basePath = path.join(process.cwd(), "src", "01_App", domainFolder, subdomain);
  const routePath = path.join(basePath, ...segments);
  const routeParentPath = path.join(basePath, ...segments.slice(0, -1));
  const routeLeaf = file;

  const candidates = [
    { type: "json" as const, path: `${routePath}.json` }, // direct file match
    { type: "tsx" as const, path: `${routePath}.tsx` }, // direct file match
    { type: "json" as const, path: path.join(routePath, "index.json") }, // folder index
    { type: "tsx" as const, path: path.join(routePath, "index.tsx") }, // folder index
    { type: "json" as const, path: path.join(routePath, `${routeLeaf}.json`) }, // leaf fallback
    { type: "tsx" as const, path: path.join(routePath, `${routeLeaf}.tsx`) }, // leaf fallback
    { type: "json" as const, path: path.join(routeParentPath, `${routeLeaf}.json`) }, // parent leaf fallback
    { type: "tsx" as const, path: path.join(routeParentPath, `${routeLeaf}.tsx`) }, // parent leaf fallback
  ];

  let resolvedType: StrictResolvedType | null = null;
  let fullPath = "";
  let responsePath = "";
  let jsonData: any | undefined = undefined;

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate.path)) continue;
    resolvedType = candidate.type;
    fullPath = candidate.path;
    if (candidate.type === "json") {
      responsePath = path
        .relative(path.join(process.cwd(), "src", "01_App"), candidate.path)
        .replace(/\\/g, "/");
      const fileContent = fs.readFileSync(candidate.path, "utf8");
      if (!fileContent.trim()) {
        throw new Error("STRICT_ROUTER_JSON_FILE_EMPTY");
      }
      jsonData = JSON.parse(fileContent);
    } else {
      responsePath = path
        .relative(path.join(process.cwd(), "src", "01_App"), candidate.path)
        .replace(/\\/g, "/")
        .replace(/\.tsx$/i, "");
    }
    break;
  }

  console.log({
    host,
    domain,
    subdomain,
    route,
    segments,
    resolvedFilePath: fullPath,
  });

  if (!resolvedType) {
    throw new Error("STRICT_ROUTER_FILE_NOT_FOUND");
  }

  return {
    type: resolvedType,
    path: responsePath,
    resolvedFilePath: fullPath,
    ...(jsonData !== undefined ? { jsonData } : {}),
  };
}
