/**
 * Host-conditioned rewrites derived from flow folders and version `*.json` files.
 * Includes `learn.<app>.com/` → default flow/version so the main app `/` page is not served on learn hosts.
 * Required by next.config.js (CommonJS, no TS).
 */
const fs = require("fs");
const path = require("path");

function findRepoRoot(start) {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, "src", "01_App"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

function discoverLearnFlowRoots(o1AppBase) {
  const results = [];
  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (path.basename(path.dirname(full)) === "learn") {
          results.push(full);
          continue;
        }
        walk(full);
      }
    }
  }
  walk(o1AppBase);
  return results.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

const RESERVED_LEARN_FLOW_ROOT_JSON = new Set(["manifest.json"]);

function discoverDeckVersionStems(flowRootAbs) {
  let entries;
  try {
    entries = fs.readdirSync(flowRootAbs, { withFileTypes: true });
  } catch {
    return [];
  }
  const out = [];
  for (const e of entries) {
    if (!e.isFile()) continue;
    if (!e.name.endsWith(".json")) continue;
    if (RESERVED_LEARN_FLOW_ROOT_JSON.has(e.name.toLowerCase())) continue;
    const stem = e.name.slice(0, -".json".length).trim();
    if (!stem) continue;
    out.push(stem);
  }
  return out.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

function deriveDefaultVersion(availableVersions) {
  if (availableVersions.includes("v1")) return "v1";
  return availableVersions[0] || "v1";
}

function normalizeDeckAppKey(appKey) {
  const k = String(appKey || "").trim().toLowerCase();
  if (k === "container-creations") return "containercreations";
  if (k === "gospel-discipleship") return "hiclarify";
  return k;
}

/** @returns {Array<{ source: string; has: Array<{ type: string; value: string }>; destination: string }>} */
function getHostRewritesBeforeFiles() {
  const root = findRepoRoot(process.cwd());
  const o1 = path.join(root, "src", "01_App");
  if (!fs.existsSync(o1)) return [];

  const rules = [];
  const seen = new Set();
  /** One `/` → default deck per `learn.<app>.com` (otherwise `/` hits the main app `page.tsx`). */
  const seenHostRootRewrite = new Set();

  for (const flowRoot of discoverLearnFlowRoots(o1)) {
    const learnDir = path.dirname(flowRoot);
    const learnFolder = path.basename(learnDir);
    const flowFromPath = path.basename(flowRoot);
    const brandFromPathRaw = path.basename(path.dirname(learnDir));
    const appKey = normalizeDeckAppKey(brandFromPathRaw);
    const availableVersions = discoverDeckVersionStems(flowRoot);
    const defaultVersion = deriveDefaultVersion(availableVersions);
    if (learnFolder !== "learn") continue;
    if (!/^[a-z0-9]+$/.test(brandFromPathRaw)) continue;
    if (!flowFromPath || !appKey || availableVersions.length === 0) continue;

    const host = `learn.${appKey}.com`;
    if (!seenHostRootRewrite.has(host)) {
      seenHostRootRewrite.add(host);
      const rootDest = `/learn/${encodeURIComponent(appKey)}/${encodeURIComponent(flowFromPath)}/${encodeURIComponent(defaultVersion)}`;
      const rootKey = `${host}|/|${rootDest}`;
      if (!seen.has(rootKey)) {
        seen.add(rootKey);
        rules.push({
          source: "/",
          has: [{ type: "host", value: host }],
          destination: rootDest,
        });
      }
    }
    const defaultSource = `/${flowFromPath}`;
    const defaultDestination = `/learn/${encodeURIComponent(appKey)}/${encodeURIComponent(flowFromPath)}/${encodeURIComponent(defaultVersion)}`;
    const defaultKey = `${host}|${defaultSource}|${defaultDestination}`;
    if (!seen.has(defaultKey)) {
      seen.add(defaultKey);
      rules.push({
        source: defaultSource,
        has: [{ type: "host", value: host }],
        destination: defaultDestination,
      });
    }

    for (const versionKey of availableVersions) {
      const source = `/${flowFromPath}/${versionKey}`;
      const destination = `/learn/${encodeURIComponent(appKey)}/${encodeURIComponent(flowFromPath)}/${encodeURIComponent(versionKey)}`;
      const key = `${host}|${source}|${destination}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rules.push({
        source,
        has: [{ type: "host", value: host }],
        destination,
      });
    }
  }

  return rules;
}

module.exports = { getHostRewritesBeforeFiles, findRepoRoot };
