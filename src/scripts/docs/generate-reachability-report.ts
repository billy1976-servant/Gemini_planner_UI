/**
 * generate-reachability-report.ts
 * Builds TypeScript import graph (module-level), computes reachability from seed
 * entrypoints, and emits deterministic markdown for REACHABILITY_REPORT and
 * related docs. No runtime changes; docs-only.
 *
 * Run: npx ts-node -r tsconfig-paths/register src/scripts/docs/generate-reachability-report.ts
 * (from repo root; or use node with ts-node)
 */

import fs from "fs";
import path from "path";

const SRC_ROOT = path.join(process.cwd(), "src");
const OUT_DIR_SYSTEM_MAP = path.join(process.cwd(), "src", "docs", "SYSTEM_MAP_AUTOGEN");
const OUT_DIR_ARCH = path.join(process.cwd(), "src", "docs", "ARCHITECTURE_AUTOGEN");

const SEED_ENTRYPOINTS: string[] = [
  "src/app/page.tsx",
  "src/app/layout.tsx",
  "src/engine/core/json-renderer.tsx",
  "src/engine/core/behavior-listener.ts",
  "src/engine/core/screen-loader.ts",
  "src/state/state-store.ts",
  "src/layout/index.ts",
  "src/engine/core/registry.tsx",
  "src/state/state-resolver.ts",
  "src/logic/runtime/action-registry.ts",
  "src/logic/runtime/runtime-verb-interpreter.ts",
];

// Normalize to forward slashes and no extension for keying
function norm(s: string): string {
  return s.replace(/\\/g, "/").replace(/\.(tsx?|jsx?)$/, "");
}

function withExt(filePath: string): string {
  const n = filePath.replace(/\\/g, "/");
  if (n.endsWith(".ts") || n.endsWith(".tsx")) return n;
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, n + ".tsx"))) return n + ".tsx";
  if (fs.existsSync(path.join(cwd, n + ".ts"))) return n + ".ts";
  // Directory import -> index
  if (fs.existsSync(path.join(cwd, n, "index.tsx"))) return n + "/index.tsx";
  if (fs.existsSync(path.join(cwd, n, "index.ts"))) return n + "/index.ts";
  return n + ".ts";
}

function collectTsTsxFiles(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.relative(process.cwd(), full).replace(/\\/g, "/");
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".next" || e.name === "generated") continue;
      collectTsTsxFiles(full, out);
    } else if (e.isFile() && /\.(ts|tsx)$/.test(e.name)) {
      if (rel.startsWith("src/")) out.push(rel);
    }
  }
  return out;
}

// Extract import targets from file content (relative and @/ only; skip node)
function extractImports(filePath: string, content: string): string[] {
  const dir = path.dirname(path.join(process.cwd(), filePath));
  const targets: string[] = [];
  // import ... from "specifier" or 'specifier'
  const re1 = /import\s+(?:[\w{}\s,*]+\s+from\s+)?["']([^"']+)["']/g;
  // dynamic import("specifier")
  const re2 = /import\s*\(\s*["']([^"']+)["']\s*\)/g;
  for (const re of [re1, re2]) {
    let m;
    while ((m = re.exec(content)) !== null) {
      const spec = m[1];
      if (spec.startsWith(".") || spec.startsWith("@/")) {
        let resolved: string;
        if (spec.startsWith("@/")) {
          resolved = path.join(process.cwd(), "src", spec.slice(2)).replace(/\\/g, "/");
        } else {
          resolved = path.join(dir, spec).replace(/\\/g, "/");
        }
        const rel = path.relative(process.cwd(), resolved).replace(/\\/g, "/");
        if (rel.startsWith("src/")) {
          const withExtension = withExt(rel);
          if (!targets.includes(withExtension)) targets.push(withExtension);
        }
      }
    }
  }
  return targets;
}

function buildGraph(): Map<string, string[]> {
  const files = collectTsTsxFiles(SRC_ROOT);
  const graph = new Map<string, string[]>();
  for (const f of files) {
    const full = path.join(process.cwd(), f);
    if (!fs.existsSync(full)) continue;
    const content = fs.readFileSync(full, "utf8");
    const imports = extractImports(full, content);
    const normalized = withExt(f);
    graph.set(normalized, imports);
  }
  return graph;
}

function bfsReachable(seed: string[], graph: Map<string, string[]>): Set<string> {
  const reachable = new Set<string>();
  const normSeed = seed.map((s) => withExt(s.replace(/\\/g, "/")));
  const q = [...normSeed];
  for (const s of normSeed) reachable.add(s);
  while (q.length) {
    const cur = q.shift()!;
    const nextList = graph.get(cur) ?? [];
    for (const next of nextList) {
      const n = withExt(next);
      if (!reachable.has(n)) {
        reachable.add(n);
        q.push(n);
      }
    }
  }
  return reachable;
}

// Who imports this module? (graph is from -> [to], so we need reverse)
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

function generateWhyUnreachable(
  mod: string,
  importers: string[],
  reachable: Set<string>
): string {
  if (importers.length === 0) return "Never imported by any module.";
  const allUnreachable = importers.every((i) => !reachable.has(withExt(i)));
  if (allUnreachable) return "Only imported by other unreachable modules.";
  return "Imported only from unreachable or external entry points.";
}

function main() {
  const graph = buildGraph();
  const reachable = bfsReachable(SEED_ENTRYPOINTS, graph);
  const rev = reverseGraph(graph);
  const allModules = new Set<string>([...graph.keys()]);
  for (const [, tos] of graph) for (const t of tos) allModules.add(withExt(t));
  const unreachable = [...allModules].filter((m) => !reachable.has(m)).sort();

  // ---- REACHABILITY_REPORT.generated.md ----
  let md = `# Reachability Report (Generated)

Module-level reachability from app entrypoints. **REACHABLE** = reachable from seed set; **UNREACHABLE** = not reachable.

**Seed entrypoints:** ${SEED_ENTRYPOINTS.join(", ")}

**Generated:** ${new Date().toISOString()}

---

## Summary

| Status       | Count |
|-------------|-------|
| REACHABLE   | ${reachable.size} |
| UNREACHABLE | ${unreachable.length} |

---

## REACHABLE modules (by folder)

`;

  const byFolder = new Map<string, string[]>();
  for (const m of [...reachable].sort()) {
    const folder = m.split("/").slice(0, -1).join("/") || "(root)";
    if (!byFolder.has(folder)) byFolder.set(folder, []);
    byFolder.get(folder)!.push(m);
  }
  for (const folder of [...byFolder.keys()].sort()) {
    md += `### \`${folder}/\`\n\n`;
    for (const f of byFolder.get(folder)!.sort()) {
      md += `- \`${f}\`\n`;
    }
    md += "\n";
  }

  md += `---

## UNREACHABLE modules

For each: file path, first break (nearest reachable parent that does not import it, or direct importers if all unreachable), and short reason.

`;

  for (const m of unreachable) {
    const importers = rev.get(m) ?? [];
    const why = generateWhyUnreachable(m, importers, reachable);
    const firstBreak =
      importers.length > 0
        ? importers.slice(0, 3).map((i) => `\`${i}\``).join(", ")
        : "(no importers)";
    md += `### \`${m}\`\n\n`;
    md += `- **First break:** ${firstBreak}\n`;
    md += `- **Why unreachable:** ${why}\n\n`;
  }

  if (!fs.existsSync(OUT_DIR_SYSTEM_MAP)) fs.mkdirSync(OUT_DIR_SYSTEM_MAP, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR_SYSTEM_MAP, "REACHABILITY_REPORT.generated.md"),
    md,
    "utf8"
  );
  console.log("Wrote REACHABILITY_REPORT.generated.md");

  // ---- Expose data for ENGINE_WIRING and DISCONNECTED ----
  const reachableSet = reachable;
  const unreachableList = unreachable;
  const graphRef = graph;
  return { reachableSet, unreachableList, graph: graphRef, rev };
}

main();
