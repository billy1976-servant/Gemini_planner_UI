/**
 * AI Snapshot Pack — spine, contracts, and builders for AI_SNAPSHOT_PACK.md / .json
 * Derived from codebase/docs; read-only. Used by generate-system-report.ts only.
 */

import fs from "fs";
import path from "path";

const CWD = process.cwd();
const SRC = path.join(CWD, "src");

export type SpineStage = { stage: string; files: { path: string; role: string }[] };
export type ObservedStateKey = { key: string; writtenIn: string[]; readIn: string[] };
export type EngineContract = { inputs: Record<string, string>; outputs: Record<string, string>; enforcedIn?: string[] };

const SPINE_STAGES: SpineStage[] = [
  {
    stage: "JSON Screen",
    files: [
      { path: "src/app/page.tsx", role: "Entry; searchParams.get('screen')/('flow'); loadScreen(path); resolveLandingPage()" },
      { path: "src/app/api/screens/[...path]/route.ts", role: "GET handler; serves JSON from apps-json/apps or TSX marker from apps-tsx" },
      { path: "src/engine/core/screen-loader.ts", role: "loadScreen(path): TSX descriptor or fetch /api/screens; dispatchState state:currentView if json.state" },
    ],
  },
  {
    stage: "Engines",
    files: [
      { path: "src/app/page.tsx", role: "assignSectionInstanceKeys, expandOrgansInDocument, applySkinBindings, composeOfflineScreen, setCurrentScreenTree" },
      { path: "src/lib/site-renderer/palette-bridge.tsx", role: "applySkinBindings / skin application" },
      { path: "src/engine/core/behavior-listener.ts", role: "installBehaviorListener; action → state:* | navigate | runBehavior | interpretRuntimeVerb" },
      { path: "src/behavior/behavior-runner.ts", role: "runBehavior(domain, action, ctx, args)" },
      { path: "src/logic/runtime/engine-bridge.ts", role: "Engine I/O bridge for logic engines" },
    ],
  },
  {
    stage: "State",
    files: [
      { path: "src/state/state-store.ts", role: "dispatchState(intent, payload); log; persist/rehydrate; listeners" },
      { path: "src/state/state-resolver.ts", role: "deriveState(log): currentView, journal, values, layoutByScreen, scans, interactions" },
    ],
  },
  {
    stage: "Layout",
    files: [
      { path: "src/layout/resolver/layout-resolver.ts", role: "resolveLayout(layoutId, context); getDefaultSectionLayoutId" },
      { path: "src/layout/index.ts", role: "Layout module entry; resolveLayout, getExperienceProfile, getTemplateProfile" },
      { path: "src/engine/core/layout-store.ts", role: "Section/card/organ layout override store (section-layout-preset-store, organ-internal)" },
      { path: "src/lib/layout/molecule-layout-resolver.ts", role: "resolveMoleculeLayout; molecule layout from definition" },
    ],
  },
  {
    stage: "Renderer",
    files: [
      { path: "src/engine/core/json-renderer.tsx", role: "JsonRenderer; renderNode; applyProfileToNode; Registry lookup; section layout override → Section" },
      { path: "src/engine/core/registry.tsx", role: "Registry: type → component; Section, primitives" },
      { path: "src/compounds/ui/12-molecules/section.compound.tsx", role: "Section compound; resolveLayout(layout); LayoutMoleculeRenderer" },
      { path: "src/layout/renderer/LayoutMoleculeRenderer.tsx", role: "Renders section structure; containerWidth, split, data-section-layout, data-container-width" },
    ],
  },
  {
    stage: "DOM",
    files: [
      { path: "src/engine/core/json-renderer.tsx", role: "data-node-id, data-section-debug; sectionKey, containerWidth in dev" },
      { path: "src/layout/renderer/LayoutMoleculeRenderer.tsx", role: "data-section-layout={layoutPresetId}; data-container-width={rawWidth}" },
      { path: "src/compounds/ui/12-molecules/section.compound.tsx", role: "data-section-id={id}" },
    ],
  },
];

function inferObservedStateKeys(): ObservedStateKey[] {
  const keys: ObservedStateKey[] = [];
  const stateResolverPath = path.join(SRC, "state", "state-resolver.ts");
  const stateStorePath = path.join(SRC, "state", "state-store.ts");
  if (!fs.existsSync(stateResolverPath)) return keys;
  const content = fs.readFileSync(stateResolverPath, "utf8");
  const writtenIn = [stateResolverPath.replace(/\\/g, "/")];
  const readIn: string[] = [];
  if (content.includes("derived.currentView")) keys.push({ key: "currentView", writtenIn, readIn: ["state-resolver (derived)"] });
  if (content.includes("derived.journal")) keys.push({ key: "journal", writtenIn, readIn: ["state-resolver (derived)"] });
  if (content.includes("derived.values")) keys.push({ key: "values", writtenIn, readIn: ["state-resolver (derived)"] });
  if (content.includes("derived.layoutByScreen")) keys.push({ key: "layoutByScreen", writtenIn, readIn: ["state-resolver (derived)"] });
  if (content.includes("state.update") && content.includes("payload.key")) {
    keys.push({
      key: "values.<key> (generic)",
      writtenIn: [stateStorePath.replace(/\\/g, "/"), "src/engine/core/behavior-listener.ts", "src/engine/core/screen-loader.ts"],
      readIn: ["src/state/state-resolver.ts", "getState() consumers"],
    });
  }
  if (keys.length > 0) return keys;
  return [
    { key: "currentView", writtenIn: ["screen-loader"], readIn: ["state-resolver"] },
    { key: "journal", writtenIn: ["state-store", "state-adapter"], readIn: ["state-resolver"] },
    { key: "values", writtenIn: ["state-store (state.update)"], readIn: ["state-resolver", "getState()"] },
    { key: "layoutByScreen", writtenIn: ["src/state/state-resolver.ts (layout.override)"], readIn: ["src/app/page.tsx → JsonRenderer"] },
  ];
}

function inferEngineContracts(): { inputs: Record<string, string>; outputs: Record<string, string>; enforcedIn?: string[] } {
  return {
    inputs: {
      path: "string (screen path or tsx:path)",
      json: "object (screen document with root/screen/node, state?, sections?)",
      context: "layout context (screenKey, sectionKey, profile)",
    },
    outputs: {
      screenTree: "object (composed tree with section keys, layout applied)",
      state: "DerivedState (currentView, journal, values, layoutByScreen)",
      dom: "React tree → data-node-id, data-section-layout, data-container-width",
    },
    enforcedIn: ["src/engine/core/screen-loader.ts", "src/state/state-store.ts", "src/engine/core/json-renderer.tsx"],
  };
}

export function getSpineStages(): SpineStage[] {
  return SPINE_STAGES;
}

export function getObservedStateKeys(): ObservedStateKey[] {
  return inferObservedStateKeys();
}

export function getEngineContracts(): EngineContract {
  return inferEngineContracts();
}

export function getRepoRootName(): string {
  try {
    return path.basename(CWD) || "repo";
  } catch {
    return "repo";
  }
}

export function getGitCommitHash(): string | null {
  try {
    const { execSync } = require("child_process");
    const out = execSync("git rev-parse HEAD", { encoding: "utf8", cwd: CWD }).trim();
    return out && /^[a-f0-9]{40}$/i.test(out) ? out : null;
  } catch {
    return null;
  }
}

const DEBUG_RECIPE = `
## Browser + CSS proof (layout/state)

1. **Section identity**: Inspect \`data-section-id\` on section wrapper (from section.compound.tsx). \`data-section-layout\` and \`data-container-width\` on the layout wrapper (LayoutMoleculeRenderer.tsx) show applied preset and container width.
2. **Node identity**: \`data-node-id\` on node wrappers (json-renderer.tsx). In dev, \`data-section-debug\` may show sectionKey and containerWidth.
3. **Files**: \`src/compounds/ui/12-molecules/section.compound.tsx\` (data-section-id), \`src/layout/renderer/LayoutMoleculeRenderer.tsx\` (data-section-layout, data-container-width), \`src/engine/core/json-renderer.tsx\` (data-node-id).

## Playwright optional proof (snippet — not executed)

\`\`\`ts
// Capture screenshot
await page.screenshot({ path: "section-proof.png" });
// Computed style of section wrapper
const wrapper = page.locator("[data-section-id]").first();
const style = await wrapper.evaluate((el) => window.getComputedStyle(el));
// DOM attributes for section key
const sectionKey = await wrapper.getAttribute("data-section-id");
const layoutPreset = await page.locator("[data-section-layout]").first().getAttribute("data-section-layout");
const containerWidth = await page.locator("[data-container-width]").first().getAttribute("data-container-width");
\`\`\`
`;

const AI_PROMPT_FOOTER = `
---
## AI PROMPT FOOTER

Use this pack to diagnose issues: (1) Start from **System Spine** and verify each stage in order. (2) Check **STATE CONTRACT** and **ENGINE I/O CONTRACT** for expected shapes and where they are enforced. (3) Trace into **Renderer** and **DOM**; use **Debug recipe** to confirm layout/state in the browser. (4) Use **Critical integration map** to find central files and trunk entry points.
`;

export type AIPackMdParams = {
  generated: string;
  gitHash: string | null;
  repoRootName: string;
  spineStages: SpineStage[];
  observedStateKeys: ObservedStateKey[];
  engineContracts: EngineContract;
  topCentral: { path: string; inDegree: number; outDegree: number; score: number; role?: string }[];
  exportHubs: { path: string; exportCount: number; inDegree: number }[];
  trunkEntryPoints: string[];
  latestDiffSummary: { newCount: number; removedCount: number; classificationShiftCount: number; topSizeDeltas: { path: string; delta: number }[] } | null;
};

export function buildAIPackMd(p: AIPackMdParams): string {
  let md = `# AI Snapshot Pack — System X-Ray

**Generated:** ${p.generated}
${p.gitHash ? `**Git commit:** \`${p.gitHash}\`` : ""}
**Repo root:** ${p.repoRootName}

---

## System Spine (authoritative)

Flow: **JSON Screen → Engines → State → Layout → Renderer → DOM**

`;

  for (const stage of p.spineStages) {
    md += `### ${stage.stage}\n\n`;
    for (const f of stage.files) {
      md += `- **\`${f.path}\`** — ${f.role}\n`;
    }
    md += "\n";
  }

  md += `---

## Contracts

### STATE CONTRACT

Observed keys and where they are written/read (inferred from codebase; if exact types cannot be inferred, treat as observed keys only):

| Key | Written in | Read in |
|-----|------------|--------|
`;
  for (const k of p.observedStateKeys) {
    md += `| ${k.key} | ${k.writtenIn.join(", ")} | ${k.readIn.join(", ")} |\n`;
  }
  md += `
- **Intents:** \`state:currentView\`, \`journal.set\`/\`journal.add\`, \`state.update\`, \`layout.override\`, \`scan.result\`/\`scan.interpreted\`, \`interaction.record\`.
- **Derived shape:** \`DerivedState\` in \`src/state/state-resolver.ts\` (journal, rawCount, currentView, values, layoutByScreen, scans, interactions).

### ENGINE I/O CONTRACT

- **Standard engine input envelope:** ${Object.entries(p.engineContracts.inputs).map(([k, v]) => `${k}: ${v}`).join("; ")}.
- **Standard engine output envelope:** ${Object.entries(p.engineContracts.outputs).map(([k, v]) => `${k}: ${v}`).join("; ")}.
- **Where enforced (or should be):** ${(p.engineContracts.enforcedIn || []).join(", ")}.

---

## Critical integration map

### Top 25 central files (with role tags)

| Path | in | out | score | role |
|------|-----|-----|-------|------|
`;
  for (const c of p.topCentral.slice(0, 25)) {
    md += `| \`${c.path}\` | ${c.inDegree} | ${c.outDegree} | ${c.score.toFixed(1)} | ${c.role ?? "-"} |\n`;
  }

  md += `\n### Top 15 export hubs\n\n`;
  for (const h of p.exportHubs.slice(0, 15)) {
    md += `- \`${h.path}\` (exports: ${h.exportCount}, inDegree: ${h.inDegree})\n`;
  }

  md += `\n### Trunk entry points (pipeline start)\n\n`;
  for (const t of p.trunkEntryPoints) {
    md += `- \`${t}\`\n`;
  }

  md += `\n---\n## Debug recipe (browser + CSS proof)\n${DEBUG_RECIPE}\n`;

  if (p.latestDiffSummary) {
    md += `---\n## Change summary (from latest snapshot diff)\n\n`;
    md += `- New files: ${p.latestDiffSummary.newCount}; Removed: ${p.latestDiffSummary.removedCount}\n`;
    md += `- Classification shifts: ${p.latestDiffSummary.classificationShiftCount}\n`;
    if (p.latestDiffSummary.topSizeDeltas.length) {
      md += `- Top 5 size deltas:\n`;
      for (const d of p.latestDiffSummary.topSizeDeltas.slice(0, 5)) {
        md += `  - \`${d.path}\`: ${d.delta >= 0 ? "+" : ""}${d.delta} B\n`;
      }
    }
  }

  md += AI_PROMPT_FOOTER;
  return md;
}

export type AIPackJsonParams = {
  generated: string;
  gitHash: string | null;
  repoRootName: string;
  spineStages: SpineStage[];
  topCentral: { path: string; inDegree: number; outDegree: number; score: number; role?: string }[];
  exportHubs: { path: string; exportCount: number; inDegree: number }[];
  observedStateKeys: ObservedStateKey[];
  engineContracts: EngineContract;
  latestDiffSummary: AIPackMdParams["latestDiffSummary"];
};

export function buildAIPackJson(p: AIPackJsonParams): string {
  const obj = {
    generated: p.generated,
    gitHash: p.gitHash,
    repoRootName: p.repoRootName,
    spineStages: p.spineStages,
    topCentral: p.topCentral.slice(0, 25),
    exportHubs: p.exportHubs.slice(0, 15),
    observedStateKeys: p.observedStateKeys,
    engineContracts: p.engineContracts,
    latestDiffSummary: p.latestDiffSummary,
  };
  return JSON.stringify(obj, null, 2);
}
