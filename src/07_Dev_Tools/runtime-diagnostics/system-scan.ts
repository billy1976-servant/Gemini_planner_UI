/**
 * System Control Center — architecture scan engine.
 * READ-ONLY: walks file tree, counts, classifies, detects issues. No file moves or rewrites.
 * Intended for use from API route (Node only: uses fs/path).
 */

import * as fs from "fs";
import * as path from "path";

export type ScanOptions = {
  scanEngines?: boolean;
  scanRuntime?: boolean;
  scanUIBlocks?: boolean;
  scanRegistries?: boolean;
  scanApps?: boolean;
  scanPaths?: boolean;
  scanJsonDefinitions?: boolean;
  scanImports?: boolean;
  scanUnusedFiles?: boolean;
};

export type FolderStats = {
  path: string;
  folderCount: number;
  fileCount: number;
  subfolders: string[];
  byExt: Record<string, number>;
};

export type EngineEntry = {
  name: string;
  location: string;
  importUsageCount: number;
};

export type BlockStats = {
  atomsCount: number;
  compoundsCount: number;
  definitionFilesCount: number;
  schemaFilesCount: number;
  runtimeRenderersCount: number;
  paths: { atoms: string[]; compounds: string[]; definitions: string[]; schemas: string[] };
};

export type RegistryEntry = {
  path: string;
  name: string;
  duplicated?: boolean;
  duplicateOf?: string;
};

export type PathHealthItem = {
  kind: "require.context" | "dynamic.import" | "alias";
  path: string;
  root?: string;
  mismatch?: string;
};

export type SystemScanResult = {
  totals: {
    foldersScanned: number;
    tsxFiles: number;
    jsonFiles: number;
    enginesDetected: number;
    registries: number;
    loaders: number;
    runtimeModules: number;
    uiBlocks: number;
    screens: number;
    warningsCount: number;
    duplicatesCount: number;
    legacyPathsDetected: number;
  };
  systemStructure: Record<string, FolderStats>;
  engines: EngineEntry[];
  runtime: { path: string; fileCount: number; subfolders: string[] }[];
  blocks: BlockStats | null;
  registries: { entries: RegistryEntry[]; duplicated: string[]; total: number };
  apps: { screenCount: number; templateCount: number; generatedWebsitesCount: number; paths: string[] };
  pathHealth: PathHealthItem[];
  warnings: { id: string; message: string; severity: "info" | "warn" | "error" }[];
  suggestions: { area: string; fix: string }[];
};

const SRC_ROOTS = [
  "apps-tsx",
  "apps-json",
  "runtime",
  "engine",
  "logic",
  "ui",
  "components",
  "registry",
  "scripts",
] as const;

const REGISTRY_NAMES = [
  "registry.tsx",
  "registry.ts",
  "atoms.json",
  "molecules.json",
  "palettes.json",
  "screen-manifest.json",
  "molecule-definitions.json",
  "engine-registry",
  "action-registry",
  "calc-registry",
  "calculator.registry",
];

const LEGACY_PATTERNS = [
  "screens/core",
  "screens/tsx-screens",
  "apps-tsx/core",
  "apps-tsx/utils",
  "apps-tsx/screen-manifest.json",
];

function walkDir(dir: string, baseDir: string, list: string[]): void {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.relative(baseDir, full).replace(/\\/g, "/");
    if (e.isDirectory()) {
      if (!e.name.startsWith(".") && e.name !== "node_modules") {
        list.push(rel + "/");
        walkDir(full, baseDir, list);
      }
    } else {
      list.push(rel);
    }
  }
}

function countByExt(files: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const f of files) {
    if (f.endsWith("/")) continue;
    const ext = path.extname(f).slice(1) || "none";
    out[ext] = (out[ext] || 0) + 1;
  }
  return out;
}

function getSubfolders(files: string[], prefix: string): string[] {
  const seen = new Set<string>();
  for (const f of files) {
    if (!f.startsWith(prefix) || f === prefix) continue;
    const rest = f.slice(prefix.length).replace(/\\/g, "/");
    const first = rest.split("/")[0];
    if (first && !rest.includes("/", first.length + 1)) {
      if (rest.endsWith("/")) seen.add(first);
      else seen.add(first);
    }
  }
  return Array.from(seen).sort();
}

function scanFolder(rootDir: string, srcDir: string, folder: string): FolderStats {
  const dir = path.join(srcDir, folder);
  const all: string[] = [];
  walkDir(dir, srcDir, all);
  const files = all.filter((f) => !f.endsWith("/"));
  const dirs = all.filter((f) => f.endsWith("/"));
  const subfolders = getSubfolders(all, folder + "/");
  return {
    path: folder,
    folderCount: dirs.length,
    fileCount: files.length,
    subfolders,
    byExt: countByExt(files),
  };
}

function detectRegistries(rootDir: string, srcDir: string): { entries: RegistryEntry[]; duplicated: string[] } {
  const all: string[] = [];
  walkDir(srcDir, srcDir, all);
  const byName = new Map<string, string[]>();
  for (const f of all) {
    if (f.endsWith("/")) continue;
    const name = path.basename(f);
    if (REGISTRY_NAMES.some((r) => name === r || name.startsWith(r + "."))) {
      const key = name;
      if (!byName.has(key)) byName.set(key, []);
      byName.get(key)!.push(f);
    }
    if (name.endsWith("registry.ts") || name.endsWith("registry.tsx")) {
      const key = name;
      if (!byName.has(key)) byName.set(key, []);
      byName.get(key)!.push(f);
    }
  }
  const entries: RegistryEntry[] = [];
  const duplicated: string[] = [];
  for (const [name, paths] of byName.entries()) {
    for (const p of paths) {
      entries.push({
        path: p,
        name,
        duplicated: paths.length > 1,
        duplicateOf: paths.length > 1 ? paths[0] : undefined,
      });
      if (paths.length > 1 && p !== paths[0]) duplicated.push(p);
    }
  }
  return { entries, duplicated };
}

function detectLegacy(rootDir: string, allFiles: string[]): number {
  let count = 0;
  for (const f of allFiles) {
    const norm = f.replace(/\\/g, "/");
    if (LEGACY_PATTERNS.some((p) => norm.includes(p))) count++;
  }
  return count;
}

function detectEngines(srcDir: string): EngineEntry[] {
  const engineDirs = [
    path.join(srcDir, "engine", "core"),
    path.join(srcDir, "engine"),
    path.join(srcDir, "logic"),
    path.join(srcDir, "runtime"),
  ];
  const entries: EngineEntry[] = [];
  const seen = new Set<string>();
  for (const dir of engineDirs) {
    if (!fs.existsSync(dir)) continue;
    const list: string[] = [];
    walkDir(dir, srcDir, list);
    for (const f of list) {
      if (f.endsWith("/") || (!f.endsWith(".ts") && !f.endsWith(".tsx"))) continue;
      const rel = f.replace(/\\/g, "/");
      const name = path.basename(rel, path.extname(rel));
      if (seen.has(rel)) continue;
      seen.add(rel);
      entries.push({
        name: name === "index" ? path.dirname(rel) : name,
        location: rel,
        importUsageCount: 0,
      });
    }
  }
  return entries;
}

function scanBlocks(srcDir: string): BlockStats {
  const atomsDir = path.join(srcDir, "components", "atoms");
  const compoundsDir = path.join(srcDir, "compounds");
  const uiDir = path.join(srcDir, "ui");

  const collect = (dir: string, ext: string): string[] => {
    const out: string[] = [];
    if (!fs.existsSync(dir)) return out;
    walkDir(dir, srcDir, out);
    return out.filter((f) => !f.endsWith("/") && f.endsWith(ext));
  };

  const atoms = collect(atomsDir, ".tsx").filter((f) => !f.includes("/definitions/") && !f.includes("/engine/") && !f.includes("/map/"));
  const atomsDefs = collect(path.join(atomsDir, "definitions"), ".json");
  const compoundsList = collect(path.join(compoundsDir, "ui"), ".tsx").filter((f) => f.includes(".compound."));
  const compoundDefs = collect(path.join(compoundsDir, "ui"), ".json");
  const compoundSchemas = collect(path.join(compoundsDir, "schema"), ".json");
  const runtimeRenderers = collect(path.join(srcDir, "runtime", "screens"), ".tsx");

  return {
    atomsCount: atoms.length,
    compoundsCount: compoundsList.length,
    definitionFilesCount: atomsDefs.length + compoundDefs.length,
    schemaFilesCount: compoundSchemas.length,
    runtimeRenderersCount: runtimeRenderers.length,
    paths: {
      atoms: atoms,
      compounds: compoundsList,
      definitions: [...atomsDefs, ...compoundDefs],
      schemas: compoundSchemas,
    },
  };
}

function scanApps(srcDir: string): { screenCount: number; templateCount: number; generatedWebsitesCount: number; paths: string[] } {
  const appsTsx = path.join(srcDir, "apps-tsx");
  const appsJson = path.join(srcDir, "apps-json");
  const paths: string[] = [];
  let screenCount = 0;
  let templateCount = 0;
  let generatedWebsitesCount = 0;

  if (fs.existsSync(appsTsx)) {
    const list: string[] = [];
    walkDir(appsTsx, srcDir, list);
    const tsx = list.filter((f) => !f.endsWith("/") && f.endsWith(".tsx"));
    screenCount += tsx.length;
    paths.push(...tsx);
    const gen = path.join(appsTsx, "generated-websites");
    if (fs.existsSync(gen)) {
      const gw: string[] = [];
      walkDir(gen, srcDir, gw);
      generatedWebsitesCount = gw.filter((f) => f.includes("GeneratedScreen") || f.includes("CompiledSiteViewer")).length;
    }
  }
  if (fs.existsSync(appsJson)) {
    const list: string[] = [];
    walkDir(appsJson, srcDir, list);
    const json = list.filter((f) => !f.endsWith("/") && f.endsWith(".json"));
    templateCount += json.length;
  }
  return { screenCount, templateCount, generatedWebsitesCount, paths };
}

function scanRuntime(srcDir: string): { path: string; fileCount: number; subfolders: string[] }[] {
  const runtimeDir = path.join(srcDir, "runtime");
  if (!fs.existsSync(runtimeDir)) return [];
  const subs = fs.readdirSync(runtimeDir, { withFileTypes: true }).filter((e) => e.isDirectory());
  return subs.map((e) => {
    const dir = path.join(runtimeDir, e.name);
    const list: string[] = [];
    walkDir(dir, srcDir, list);
    const files = list.filter((f) => !f.endsWith("/"));
    return {
      path: `runtime/${e.name}`,
      fileCount: files.length,
      subfolders: getSubfolders(list, `runtime/${e.name}/`),
    };
  });
}

function gatherPathHealth(srcDir: string, allFiles: string[]): PathHealthItem[] {
  const items: PathHealthItem[] = [];
  const aliasRoots = ["@/apps-tsx", "@/runtime", "@/engine", "@/logic", "@/components", "@/components/atoms", "@/components/molecules", "@/components/organs", "@/ui", "@/registry"];
  for (const root of aliasRoots) {
    items.push({ kind: "alias", path: root, root: root.replace("@/", "src/") });
  }
  return items;
}

/**
 * Run full system scan. Call from API route with rootDir = process.cwd().
 */
export function runSystemScan(options: ScanOptions, rootDir: string): SystemScanResult {
  const srcDir = path.join(rootDir, "src");
  if (!fs.existsSync(srcDir)) {
    return {
      totals: { foldersScanned: 0, tsxFiles: 0, jsonFiles: 0, enginesDetected: 0, registries: 0, loaders: 0, runtimeModules: 0, uiBlocks: 0, screens: 0, warningsCount: 1, duplicatesCount: 0, legacyPathsDetected: 0 },
      systemStructure: {},
      engines: [],
      runtime: [],
      blocks: null,
      registries: { entries: [], duplicated: [], total: 0 },
      apps: { screenCount: 0, templateCount: 0, generatedWebsitesCount: 0, paths: [] },
      pathHealth: [],
      warnings: [{ id: "no-src", message: "src/ directory not found", severity: "error" }],
      suggestions: [],
    };
  }

  const allFiles: string[] = [];
  walkDir(srcDir, srcDir, allFiles);
  const totalTsx = allFiles.filter((f) => !f.endsWith("/") && f.endsWith(".tsx")).length;
  const totalJson = allFiles.filter((f) => !f.endsWith("/") && f.endsWith(".json")).length;

  const systemStructure: Record<string, FolderStats> = {};
  for (const folder of SRC_ROOTS) {
    const full = path.join(srcDir, folder);
    if (fs.existsSync(full)) {
      systemStructure[folder] = scanFolder(rootDir, srcDir, folder);
    }
  }

  const engines = options.scanEngines !== false ? detectEngines(srcDir) : [];
  const runtime = options.scanRuntime !== false ? scanRuntime(srcDir) : [];
  const blocks = options.scanUIBlocks !== false ? scanBlocks(srcDir) : null;
  const regResult = options.scanRegistries !== false ? detectRegistries(rootDir, srcDir) : { entries: [], duplicated: [] };
  const apps = options.scanApps !== false ? scanApps(srcDir) : { screenCount: 0, templateCount: 0, generatedWebsitesCount: 0, paths: [] };
  const pathHealth = options.scanPaths !== false ? gatherPathHealth(srcDir, allFiles) : [];
  const legacyCount = detectLegacy(rootDir, allFiles);

  const warnings: SystemScanResult["warnings"] = [];
  if (regResult.duplicated.length > 0) {
    warnings.push({ id: "dup-registry", message: `${regResult.duplicated.length} duplicate registry path(s) detected`, severity: "warn" });
  }
  if (legacyCount > 0) {
    warnings.push({ id: "legacy-paths", message: `${legacyCount} file(s) under legacy path patterns`, severity: "info" });
  }
  if (engines.length > 20) {
    warnings.push({ id: "many-engines", message: `${engines.length} engine-related modules; consider grouping`, severity: "info" });
  }

  const suggestions: SystemScanResult["suggestions"] = [];
  if (regResult.duplicated.length > 0) {
    suggestions.push({ area: "registries", fix: "Consolidate duplicate registry files to a single source of truth per type." });
  }
  if (legacyCount > 0) {
    suggestions.push({ area: "paths", fix: "Update imports from legacy paths (screens/, apps-tsx/core) to current runtime/engine paths." });
  }

  const loaders = allFiles.filter((f) => f.includes("loader") && (f.endsWith(".ts") || f.endsWith(".tsx"))).length;
  const runtimeModules = runtime.reduce((s, r) => s + r.fileCount, 0);
  const uiBlocks = (blocks?.atomsCount ?? 0) + (blocks?.compoundsCount ?? 0);

  return {
    totals: {
      foldersScanned: Object.keys(systemStructure).length,
      tsxFiles: totalTsx,
      jsonFiles: totalJson,
      enginesDetected: engines.length,
      registries: regResult.entries.length,
      loaders,
      runtimeModules,
      uiBlocks,
      screens: apps.screenCount,
      warningsCount: warnings.length,
      duplicatesCount: regResult.duplicated.length,
      legacyPathsDetected: legacyCount,
    },
    systemStructure,
    engines,
    runtime,
    blocks,
    registries: { entries: regResult.entries, duplicated: regResult.duplicated, total: regResult.entries.length },
    apps,
    pathHealth,
    warnings,
    suggestions,
  };
}
