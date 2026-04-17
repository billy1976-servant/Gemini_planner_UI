import fs from "fs";
import path from "path";
import type { DeckCatalogEntry, DeckRef, DeckResolveResult } from "./types";
import { normalizeDeckAppKey } from "./legacy-app-keys";

export function findRepoRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, "src", "01_App"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

const REPO_ROOT = findRepoRoot(process.cwd());
const O1_APP_BASE = path.join(REPO_ROOT, "src", "01_App");

function toPosixRel(fromRepoRootAbs: string): string {
  const rel = path.relative(REPO_ROOT, fromRepoRootAbs);
  return rel.split(path.sep).join("/");
}

function isPathInsideDir(childAbs: string, dirAbs: string): boolean {
  const resolvedChild = path.resolve(childAbs);
  const resolvedDir = path.resolve(dirAbs);
  const rel = path.relative(resolvedDir, resolvedChild);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

export function discoverLearnFlowRoots(): string[] {
  const results: string[] = [];
  if (!fs.existsSync(O1_APP_BASE)) return results;

  function walk(dir: string) {
    let entries: fs.Dirent[];
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

  walk(O1_APP_BASE);
  return results.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

/** Root JSON filenames that are not learn version decks (flow folder only). */
const RESERVED_LEARN_FLOW_ROOT_JSON = new Set(["manifest.json"]);

function learnVersionStemFromRootFileName(fileName: string): string | null {
  if (!fileName.endsWith(".json")) return null;
  if (RESERVED_LEARN_FLOW_ROOT_JSON.has(fileName.toLowerCase())) return null;
  const stem = fileName.slice(0, -".json".length).trim();
  if (!stem) return null;
  return stem;
}

function discoverDeckVersionStems(flowRootAbs: string): string[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(flowRootAbs, { withFileTypes: true });
  } catch {
    return [];
  }
  const versions: string[] = [];
  for (const e of entries) {
    if (!e.isFile()) continue;
    const stem = learnVersionStemFromRootFileName(e.name);
    if (stem == null) continue;
    versions.push(stem);
  }
  return versions.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

function deriveDefaultVersion(availableVersions: string[]): string {
  if (availableVersions.includes("v1")) return "v1";
  return availableVersions[0] ?? "v1";
}

function discoverSchemaKeys(flowRootAbs: string): string[] {
  const schemasDir = path.join(flowRootAbs, "schemas");
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(schemasDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const e of entries) {
    if (!e.isFile()) continue;
    if (!e.name.endsWith(".json")) continue;
    const key = e.name.slice(0, -".json".length).trim();
    if (!key) continue;
    out.push(key);
  }
  return out.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

export function loadCatalog(): DeckCatalogEntry[] {
  const entries: DeckCatalogEntry[] = [];
  const seenAppFlow = new Set<string>();
  for (const flowRootAbs of discoverLearnFlowRoots()) {
    const learnDirAbs = path.dirname(flowRootAbs);
    const learnFolder = path.basename(learnDirAbs);
    const flowKeyFromPath = path.basename(flowRootAbs);
    const brandFromPathRaw = path.basename(path.dirname(learnDirAbs));
    const appKey = normalizeDeckAppKey(brandFromPathRaw);
    const availableVersions = discoverDeckVersionStems(flowRootAbs);

    if (learnFolder !== "learn") continue;
    if (!/^[a-z0-9]+$/.test(brandFromPathRaw)) continue;
    if (availableVersions.length === 0) continue;

    const flowKey = `${appKey}\0${flowKeyFromPath}`;
    if (seenAppFlow.has(flowKey)) {
      if (typeof console !== "undefined" && typeof console.warn === "function") {
        console.warn(
          `[deck-platform] Duplicate flow folder for ${appKey}/${flowKeyFromPath}; skipping ${toPosixRel(flowRootAbs)}`
        );
      }
      continue;
    }
    seenAppFlow.add(flowKey);
    entries.push({
      deckRef: {
        appKey,
        flowKey: flowKeyFromPath,
        defaultVersion: deriveDefaultVersion(availableVersions),
      },
      title: flowKeyFromPath,
      availableVersions,
      flowRootRelPath: toPosixRel(flowRootAbs),
      flowRootAbsPath: flowRootAbs,
    });
  }
  return entries;
}

function catalogIndexByAppFlow(catalog: DeckCatalogEntry[]): Map<string, DeckCatalogEntry> {
  const m = new Map<string, DeckCatalogEntry>();
  for (const e of catalog) {
    m.set(`${e.deckRef.appKey}\0${e.deckRef.flowKey}`, e);
  }
  return m;
}

export function normalizeVersionKey(
  requested: string | null | undefined,
  available: string[],
  defaultVersion: string
): string | null {
  if (requested == null || String(requested).trim() === "") {
    return defaultVersion;
  }
  let t = String(requested).trim();
  if (available.includes(t)) return t;
  if (t.toLowerCase().endsWith(".json")) {
    t = t.slice(0, -".json".length).trim();
  }
  if (available.includes(t)) return t;
  return null;
}

/** Absolute path to `<flowRoot>/<stem>.json` for a catalog version key. */
export function learnVersionAbsPath(flowRootAbs: string, versionKey: string): string {
  let base = String(versionKey).trim();
  if (base.toLowerCase().endsWith(".json")) {
    base = base.slice(0, -".json".length).trim();
  }
  return path.join(flowRootAbs, `${base}.json`);
}

function versionFileAbs(flowRootAbs: string, versionKey: string): string {
  return learnVersionAbsPath(flowRootAbs, versionKey);
}

function deepMerge<T extends Record<string, unknown>>(base: T, patch: Record<string, unknown>): T {
  const out = { ...base } as Record<string, unknown>;
  for (const [k, val] of Object.entries(patch)) {
    if (val != null && typeof val === "object" && !Array.isArray(val) && out[k] != null && typeof out[k] === "object" && !Array.isArray(out[k])) {
      out[k] = deepMerge(out[k] as Record<string, unknown>, val as Record<string, unknown>);
    } else {
      out[k] = val;
    }
  }
  return out as T;
}

function schemaFileAbs(flowRootAbs: string, schemaKey: string): string {
  const safe = schemaKey.replace(/[^a-zA-Z0-9._-]/g, "");
  return path.join(flowRootAbs, "schemas", `${safe}.json`);
}

/**
 * Resolve deck file for (appKey, flowKey, version, optional schema).
 */
export function resolveDeck(args: {
  appKey: string;
  flowKey: string;
  version?: string | null;
  schema?: string | null;
  includeBody?: boolean;
  catalog?: DeckCatalogEntry[];
}): DeckResolveResult {
  const appKey = normalizeDeckAppKey(args.appKey);
  const flowKey = args.flowKey.trim();
  const catalog = args.catalog ?? loadCatalog();
  const idx = catalogIndexByAppFlow(catalog);
  const entry = idx.get(`${appKey}\0${flowKey}`);
  if (!entry) {
    return { ok: false, error: `Unknown deck: app=${appKey} flow=${flowKey}`, status: 404 };
  }

  const versionKey = normalizeVersionKey(args.version, entry.availableVersions, entry.deckRef.defaultVersion);
  if (versionKey == null) {
    return {
      ok: false,
      error: `Invalid version. Allowed: ${entry.availableVersions.join(", ")}`,
      status: 400,
    };
  }

  const availableSchemas = discoverSchemaKeys(entry.flowRootAbsPath);
  let effectiveSchema: string | undefined = undefined;
  if (args.schema != null && String(args.schema).trim() !== "") {
    const requested = String(args.schema).trim();
    if (!availableSchemas.includes(requested)) {
      return {
        ok: false,
        error: `Schema not found. Allowed: ${availableSchemas.join(", ") || "(none)"}`,
        status: 400,
      };
    }
    effectiveSchema = requested;
  }

  const versionAbs = versionFileAbs(entry.flowRootAbsPath, versionKey);
  if (!isPathInsideDir(versionAbs, entry.flowRootAbsPath)) {
    return { ok: false, error: "Invalid version path.", status: 400 };
  }
  if (!fs.existsSync(versionAbs)) {
    return {
      ok: false,
      error: `Deck file missing for version ${versionKey}: ${toPosixRel(versionAbs)}`,
      status: 404,
    };
  }

  let schemaAbs: string | undefined;
  if (effectiveSchema) {
    schemaAbs = schemaFileAbs(entry.flowRootAbsPath, effectiveSchema);
    if (!isPathInsideDir(schemaAbs, entry.flowRootAbsPath)) {
      return { ok: false, error: "Invalid schema path.", status: 400 };
    }
    if (!fs.existsSync(schemaAbs)) {
      return {
        ok: false,
        error: `Schema file missing: ${toPosixRel(schemaAbs)}`,
        status: 404,
      };
    }
  }

  const deckRef: DeckRef = {
    appKey: entry.deckRef.appKey,
    flowKey: entry.deckRef.flowKey,
    versionKey,
    schemaKey: effectiveSchema,
  };

  const metadata = {
    deckRef,
    flowRootRelPath: entry.flowRootRelPath,
    versionFileRelPath: toPosixRel(versionAbs),
    schemaFileRelPath: schemaAbs ? toPosixRel(schemaAbs) : undefined,
    title: entry.title,
    availableVersions: [...entry.availableVersions],
    ...(availableSchemas.length > 0
      ? { allowedSchemas: [...availableSchemas] }
      : {}),
  };

  if (!args.includeBody) {
    return { ok: true, metadata };
  }

  let deck: unknown;
  try {
    const vRaw = fs.readFileSync(versionAbs, "utf8");
    deck = JSON.parse(vRaw) as unknown;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `Failed to read deck JSON: ${msg}`, status: 500 };
  }

  if (schemaAbs) {
    try {
      const sRaw = fs.readFileSync(schemaAbs, "utf8");
      const patch = JSON.parse(sRaw) as unknown;
      if (patch != null && typeof patch === "object" && !Array.isArray(patch) && deck != null && typeof deck === "object" && !Array.isArray(deck)) {
        deck = deepMerge(deck as Record<string, unknown>, patch as Record<string, unknown>);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, error: `Failed to apply schema: ${msg}`, status: 500 };
    }
  }

  return { ok: true, metadata, deck };
}

export function getO1AppBaseAbs(): string {
  return O1_APP_BASE;
}

export function getRepoRootAbs(): string {
  return REPO_ROOT;
}
