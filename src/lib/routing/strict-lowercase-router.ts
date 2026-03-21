type StrictRouteResult = {
  type: "json";
  path: string;
};

const ROOT_TO_DOMAIN: Record<string, string> = {
  "containercreations.com": "containercreations",
  "hiclarify.com": "hiclarify",
};

function parseHost(host: string): { subdomain: string; root: string } {
  const normalized = host.toLowerCase().trim();
  const cleanHost = normalized.split(":")[0];
  const parts = cleanHost.split(".");

  if (parts.length < 3) {
    throw new Error("DOMAIN PARSE FAILED — NO FALLBACK ALLOWED");
  }

  return {
    subdomain: parts[0],
    root: parts.slice(-2).join("."),
  };
}

export function resolveStrictLowercaseRoute(host: string, pathSegments: string[]): StrictRouteResult {
  if (!pathSegments || pathSegments.length < 2) {
    throw new Error("RESOLVER FAILURE — DO NOT FALLBACK");
  }

  const route = pathSegments[0];
  const file = pathSegments[1];

  if (!route || route !== route.toLowerCase()) {
    throw new Error("ROUTE MUST BE LOWERCASE");
  }

  // Strict contract: file must clearly belong to the requested route folder.
  if (!file || !file.toLowerCase().startsWith(`${route}-`)) {
    throw new Error("FILE DOES NOT MATCH ROUTE");
  }

  const { subdomain, root } = parseHost(host);
  const domainFolder = ROOT_TO_DOMAIN[root];
  if (!domainFolder) {
    throw new Error("UNKNOWN ROOT DOMAIN");
  }

  return {
    type: "json",
    path: `${domainFolder}/${subdomain}/${route}/${file}.json`,
  };
}
