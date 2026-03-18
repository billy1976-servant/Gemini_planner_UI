/**
 * Run domain→subdomain→layout→flow resolution for learn.containercreations.com,
 * capture [domain-resolve] trace, and report the FIRST step that returns null/FALLBACK.
 * Run: npx ts-node -r tsconfig-paths/register scripts/trace-domain-resolve.ts
 */
process.env.NODE_ENV = "development";

const HOST = "learn.containercreations.com";

// Capture console.log for [domain-resolve] and [domain-map]
const origLog = console.log;
const captured: string[] = [];
console.log = (...args: unknown[]) => {
  const line = args.map((a) => (typeof a === "object" && a !== null ? JSON.stringify(a) : String(a))).join(" ");
  captured.push(line);
  origLog.apply(console, args);
};

const { getDomainSegmentForHost, getFolderForSubdomain } = require("../src/lib/domain-config.ts");
const { APP_MODULE_LOADERS } = require("../src/lib/app-loaders.ts");

function main() {
  console.log("\n========== DOMAIN RESOLUTION TRACE FOR", HOST, "==========\n");

  // Step 1: Resolver (getDomainSegmentForHost)
  const domainSegment = getDomainSegmentForHost(HOST);
  const resolverOk = domainSegment !== null;

  // Step 2: domainMap (getFolderForSubdomain) — use segment as domain (middleware rewrites to /segment)
  const domainForFolder = domainSegment ?? HOST;
  const folder = getFolderForSubdomain(domainForFolder);
  const domainMapOk = folder !== null;

  // Step 3: Loader (pathSegments = [] for root)
  const loaderKey = folder ?? "";
  const hasLoader = loaderKey in APP_MODULE_LOADERS;
  const loaderOk = hasLoader;

  console.log("\n========== SUMMARY ==========");
  console.log("Step 1 — Resolver (getDomainSegmentForHost):", resolverOk ? "OK" : "NULL/FALLBACK", "→", domainSegment);
  console.log("Step 2 — domainMap (getFolderForSubdomain):", domainMapOk ? "OK" : "NULL/FALLBACK", "→", folder);
  console.log("Step 3 — Loader (APP_MODULE_LOADERS):", loaderOk ? "OK" : "MISSING", "→", loaderKey, "hasKey:", hasLoader);

  // First failure
  let firstFailure: string | null = null;
  let inputAtFailure: string | null = null;
  let outputAtFailure: string | null = null;
  let expectedValue: string | null = null;

  if (!resolverOk) {
    firstFailure = "resolver";
    inputAtFailure = HOST;
    outputAtFailure = String(domainSegment);
    expectedValue = "learn.containercreations.com (full host, containercreations branch)";
  } else if (!domainMapOk) {
    firstFailure = "domainMap";
    inputAtFailure = domainForFolder;
    outputAtFailure = String(folder);
    expectedValue = "ContainerCreations/Learn/landing (Domain/Subdomain/Route, default route)";
  } else if (!loaderOk) {
    firstFailure = "loader";
    inputAtFailure = loaderKey;
    outputAtFailure = "missing key";
    expectedValue = "ContainerCreations/Learn/landing in APP_MODULE_LOADERS; folder: src/01_App/ContainerCreations/Learn/landing/ContainerCreationsLanding.tsx";
  }

  if (firstFailure) {
    console.log("\n========== FIRST NULL/FALLBACK ==========");
    console.log("Step:", firstFailure);
    console.log("Input at this step:", inputAtFailure);
    console.log("Output at this step:", outputAtFailure);
    console.log("Expected (from folder structure / config):", expectedValue);
  } else {
    console.log("\nAll steps OK — no FALLBACK (logic passes for this host in isolation).");
    console.log("If the app still fails for learn.containercreations.com, the actual request may have different input:");
    console.log("  - Check Host header in middleware (proxy/staging can change it).");
    console.log("  - In browser, check window.location.hostname and pathname after load.");
    console.log("  - Run: npm run dev, then curl -H 'Host: learn.containercreations.com' http://localhost:3000/ and check terminal [middleware] logs.");
  }

  console.log("\n========== FULL [domain-resolve] CAPTURE ==========");
  captured.filter((l) => l.includes("[domain-resolve]") || l.includes("[domain-map]")).forEach((l) => console.log(l));
}

main();
