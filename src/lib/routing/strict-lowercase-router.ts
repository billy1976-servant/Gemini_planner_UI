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
  if (!Array.isArray(segments) || segments.length !== 2) {
    throw new Error("STRICT_ROUTER_INVALID_PATH_FORMAT");
  }

  const [route, file] = segments;
  assertLowercaseExact(route, "route");
  assertLowercaseExact(file, "file");

  if (route.includes(".") || file.includes(".") || route.includes("/") || file.includes("/")) {
    throw new Error("STRICT_ROUTER_INVALID_PATH_SEGMENT");
  }

  return { route, file };
}

export function resolveStrictLowercaseRoute(hostHeader: string, segments: string[]): StrictResolvedPayload {
  const { host, domain, subdomain } = parseStrictHost(hostHeader);
  const { route, file } = parseStrictSegments(segments);

  const domainFolder = ROOT_DOMAIN_TO_FOLDER[domain];
  const basePath = path.join(process.cwd(), "src", "01_App", domainFolder, subdomain, route);
  const jsonPath = path.join(basePath, `${file}.json`);
  const tsxPath = path.join(basePath, `${file}.tsx`);

  let resolvedType: StrictResolvedType | null = null;
  let fullPath = "";
  let responsePath = "";
  let jsonData: any | undefined = undefined;

  if (fs.existsSync(jsonPath)) {
    resolvedType = "json";
    fullPath = jsonPath;
    responsePath = `${domainFolder}/${subdomain}/${route}/${file}.json`;
    const fileContent = fs.readFileSync(jsonPath, "utf8");
    if (!fileContent.trim()) {
      throw new Error("STRICT_ROUTER_JSON_FILE_EMPTY");
    }
    jsonData = JSON.parse(fileContent);
  } else if (fs.existsSync(tsxPath)) {
    resolvedType = "tsx";
    fullPath = tsxPath;
    responsePath = `${domainFolder}/${subdomain}/${route}/${file}`;
  } else {
    fullPath = tsxPath;
  }

  console.log({
    host,
    domain,
    subdomain,
    route,
    file,
    fullPath,
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
