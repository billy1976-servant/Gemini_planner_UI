/**
 * generate-system-report.ts
 * Read-only system cartography: timestamped snapshots under src/system-reports/ with
 * structure, classification, duplication, contract candidates, export hubs,
 * autogen detection, summary MD, diff vs previous snapshot, and AI Snapshot Pack.
 *
 * Default (minimal): AI_SNAPSHOT_PACK.md + .json, SYSTEM_SUMMARY, LATEST_CHANGE_SUMMARY only.
 * --full: all snapshot JSONs + diff + same summaries.
 *
 * Run: npm run reports | npm run system-report:full
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  getSpineStages,
  getObservedStateKeys,
  getEngineContracts,
  getRepoRootName,
  getGitCommitHash,
  buildAIPackMd,
  buildAIPackJson,
} from "./ai-snapshot-pack";

const CWD = process.cwd();
const REPORT_ROOT = path.join(CWD, "src", "system-reports");
const SNAPSHOTS_DIR = path.join(REPORT_ROOT, "snapshots");
const DIFFS_DIR = path.join(REPORT_ROOT, "diffs");
const SUMMARIES_DIR = path.join(REPORT_ROOT, "summaries");
const SRC_ROOT = path.join(CWD, "src");

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  ".idx",
  "playwright-report",
  "test-results",
  "generated",
]);

const MAX_FILE_SIZE_FOR_SIMILARITY = 500 * 1024; // 500 KB
const SIMILARITY_THRESHOLD = 0.7;
const TOP_LARGEST = 50;
const TOP_RECENT = 50;
const TOP_CENTRAL = 20;
const TOP_EXPORT_HUBS = 30;

type FileEntry = { path: string; size: number; mtimeMs: number };

// ----- Path normalization -----
function normPath(p: string): string {
  return path.relative(CWD, p).replace(/\\/g, "/");
}

// ----- Recursive file walk with exclusions -----
function walkFiles(
  dir: string,
  out: FileEntry[] = [],
  prefix = ""
): FileEntry[] {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = normPath(full);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walkFiles(full, out, rel + "/");
    } else if (e.isFile()) {
      const stat = fs.statSync(full);
      out.push({ path: rel, size: stat.size, mtimeMs: stat.mtimeMs });
    }
  }
  return out;
}

// ----- Build directory tree (names only) -----
function buildDirTree(
  dir: string,
  tree: Record<string, unknown> = {}
): Record<string, unknown> {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return tree;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const children: Record<string, unknown> = {};
  const files: string[] = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      children[e.name] = buildDirTree(full, {});
    } else {
      files.push(e.name);
    }
  }
  if (Object.keys(children).length) tree["dirs"] = children;
  if (files.length) tree["files"] = files.sort();
  return tree;
}

// ----- Step 3: FILE_STRUCTURE.json (writeToDir null = skip write) -----
function generateFileStructure(allFiles: FileEntry[], writeToDir: string | null): void {
  const byFolder: Record<string, number> = {};
  const byExt: Record<string, number> = {};
  for (const f of allFiles) {
    const folder = f.path.includes("/") ? f.path.split("/").slice(0, -1).join("/") : "";
    byFolder[folder || "(root)"] = (byFolder[folder || "(root)"] || 0) + 1;
    const ext = path.extname(f.path) || "(none)";
    byExt[ext] = (byExt[ext] || 0) + 1;
  }
  const directoryTree = buildDirTree(CWD);
  const largestFiles = [...allFiles]
    .sort((a, b) => b.size - a.size)
    .slice(0, TOP_LARGEST)
    .map((f) => ({ path: f.path, size: f.size }));
  const recentlyChangedFiles = [...allFiles]
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .slice(0, TOP_RECENT)
    .map((f) => ({ path: f.path, mtimeMs: f.mtimeMs }));

  const fileSizes: Record<string, number> = {};
  for (const f of allFiles) fileSizes[f.path] = f.size;

  const report = {
    generated: new Date().toISOString(),
    directoryTree,
    fileCountsByFolder: byFolder,
    fileCountsByExtension: byExt,
    totalFileCount: allFiles.length,
    allPaths: allFiles.map((f) => f.path).sort(),
    fileSizes,
    largestFiles,
    recentlyChangedFiles,
  };
  if (writeToDir) {
    fs.writeFileSync(
      path.join(writeToDir, "FILE_STRUCTURE.json"),
      JSON.stringify(report, null, 2),
      "utf8"
    );
    console.log("Wrote FILE_STRUCTURE.json");
  }
}

// ----- Classification: path -> category mapping -----
const PATH_CATEGORY_RULES: { prefix: string; category: string }[] = [
  { prefix: "src/app/", category: "runtime_core" },
  { prefix: "src/engine/", category: "engines" },
  { prefix: "src/layout/", category: "layout" },
  { prefix: "src/layout-organ/", category: "layout" },
  { prefix: "src/state/", category: "state" },
  { prefix: "src/engine/core/json-renderer", category: "renderer" },
  { prefix: "src/layout/renderer/", category: "renderer" },
  { prefix: "src/compiler/", category: "compiler" },
  { prefix: "src/web2extractor/", category: "ingest_tools" },
  { prefix: "src/components/9-atoms/", category: "primitives" },
  { prefix: "src/compounds/", category: "compounds" },
  { prefix: "src/contracts/", category: "contracts" },
  { prefix: "src/docs/ARCHITECTURE_AUTOGEN/", category: "auto_generated_docs" },
  { prefix: "src/docs/SYSTEM_MAP_AUTOGEN/", category: "auto_generated_docs" },
  { prefix: "src/docs/SYSTEM_INTELLIGENCE_AUTOGEN/", category: "auto_generated_docs" },
];

function classifyByPath(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  for (const { prefix, category } of PATH_CATEGORY_RULES) {
    if (normalized.startsWith(prefix)) return category;
  }
  if (normalized.includes("AUTOGEN") || normalized.includes(".generated.")) {
    return "auto_generated_docs";
  }
  return "unknown";
}

// ----- Step 4: FILE_CLASSIFICATION.json (writeToDir null = skip write) -----
function generateFileClassification(
  allFiles: FileEntry[],
  writeToDir: string | null
): Record<string, string> {
  const classification: Record<string, string> = {};
  const countByCategory: Record<string, number> = {};
  for (const f of allFiles) {
    const cat = classifyByPath(f.path);
    classification[f.path] = cat;
    countByCategory[cat] = (countByCategory[cat] || 0) + 1;
  }
  const report = {
    generated: new Date().toISOString(),
    classification,
    countByCategory,
  };
  if (writeToDir) {
    fs.writeFileSync(
      path.join(writeToDir, "FILE_CLASSIFICATION.json"),
      JSON.stringify(report, null, 2),
      "utf8"
    );
    console.log("Wrote FILE_CLASSIFICATION.json");
  }
  return classification;
}

// ----- Duplication: line-based Jaccard and block hashes -----
function normalizeLine(line: string): string {
  return line.trim().replace(/\s+/g, " ");
}

function lineSet(content: string): Set<string> {
  const lines = content.split(/\r?\n/).map(normalizeLine).filter((l) => l.length > 0);
  return new Set(lines);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) {
    if (b.has(x)) inter++;
  }
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function hashBlock(block: string): string {
  return crypto.createHash("sha256").update(block).digest("hex").slice(0, 16);
}

// ----- Step 5: DUPLICATE_CONTENT_REPORT (writeToDir null = skip write; always return report for SUMMARY) -----
function generateDuplicateReport(
  allFiles: FileEntry[],
  writeToDir: string | null
): { similarFilesOver70: { pathA: string; pathB: string; overlap: number }[]; repeatedBlocksSample: { paths: string[] }[] } {
  const textExt = new Set([".md", ".ts", ".tsx", ".json"]);
  const textFiles = allFiles.filter(
    (f) =>
      textExt.has(path.extname(f.path)) &&
      f.size <= MAX_FILE_SIZE_FOR_SIMILARITY &&
      f.size > 0
  );

  const similarPairs: { pathA: string; pathB: string; overlap: number }[] = [];
  const blockHashes: Map<string, string[]> = new Map();

  for (let i = 0; i < textFiles.length; i++) {
    const fa = textFiles[i];
    let contentA: string;
    try {
      contentA = fs.readFileSync(path.join(CWD, fa.path), "utf8");
    } catch {
      continue;
    }
    const setA = lineSet(contentA);

    const lines = contentA.split(/\r?\n/);
    for (let j = 0; j <= lines.length - 5; j++) {
      const block = lines.slice(j, j + 5).map(normalizeLine).join("\n");
      if (block.length < 20) continue;
      const h = hashBlock(block);
      if (!blockHashes.has(h)) blockHashes.set(h, []);
      if (!blockHashes.get(h)!.includes(fa.path)) blockHashes.get(h)!.push(fa.path);
    }

    for (let j = i + 1; j < textFiles.length; j++) {
      const fb = textFiles[j];
      let contentB: string;
      try {
        contentB = fs.readFileSync(path.join(CWD, fb.path), "utf8");
      } catch {
        continue;
      }
      const setB = lineSet(contentB);
      const overlap = jaccard(setA, setB);
      if (overlap >= SIMILARITY_THRESHOLD) {
        similarPairs.push({ pathA: fa.path, pathB: fb.path, overlap });
      }
    }
  }

  const repeatedBlocks: { hash: string; paths: string[] }[] = [];
  for (const [h, paths] of blockHashes) {
    if (paths.length >= 2) repeatedBlocks.push({ hash: h, paths });
  }

  const report = {
    generated: new Date().toISOString(),
    similarFilesOver70: similarPairs,
    repeatedBlockCount: repeatedBlocks.length,
    repeatedBlocksSample: repeatedBlocks.slice(0, 50),
  };
  if (writeToDir) {
    fs.writeFileSync(
      path.join(writeToDir, "DUPLICATE_CONTENT_REPORT.json"),
      JSON.stringify(report, null, 2),
      "utf8"
    );
    console.log("Wrote DUPLICATE_CONTENT_REPORT.json");
  }
  return { similarFilesOver70: report.similarFilesOver70, repeatedBlocksSample: report.repeatedBlocksSample };
}

// ----- Import graph (reuse reachability pattern) -----
function withExt(filePath: string): string {
  const n = filePath.replace(/\\/g, "/");
  if (n.endsWith(".ts") || n.endsWith(".tsx")) return n;
  if (fs.existsSync(path.join(CWD, n + ".tsx"))) return n + ".tsx";
  if (fs.existsSync(path.join(CWD, n + ".ts"))) return n + ".ts";
  if (fs.existsSync(path.join(CWD, n, "index.tsx"))) return n + "/index.tsx";
  if (fs.existsSync(path.join(CWD, n, "index.ts"))) return n + "/index.ts";
  return n + ".ts";
}

function collectTsTsxFiles(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.relative(CWD, full).replace(/\\/g, "/");
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      collectTsTsxFiles(full, out);
    } else if (e.isFile() && /\.(ts|tsx)$/.test(e.name)) {
      if (rel.startsWith("src/")) out.push(rel);
    }
  }
  return out;
}

function extractImports(filePath: string, content: string): string[] {
  const dir = path.dirname(path.join(CWD, filePath));
  const targets: string[] = [];
  const re1 = /import\s+(?:[\w{}\s,*]+\s+from\s+)?["']([^"']+)["']/g;
  const re2 = /import\s*\(\s*["']([^"']+)["']\s*\)/g;
  for (const re of [re1, re2]) {
    let m;
    while ((m = re.exec(content)) !== null) {
      const spec = m[1];
      if (spec.startsWith(".") || spec.startsWith("@/")) {
        let resolved: string;
        if (spec.startsWith("@/")) {
          resolved = path.join(CWD, "src", spec.slice(2)).replace(/\\/g, "/");
        } else {
          resolved = path.join(dir, spec).replace(/\\/g, "/");
        }
        const rel = path.relative(CWD, resolved).replace(/\\/g, "/");
        if (rel.startsWith("src/")) {
          const withExtension = withExt(rel);
          if (!targets.includes(withExtension)) targets.push(withExtension);
        }
      }
    }
  }
  return targets;
}

function buildImportGraph(): Map<string, string[]> {
  const files = collectTsTsxFiles(SRC_ROOT);
  const graph = new Map<string, string[]>();
  for (const f of files) {
    const full = path.join(CWD, f);
    if (!fs.existsSync(full)) continue;
    const content = fs.readFileSync(full, "utf8");
    const imports = extractImports(full, content);
    graph.set(withExt(f), imports);
  }
  return graph;
}

function reverseGraph(graph: Map<string, string[]>): Map<string, string[]> {
  const rev = new Map<string, string[]>();
  for (const [from, tos] of graph) {
    const fromNorm = withExt(from);
    for (const to of tos) {
      const toNorm = withExt(to);
      if (!rev.has(toNorm)) rev.set(toNorm, []);
      if (!rev.get(toNorm)!.includes(fromNorm)) rev.get(toNorm)!.push(fromNorm);
    }
  }
  return rev;
}

function countExportFromStatements(content: string): number {
  let count = 0;
  const re1 = /export\s+\*\s+from\s+["']/g;
  const re2 = /export\s*\{[^}]+\}\s+from\s+["']/g;
  while (re1.exec(content)) count++;
  while (re2.exec(content)) count++;
  return count;
}

// ----- Step 6: CONTRACT_CANDIDATES (writeToDir null = skip write) -----
function generateContractCandidates(
  graph: Map<string, string[]>,
  importers: Map<string, string[]>,
  writeToDir: string | null,
  classification: Record<string, string>
): { path: string; inDegree: number; outDegree: number; centralityScore: number; suggestedRole?: string }[] {
  const candidates: { path: string; inDegree: number; outDegree: number; centralityScore: number; suggestedRole?: string }[] = [];
  const allNodes = new Set<string>(graph.keys());
  for (const [, tos] of graph) for (const t of tos) allNodes.add(withExt(t));

  for (const node of allNodes) {
    const outD = graph.get(node)?.length ?? 0;
    const inD = importers.get(node)?.length ?? 0;
    const centralityScore = inD + 0.5 * outD;
    const suggestedRole = classification[node] !== "unknown" ? classification[node] : undefined;
    candidates.push({
      path: node,
      inDegree: inD,
      outDegree: outD,
      centralityScore,
      suggestedRole,
    });
  }
  candidates.sort((a, b) => b.centralityScore - a.centralityScore);

  const report = {
    generated: new Date().toISOString(),
    candidates: candidates.slice(0, 200),
    topByCentrality: candidates.slice(0, TOP_CENTRAL),
  };
  if (writeToDir) {
    fs.writeFileSync(
      path.join(writeToDir, "CONTRACT_CANDIDATES.json"),
      JSON.stringify(report, null, 2),
      "utf8"
    );
    console.log("Wrote CONTRACT_CANDIDATES.json");
  }
  return candidates;
}

// ----- Step 7: EXPORT_HUBS (writeToDir null = skip write; return hubs for AI pack) -----
function generateExportHubs(
  graph: Map<string, string[]>,
  importers: Map<string, string[]>,
  writeToDir: string | null
): { path: string; exportCount: number; inDegree: number }[] {
  const hubs: { path: string; exportCount: number; inDegree: number; note?: string }[] = [];
  const files = collectTsTsxFiles(SRC_ROOT);
  for (const f of files) {
    const full = path.join(CWD, f);
    const norm = withExt(f);
    let content: string;
    try {
      content = fs.readFileSync(full, "utf8");
    } catch {
      continue;
    }
    const exportCount = countExportFromStatements(content);
    const inD = importers.get(norm)?.length ?? 0;
    if (exportCount > 0 || inD >= 3) {
      hubs.push({
        path: norm,
        exportCount,
        inDegree: inD,
        note: exportCount > 5 ? "barrel/registry" : inD >= 10 ? "central" : undefined,
      });
    }
  }
  hubs.sort((a, b) => b.inDegree - a.inDegree);
  const top = hubs.slice(0, TOP_EXPORT_HUBS);
  const report = { generated: new Date().toISOString(), exportHubs: top };
  if (writeToDir) {
    fs.writeFileSync(
      path.join(writeToDir, "EXPORT_HUBS.json"),
      JSON.stringify(report, null, 2),
      "utf8"
    );
    console.log("Wrote EXPORT_HUBS.json");
  }
  return top.map((h) => ({ path: h.path, exportCount: h.exportCount, inDegree: h.inDegree }));
}

// ----- Step 8: AUTOGEN_FILES (writeToDir null = skip write) -----
function generateAutogenFiles(allFiles: FileEntry[], writeToDir: string | null): void {
  const autogen: { path: string; reason: string }[] = [];
  const autogenPrefixes = [
    "src/docs/ARCHITECTURE_AUTOGEN/",
    "src/docs/SYSTEM_MAP_AUTOGEN/",
    "src/docs/SYSTEM_INTELLIGENCE_AUTOGEN/",
  ];
  for (const f of allFiles) {
    const p = f.path.replace(/\\/g, "/");
    if (autogenPrefixes.some((pre) => p.startsWith(pre))) {
      autogen.push({ path: f.path, reason: "path_under_autogen_dir" });
      continue;
    }
    if (p.includes("AUTOGEN") || p.includes(".generated.")) {
      autogen.push({ path: f.path, reason: "path_contains_autogen_or_generated" });
      continue;
    }
    if (f.size > 500) continue;
    try {
      const content = fs.readFileSync(path.join(CWD, f.path), "utf8").slice(0, 500);
      if (/Generated:|autogen|\(Generated\)/i.test(content)) {
        autogen.push({ path: f.path, reason: "content_heuristic" });
      }
    } catch {
      // skip
    }
  }
  const report = { generated: new Date().toISOString(), autogenFiles: autogen };
  if (writeToDir) {
    fs.writeFileSync(
      path.join(writeToDir, "AUTOGEN_FILES.json"),
      JSON.stringify(report, null, 2),
      "utf8"
    );
    console.log("Wrote AUTOGEN_FILES.json");
  }
}

// ----- Step 9: SYSTEM_SUMMARY.md -----
function generateSystemSummary(
  allFiles: FileEntry[],
  classification: Record<string, string>,
  contractCandidates: { path: string; centralityScore: number; suggestedRole?: string }[],
  duplicateReport: { similarFilesOver70: { pathA: string; pathB: string }[]; repeatedBlocksSample: { paths: string[] }[] },
  snapshotDir: string
): void {
  const runtimeCategories = [
    "runtime_core",
    "engines",
    "layout",
    "state",
    "renderer",
    "compiler",
    "ingest_tools",
    "primitives",
    "compounds",
    "contracts",
  ];
  let runtimeCount = 0;
  let generatedCount = 0;
  const countByCategory: Record<string, number> = {};
  for (const [, cat] of Object.entries(classification)) {
    countByCategory[cat] = (countByCategory[cat] || 0) + 1;
    if (runtimeCategories.includes(cat)) runtimeCount++;
    else if (cat === "auto_generated_docs") generatedCount++;
  }

  const topCentral = contractCandidates.slice(0, TOP_CENTRAL);
  const dupZones = new Map<string, number>();
  for (const pair of duplicateReport.similarFilesOver70) {
    const folder = pair.pathA.split("/").slice(0, 2).join("/");
    dupZones.set(folder, (dupZones.get(folder) || 0) + 1);
  }
  const trunkCandidates = contractCandidates
    .filter((c) => ["state", "layout", "engines", "runtime_core"].includes(c.suggestedRole || ""))
    .slice(0, 10);

  let md = `# System Summary (Generated)

**Generated:** ${new Date().toISOString()}

## Total file count
${allFiles.length}

## Runtime vs generated ratio
- Runtime (core + engines + layout + state + renderer + compiler + ingest + primitives + compounds + contracts): **${runtimeCount}**
- Auto-generated docs: **${generatedCount}**
- Unknown / other: **${countByCategory["unknown"] ?? 0}**

## Top ${TOP_CENTRAL} most central files
| Path | Centrality | Role |
|------|------------|------|
`;
  for (const c of topCentral) {
    md += `| \`${c.path}\` | ${c.centralityScore.toFixed(1)} | ${c.suggestedRole ?? "-"} |\n`;
  }

  md += `\n## Suspected duplication zones (folders with most similar pairs)\n`;
  const dupSorted = [...dupZones.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  for (const [folder, count] of dupSorted) {
    md += `- \`${folder}\`: ${count} similar pair(s)\n`;
  }
  if (dupSorted.length === 0) md += "- None above threshold.\n";

  md += `\n## Suspected trunk candidates (state/layout/engine entry points)\n`;
  for (const c of trunkCandidates) {
    md += `- \`${c.path}\` (${c.suggestedRole})\n`;
  }

  md += `\n## Risk areas (structural only)\n`;
  const largeFiles = allFiles.filter((f) => f.size > 100000).slice(0, 10);
  for (const f of largeFiles) {
    md += `- Large file: \`${f.path}\` (${(f.size / 1024).toFixed(1)} KB)\n`;
  }
  if (largeFiles.length === 0) md += "- No files over 100 KB in this snapshot.\n";

  fs.writeFileSync(path.join(snapshotDir, "SYSTEM_SUMMARY.md"), md, "utf8");
  console.log("Wrote SYSTEM_SUMMARY.md");
}

// ----- Step 10: Diff vs previous snapshot -----
function getPreviousSnapshotTimestamp(currentTimestamp: string): string | null {
  if (!fs.existsSync(SNAPSHOTS_DIR)) return null;
  const names = fs.readdirSync(SNAPSHOTS_DIR);
  const dirs = names.filter((n) => {
    const full = path.join(SNAPSHOTS_DIR, n);
    return fs.statSync(full).isDirectory();
  });
  if (dirs.length < 2) return null;
  dirs.sort();
  const idx = dirs.indexOf(currentTimestamp);
  if (idx <= 0) return null;
  return dirs[idx - 1];
}

type DiffSummary = {
  newCount: number;
  removedCount: number;
  classificationShiftCount: number;
  topSizeDeltas: { path: string; delta: number }[];
};

function generateDiff(
  currentTimestamp: string,
  previousTimestamp: string,
  allFiles: FileEntry[],
  classification: Record<string, string>,
  snapshotDir: string
): DiffSummary | null {
  const prevDir = path.join(SNAPSHOTS_DIR, previousTimestamp);
  const prevStructurePath = path.join(prevDir, "FILE_STRUCTURE.json");
  const prevClassPath = path.join(prevDir, "FILE_CLASSIFICATION.json");
  if (!fs.existsSync(prevStructurePath) || !fs.existsSync(prevClassPath)) {
    console.log("Previous snapshot missing JSONs; skipping diff.");
    return null;
  }

  const prevStructure = JSON.parse(fs.readFileSync(prevStructurePath, "utf8")) as {
    allPaths?: string[];
    fileSizes?: Record<string, number>;
  };
  const prevClass = JSON.parse(fs.readFileSync(prevClassPath, "utf8")) as {
    classification?: Record<string, string>;
  };
  const prevPaths = new Set<string>(
    prevStructure.allPaths || Object.keys(prevClass.classification || {})
  );
  const currentPaths = new Set(allFiles.map((f) => f.path));
  const currentClass = classification;

  const newFiles = [...currentPaths].filter((p) => !prevPaths.has(p)).sort();
  const removedFiles = [...prevPaths].filter((p) => !currentPaths.has(p)).sort();
  const classificationShifts: { path: string; from: string; to: string }[] = [];
  for (const p of currentPaths) {
    if (prevClass.classification && prevClass.classification[p] && currentClass[p] !== prevClass.classification[p]) {
      classificationShifts.push({
        path: p,
        from: prevClass.classification[p],
        to: currentClass[p],
      });
    }
  }

  const prevSizes: Record<string, number> = prevStructure.fileSizes || {};
  const currentSizes: Record<string, number> = {};
  for (const f of allFiles) currentSizes[f.path] = f.size;
  const sizeChanges: { path: string; prevSize: number; currentSize: number; delta: number }[] = [];
  for (const p of currentPaths) {
    const prev = prevSizes[p];
    if (prev == null) continue;
    const curr = currentSizes[p];
    if (curr == null) continue;
    const delta = curr - prev;
    if (Math.abs(delta) > 1024 || (prev > 0 && Math.abs(delta) / prev > 0.1)) {
      sizeChanges.push({ path: p, prevSize: prev, currentSize: curr, delta });
    }
  }
  sizeChanges.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const diffSummary: DiffSummary = {
    newCount: newFiles.length,
    removedCount: removedFiles.length,
    classificationShiftCount: classificationShifts.length,
    topSizeDeltas: sizeChanges.slice(0, 5).map((s) => ({ path: s.path, delta: s.delta })),
  };

  let diffMd = `# Diff: ${previousTimestamp} → ${currentTimestamp}

**Generated:** ${new Date().toISOString()}

## New files
${newFiles.length} file(s) added.
${newFiles.slice(0, 100).map((p) => `- \`${p}\`\n`).join("")}
${newFiles.length > 100 ? `... and ${newFiles.length - 100} more.\n` : ""}

## Removed files
${removedFiles.length} file(s) removed.
${removedFiles.slice(0, 100).map((p) => `- \`${p}\`\n`).join("")}
${removedFiles.length > 100 ? `... and ${removedFiles.length - 100} more.\n` : ""}

## Size changes (significant: >1KB or >10%)
${sizeChanges.length} file(s) with significant size change.
`;
  for (const s of sizeChanges.slice(0, 50)) {
    diffMd += `- \`${s.path}\`: ${s.prevSize} → ${s.currentSize} (${s.delta >= 0 ? "+" : ""}${s.delta} B)\n`;
  }
  if (sizeChanges.length > 50) diffMd += `... and ${sizeChanges.length - 50} more.\n`;

  diffMd += `\n## Classification shifts\n${classificationShifts.length} file(s) changed category.\n`;
  for (const s of classificationShifts.slice(0, 50)) {
    diffMd += `- \`${s.path}\`: ${s.from} → ${s.to}\n`;
  }
  if (classificationShifts.length > 50) diffMd += `... and ${classificationShifts.length - 50} more.\n`;

  const diffPath = path.join(DIFFS_DIR, `${currentTimestamp}_DIFF.md`);
  fs.writeFileSync(diffPath, diffMd, "utf8");
  console.log("Wrote " + path.relative(CWD, diffPath));
  return diffSummary;
}

// ----- Step 11: LATEST_CHANGE_SUMMARY.md -----
function generateLatestChangeSummary(
  currentTimestamp: string,
  previousTimestamp: string | null,
  diffGenerated: boolean
): void {
  let md = `# Latest Change Summary

**Generated:** ${new Date().toISOString()}
**Current snapshot:** ${currentTimestamp}
**Previous snapshot:** ${previousTimestamp ?? "none"}

`;
  if (!previousTimestamp || !diffGenerated) {
    md += "First run; no previous snapshot to compare. Structural facts will appear after the second run. Run with --full for full snapshot and diff.\n";
  } else {
    md += `A diff was generated: \`src/system-reports/diffs/${currentTimestamp}_DIFF.md\`.
Review that file for: new files, removed files, and classification shifts.
This summary is structural only; no opinions.\n`;
  }
  fs.writeFileSync(path.join(SUMMARIES_DIR, "LATEST_CHANGE_SUMMARY.md"), md, "utf8");
  console.log("Wrote summaries/LATEST_CHANGE_SUMMARY.md");
}

// ----- AI Snapshot Pack (summaries only) -----
function writeAIPack(
  topCentral: { path: string; inDegree: number; outDegree: number; centralityScore: number; suggestedRole?: string }[],
  exportHubs: { path: string; exportCount: number; inDegree: number }[],
  latestDiffSummary: DiffSummary | null
): void {
  const generated = new Date().toISOString();
  const gitHash = getGitCommitHash();
  const repoRootName = getRepoRootName();
  const spineStages = getSpineStages();
  const observedStateKeys = getObservedStateKeys();
  const engineContracts = getEngineContracts();
  const trunkEntryPoints = spineStages[0]?.files.map((f) => f.path) ?? ["src/app/page.tsx", "src/engine/core/screen-loader.ts"];

  const mdParams = {
    generated,
    gitHash,
    repoRootName,
    spineStages,
    observedStateKeys,
    engineContracts,
    topCentral: topCentral.slice(0, 25).map((c) => ({
      path: c.path,
      inDegree: c.inDegree,
      outDegree: c.outDegree,
      score: c.centralityScore,
      role: c.suggestedRole,
    })),
    exportHubs: exportHubs.slice(0, 15),
    trunkEntryPoints,
    latestDiffSummary,
  };
  const md = buildAIPackMd(mdParams);
  fs.writeFileSync(path.join(SUMMARIES_DIR, "AI_SNAPSHOT_PACK.md"), md, "utf8");
  console.log("Wrote summaries/AI_SNAPSHOT_PACK.md");

  const jsonParams = {
    generated,
    gitHash,
    repoRootName,
    spineStages,
    topCentral: mdParams.topCentral,
    exportHubs: mdParams.exportHubs,
    observedStateKeys,
    engineContracts,
    latestDiffSummary,
  };
  const json = buildAIPackJson(jsonParams);
  fs.writeFileSync(path.join(SUMMARIES_DIR, "AI_SNAPSHOT_PACK.json"), json, "utf8");
  console.log("Wrote summaries/AI_SNAPSHOT_PACK.json");
}

// ----- Main -----
function main(): void {
  const fullMode = process.argv.includes("--full");
  const timestamp = new Date()
    .toISOString()
    .replace(/T/, "_")
    .replace(/\..+/, "")
    .replace(/:/g, "-");
  const snapshotDir = path.join(SNAPSHOTS_DIR, timestamp);
  const writeToDir = fullMode ? snapshotDir : null;

  [REPORT_ROOT, SNAPSHOTS_DIR, DIFFS_DIR, SUMMARIES_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log("Created " + path.relative(CWD, dir));
    }
  });
  fs.mkdirSync(snapshotDir, { recursive: true });
  console.log(fullMode ? "Mode: full | Snapshot: " + timestamp : "Mode: minimal (AI pack + summary) | " + timestamp);

  const allFiles = walkFiles(CWD);
  generateFileStructure(allFiles, writeToDir);
  const classification = generateFileClassification(allFiles, writeToDir);
  const duplicateReport = generateDuplicateReport(allFiles, writeToDir);

  const graph = buildImportGraph();
  const importers = reverseGraph(graph);
  const contractCandidates = generateContractCandidates(
    graph,
    importers,
    writeToDir,
    classification
  );
  const exportHubs = generateExportHubs(graph, importers, writeToDir);
  generateAutogenFiles(allFiles, writeToDir);

  generateSystemSummary(
    allFiles,
    classification,
    contractCandidates.slice(0, 200),
    duplicateReport,
    snapshotDir
  );

  let diffSummary: DiffSummary | null = null;
  const previousTimestamp = getPreviousSnapshotTimestamp(timestamp);
  let diffGenerated = false;
  if (fullMode && previousTimestamp) {
    diffSummary = generateDiff(timestamp, previousTimestamp, allFiles, classification, snapshotDir);
    diffGenerated = diffSummary != null;
  }

  writeAIPack(contractCandidates, exportHubs, diffSummary);
  generateLatestChangeSummary(timestamp, previousTimestamp, diffGenerated);

  console.log("Done. " + (fullMode ? "Snapshot: src/system-reports/snapshots/" + timestamp : "Summaries: src/system-reports/summaries/"));
}

main();
