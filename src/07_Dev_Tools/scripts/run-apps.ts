#!/usr/bin/env ts-node
/**
 * npm run apps — CONTRACT-GOVERNED SCAN + VERIFY + REPORT (V2)
 *
 * Default behavior: scan + verify + report (NOT build). No compileApp by default.
 * - Scans system surfaces (contracts, palettes, structure types, templates, molecules, engines).
 * - Verifies apps against contracts (molecule set closed to 12; structure type/template from contract).
 * - Outputs Build Report to src/02_Contracts_Reports/build_reports/ with full authority surface
 *   and Violations section (molecule violations, structure/template violations, etc.).
 *
 * OUTPUTS:
 * - src/02_Contracts_Reports/build_reports/BUILD_REPORT_<timestamp>.md (primary)
 * - BUILD_AUTHORITY_SURFACE.json, CURSOR_BUILD_COMMAND.md, apps-enforcement-report.md
 * - _audit/ copies of surface and command
 */

import fs from "fs";
import path from "path";
import { ALLOWED_MOLECULES } from "../../02_Contracts_Reports/contracts/allowed-molecules";
import { STRUCTURE_TYPES, TEMPLATES_BY_STRUCTURE_TYPE } from "../../02_Contracts_Reports/contracts/layout-closed-sets";
import { EXPECTED_PARAMS } from "../../02_Contracts_Reports/contracts/expected-params";
import { ALLOWED_CONTENT_KEYS } from "./blueprint";

const ROOT = process.cwd();
const APPS_ROOT = path.join(ROOT, "src", "01_App", "(dead) Json", "apps");
const GENERATED_ROOT = path.join(ROOT, "src", "01_App", "(dead) Json", "generated");

const PATH_PALETTES = path.join(ROOT, "src", "04_Presentation", "palettes");
const PATH_LAYOUT_DEFINITIONS = path.join(ROOT, "src", "04_Presentation", "layout", "data", "layout-definitions.json");
const PATH_REGISTRY = path.join(ROOT, "src", "03_Runtime", "engine", "core", "registry.tsx");
const PATH_LAYOUT_THUMBNAILS = path.join(ROOT, "src", "app", "ui", "layoutThumbnailRegistry.ts");
const PATH_MOLECULES_INDEX = path.join(ROOT, "src", "04_Presentation", "components", "molecules", "index.ts");
const PATH_ORGANS = path.join(ROOT, "src", "04_Presentation", "components", "organs");
const PATH_ORGAN_INDEX = path.join(ROOT, "src", "07_Dev_Tools", "scripts", "organ-index.json");
const BUILD_REPORTS_DIR = path.join(ROOT, "src", "02_Contracts_Reports", "build_reports");

const RULE_FILE_PATHS = [
  ".cursor/rules/TSX_BUILD_SYSTEM.md",
  ".cursor/rules/CONTENT_AND_PRESENTATION.md",
  ".cursor/rules/TSX_CREATION_CHECKLIST.md",
  ".cursor/rules/TSX_STRUCTURE_ENGINE_OVERVIEW.md",
  "src/02_Contracts_Reports/contracts/BLUEPRINT_UNIVERSE_CONTRACT.md",
  "src/02_Contracts_Reports/contracts/CONTENT_DERIVATION_CONTRACT.md",
];

type ValidationResult = {
  warnings: { code: string; message: string; rawId?: string }[];
  errors: { code: string; message: string; rawId?: string }[];
  safeToContinue: boolean;
};

type AppResult = {
  appPath: string;
  relativePath: string;
  ok: boolean;
  error?: string;
  validation?: ValidationResult;
  manifestKeys?: number;
};

/** Per-app scan result: what molecules/structure/palette/actions/organs/primitives/layouts/engines appear. */
type AppScanFinding = {
  relativePath: string;
  appPath: string;
  moleculesUsed: string[];
  structureType?: string;
  templateId?: string;
  palette?: string;
  enginesUsed: string[];
  blueprintNodeTypesUsed: string[];
  actionsUsed: string[];
  organsUsed: { organId: string; variant?: string }[];
  primitivesUsed: string[];
  layoutIdsUsed: string[];
};

/** Contract violation entry for Build Report. */
type BuildReportViolation = {
  appPath?: string;
  code: string;
  message: string;
  severity: "hard" | "soft";
};

export type BuildAuthoritySurfaceV2 = {
  version: string;
  generatedBy: string;
  buildingBlocks: {
    molecules: { id: string; allowedContentKeys: string[]; expectedParams?: string[] }[];
    organs: Record<string, { variants: string[]; slots: string[] }>;
    structureTypes: string[];
    blueprintNodeTypes: string[];
    allowedContentKeys: Record<string, string[]>;
    expectedParams: Record<string, string[]>;
    primitiveRegistryKeys: string[];
  };
  systemDrivenReference: {
    palettes: string[];
    layoutIds: { pageLayouts: string[]; componentLayouts: string[]; templates: Record<string, Record<string, string>> };
    actions: string[];
    behaviorVerbs: string[];
    engines: { name: string; integratesWith?: string[]; description?: string }[];
  };
  sources: Record<string, string>;
};

function discoverPalettes(): string[] {
  if (!fs.existsSync(PATH_PALETTES)) return [];
  return fs.readdirSync(PATH_PALETTES)
    .filter((n) => n.endsWith(".json"))
    .map((n) => n.replace(/\.json$/, ""))
    .sort();
}

function discoverLayoutIds(): BuildAuthoritySurfaceV2["systemDrivenReference"]["layoutIds"] {
  const pageLayouts: string[] = [];
  const componentLayouts: string[] = [];
  const templates: Record<string, Record<string, string>> = {};
  if (!fs.existsSync(PATH_LAYOUT_DEFINITIONS)) return { pageLayouts, componentLayouts, templates };
  const raw = fs.readFileSync(PATH_LAYOUT_DEFINITIONS, "utf8");
  const data = JSON.parse(raw) as Record<string, unknown>;
  if (data.pageLayouts && typeof data.pageLayouts === "object") pageLayouts.push(...Object.keys(data.pageLayouts as object));
  if (data.templates && typeof data.templates === "object") {
    const t = data.templates as Record<string, Record<string, string>>;
    for (const [k, v] of Object.entries(t)) if (v && typeof v === "object") templates[k] = v as Record<string, string>;
  }
  if (data.componentLayouts && typeof data.componentLayouts === "object") componentLayouts.push(...Object.keys(data.componentLayouts as object));
  return { pageLayouts, componentLayouts, templates };
}

/** Runtime defaults when app does not declare: from layout-definitions, palette-store convention, LAYOUT_SYSTEM_CONTRACT. */
type RuntimeDefaults = {
  defaultSectionLayoutByTemplate: Record<string, string | undefined>;
  defaultPalette: string;
  defaultStructureType: string;
  defaultTemplateId: string;
  defaultTsxEnvelopeProfile: string;
};

function getRuntimeDefaults(layoutIds: BuildAuthoritySurfaceV2["systemDrivenReference"]["layoutIds"]): RuntimeDefaults {
  const defaultSectionLayoutByTemplate: Record<string, string | undefined> = {};
  for (const [tplId, tplMap] of Object.entries(layoutIds.templates)) {
    if (tplMap && typeof tplMap === "object" && "defaultLayout" in tplMap && typeof (tplMap as Record<string, string>).defaultLayout === "string") {
      defaultSectionLayoutByTemplate[tplId] = (tplMap as Record<string, string>).defaultLayout.trim() || undefined;
    } else {
      defaultSectionLayoutByTemplate[tplId] = undefined;
    }
  }
  return {
    defaultSectionLayoutByTemplate,
    defaultPalette: "default",
    defaultStructureType: "list",
    defaultTemplateId: "default",
    defaultTsxEnvelopeProfile: "see LAYOUT_SYSTEM_CONTRACT / resolver convention",
  };
}

function discoverMoleculesFromFilesystem(): string[] {
  const dir = path.dirname(PATH_MOLECULES_INDEX);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((n) => n.endsWith(".compound.tsx"))
    .map((n) => n.replace(/\.compound\.tsx$/, ""))
    .sort();
}

function extractObjectKeysFromSource(filePath: string, objectName: string): string[] {
  if (!fs.existsSync(filePath)) return [];
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split("\n");
  const keys: string[] = [];
  let inside = false;
  const openPattern = new RegExp(`(?:export\\s+)?const\\s+${objectName}\\s*=\\s*\\{`);
  const keyPattern = /^\s*([a-zA-Z][a-zA-Z0-9]*)\s*:/;
  for (const line of lines) {
    if (openPattern.test(line)) {
      inside = true;
      const m = line.match(keyPattern);
      if (m) keys.push(m[1]);
      continue;
    }
    if (inside) {
      if (/^\s*\}\s*;?\s*$/.test(line) || /^\s*\};?\s*$/.test(line)) break;
      const m = line.match(keyPattern);
      if (m) keys.push(m[1]);
    }
  }
  return [...new Set(keys)];
}

function discoverOrgansAndVariants(): Record<string, { variants: string[]; slots: string[] }> {
  const out: Record<string, { variants: string[]; slots: string[] }> = {};
  if (!fs.existsSync(PATH_ORGANS)) return out;
  const organDirs = fs.readdirSync(PATH_ORGANS, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
  for (const organId of organDirs) {
    const variantsDir = path.join(PATH_ORGANS, organId, "variants");
    const variants: string[] = [];
    if (fs.existsSync(variantsDir)) variants.push(...fs.readdirSync(variantsDir).filter((n) => n.endsWith(".json")).map((n) => n.replace(/\.json$/, "")));
    out[organId] = { variants, slots: [] };
  }
  return out;
}
function discoverLayoutThumbnailKeys(): { section: string[]; card: string[]; organ: string[] } {
  if (!fs.existsSync(PATH_LAYOUT_THUMBNAILS)) return { section: [], card: [], organ: [] };
  const text = fs.readFileSync(PATH_LAYOUT_THUMBNAILS, "utf8");
  const section: string[] = [];
  const card: string[] = [];
  const organ: string[] = [];
  const sectionMatch = text.match(/SECTION_LAYOUT_THUMBNAILS[^=]*=\s*\{([^}]+)\}/s);
  if (sectionMatch) {
    const lineRegex = /["']?([a-z0-9-]+)["']?\s*:/g;
    let m;
    while ((m = lineRegex.exec(sectionMatch[1])) !== null) section.push(m[1]);
  }
  const cardMatch = text.match(/CARD_LAYOUT_THUMBNAILS[^=]*=\s*\{([^}]+)\}/s);
  if (cardMatch) {
    const lineRegex = /["']?([a-z0-9-]+)["']?\s*:/g;
    let m;
    while ((m = lineRegex.exec(cardMatch[1])) !== null) card.push(m[1]);
  }
  const organMatch = text.match(/ORGAN_LAYOUT_THUMBNAILS[^=]*=\s*\{([^}]+)\}/s);
  if (organMatch) {
    const lineRegex = /["']?([a-z0-9-]+)["']?\s*:/g;
    let m;
    while ((m = lineRegex.exec(organMatch[1])) !== null) organ.push(m[1]);
  }
  return { section, card, organ };
}

function discoverOrganIndex(): Record<string, { variants: string[]; slots: string[] }> {
  if (!fs.existsSync(PATH_ORGAN_INDEX)) return {};
  const raw = fs.readFileSync(PATH_ORGAN_INDEX, "utf8");
  const data = JSON.parse(raw) as { organs?: Record<string, { slots?: string[]; variants?: string[] }> };
  if (!data?.organs) return {};
  const out: Record<string, { variants: string[]; slots: string[] }> = {};
  for (const [organId, def] of Object.entries(data.organs)) {
    out[organId] = { variants: def?.variants ?? [], slots: def?.slots ?? [] };
  }
  return out;
}

function discoverActionsFromSource(): string[] {
  const actionRegistryPath = path.join(ROOT, "src", "05_Logic", "logic", "runtime", "action-registry.ts");
  if (!fs.existsSync(actionRegistryPath)) return [];
  const lines = fs.readFileSync(actionRegistryPath, "utf8").split("\n");
  const keys: string[] = [];
  let inside = false;
  for (const line of lines) {
    if (/const registry\s*:\s*Record/.test(line) && line.includes("= {")) {
      inside = true;
      const m = line.match(/["']([^"']+)["']\s*:/);
      if (m) keys.push(m[1]);
      continue;
    }
    if (inside) {
      if (/^\s*\}\s*;?\s*$/.test(line)) break;
      const m = line.match(/["']([^"']+)["']\s*:/);
      if (m) keys.push(m[1]);
    }
  }
  return [...new Set(keys)];
}

function discoverBehaviorVerbs(): string[] {
  const contractVerbsPath = path.join(ROOT, "src", "02_Contracts_Reports", "contracts", "contract-verbs.ts");
  if (!fs.existsSync(contractVerbsPath)) return [];
  const text = fs.readFileSync(contractVerbsPath, "utf8");
  const verbs: string[] = [];
  for (const name of ["CONTRACT_VERBS_IMAGE_DOMAIN", "CONTRACT_VERBS_INTERACTION", "CONTRACT_VERBS_NAVIGATION"]) {
    const re = new RegExp(`${name}\\s*=\\s*\\[([^\\]]+)\\]`, "s");
    const m = text.match(re);
    if (m) {
      const tokens = m[1].match(/"([^"]+)"/g)?.map((s) => s.slice(1, -1)) ?? [];
      tokens.forEach((t) => { if (t && !verbs.includes(t)) verbs.push(t); });
    }
  }
  return [...new Set(verbs)];
}

function discoverPrimitiveRegistryKeys(): string[] {
  const primPath = path.join(ROOT, "src", "lib", "director", "primitive-registry.ts");
  if (!fs.existsSync(primPath)) return [];
  const text = fs.readFileSync(primPath, "utf8");
  const keys: string[] = [];
  const start = text.indexOf("PRIMITIVE_REGISTRY");
  if (start === -1) return [];
  const brace = text.indexOf("{", start);
  if (brace === -1) return [];
  let depth = 1;
  let i = brace + 1;
  while (depth > 0 && i < text.length) {
    const c = text[i];
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (depth === 1) {
      const keyMatch = text.slice(i).match(/^\s*([a-zA-Z][a-zA-Z0-9]*)\s*:/);
      if (keyMatch) {
        keys.push(keyMatch[1]);
        i += keyMatch[0].length - 1;
      }
    }
    i++;
  }
  return [...new Set(keys)];
}

/** Discover engine names by scanning engine files; parse integratesWith and description from source when possible. */
function discoverEnginesByScan(): BuildAuthoritySurfaceV2["systemDrivenReference"]["engines"] {
  const engineDir = path.join(ROOT, "src", "05_Logic", "logic", "engines");
  const out: BuildAuthoritySurfaceV2["systemDrivenReference"]["engines"] = [];
  if (!fs.existsSync(engineDir)) return out;
  const walk = (dir: string): string[] => {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory() && e.name !== "node_modules") files.push(...walk(full));
      else if (e.isFile() && (e.name.endsWith(".ts") || e.name.endsWith(".tsx"))) files.push(full);
    }
    return files;
  };
  const nameRe = /registerEngine\s*\(\s*\{\s*name\s*:\s*["']([^"']+)["']/g;
  const integratesWithRe = /integratesWith\s*:\s*\[([^\]]*)\]/;
  const descriptionRe = /description\s*:\s*["']([^"']*)["']/;
  for (const file of walk(engineDir)) {
    const text = fs.readFileSync(file, "utf8");
    let m;
    while ((m = nameRe.exec(text)) !== null) {
      const name = m[1];
      const blockStart = text.indexOf(m[0]);
      const blockEnd = text.indexOf("});", blockStart);
      const block = blockEnd > blockStart ? text.slice(blockStart, blockEnd + 3) : text.slice(blockStart, blockStart + 800);
      let integratesWith: string[] | undefined;
      let description: string | undefined;
      const iw = block.match(integratesWithRe);
      if (iw && iw[1]) {
        const parts = iw[1].match(/"([^"]+)"/g) ?? iw[1].match(/'([^']+)'/g);
        integratesWith = parts ? parts.map((s) => s.slice(1, -1)) : undefined;
      }
      const desc = block.match(descriptionRe);
      if (desc) description = desc[1];
      out.push({
        name,
        integratesWith: integratesWith ?? undefined,
        description: description ?? "unknown",
      });
    }
  }
  return out;
}

async function discoverEngines(): Promise<BuildAuthoritySurfaceV2["systemDrivenReference"]["engines"]> {
  try {
    const { registerBuiltinStructureTypes } = await import("@/system/registry/registerBuiltins");
    const { loadRegistrations } = await import("@/system/registry/loader");
    const { getEngines } = await import("@/system/registry/engineRegistry");
    registerBuiltinStructureTypes();
    await loadRegistrations({
      repoRoot: ROOT,
      engineDir: "src/05_Logic/logic/engines",
      templateDirs: ["src/lib/tsx-structure/resolver", "src/04_Presentation/components/organs/tsx"],
    });
    const engines = getEngines();
    if (engines.length > 0) {
      return engines.map((e) => ({ name: e.name, integratesWith: e.integratesWith, description: e.description }));
    }
  } catch {
    // fall through to file scan
  }
  return discoverEnginesByScan();
}

/** Recursively collect all node `type` values from a screen/app tree (for molecule detection). */
function extractNodeTypesFromTree(node: unknown): string[] {
  if (!node || typeof node !== "object") return [];
  const obj = node as Record<string, unknown>;
  const types: string[] = [];
  if (typeof obj.type === "string") types.push((obj.type as string).toLowerCase());
  const children = Array.isArray(obj.children) ? obj.children : [];
  for (const child of children) types.push(...extractNodeTypesFromTree(child));
  return types;
}

function extractActionsFromTree(node: unknown): string[] {
  const out: string[] = [];
  if (!node || typeof node !== "object") return out;
  const obj = node as Record<string, unknown>;
  const behavior = obj.behavior as { type?: string; params?: { name?: string } } | undefined;
  if (behavior?.params?.name && typeof behavior.params.name === "string") out.push(behavior.params.name);
  const children = Array.isArray(obj.children) ? obj.children : [];
  for (const child of children) out.push(...extractActionsFromTree(child));
  return out;
}

function extractOrgansFromTree(node: unknown): { organId: string; variant?: string }[] {
  const out: { organId: string; variant?: string }[] = [];
  if (!node || typeof node !== "object") return out;
  const obj = node as Record<string, unknown>;
  const t = (obj.type as string)?.toLowerCase();
  if (t === "organ" && typeof obj.organId === "string") {
    out.push({ organId: obj.organId, variant: typeof obj.variant === "string" ? obj.variant : undefined });
  }
  const children = Array.isArray(obj.children) ? obj.children : [];
  for (const child of children) out.push(...extractOrgansFromTree(child));
  return out;
}

function extractLayoutIdsFromTree(node: unknown): string[] {
  const out: string[] = [];
  if (!node || typeof node !== "object") return out;
  const obj = node as Record<string, unknown>;
  if (typeof obj.layout === "string") out.push(obj.layout);
  const children = Array.isArray(obj.children) ? obj.children : [];
  for (const child of children) out.push(...extractLayoutIdsFromTree(child));
  return out;
}

function extractPrimitivesFromTree(node: unknown, allowedKeys: Set<string>): string[] {
  const out: string[] = [];
  if (!node || typeof node !== "object") return out;
  const obj = node as Record<string, unknown>;
  const params = obj.params as Record<string, unknown> | undefined;
  if (params && typeof params === "object") {
    for (const key of Object.keys(params)) if (allowedKeys.has(key)) out.push(key);
  }
  const children = Array.isArray(obj.children) ? obj.children : [];
  for (const child of children) out.push(...extractPrimitivesFromTree(child, allowedKeys));
  return out;
}

/** Scan one app dir: read app.json if present and collect molecules used, actions, organs, primitives, layouts, etc. */
function scanAppForFindings(
  appPath: string,
  primitiveKeys: string[]
): AppScanFinding | null {
  const relativePath = path.relative(ROOT, appPath);
  const appJsonPath = path.join(appPath, "app.json");
  if (!fs.existsSync(appJsonPath)) return null;
  try {
    const raw = fs.readFileSync(appJsonPath, "utf8");
    const appJson = JSON.parse(raw) as Record<string, unknown>;
    const allTypes = extractNodeTypesFromTree(appJson);
    const moleculesUsed = [...new Set(allTypes.filter((t) => t && t !== "screen" && t !== "slot"))];
    const metadata = (appJson as { structure?: { type?: string; templateId?: string }; palette?: string }).structure;
    const primSet = new Set(primitiveKeys);
    const actionsUsed = [...new Set(extractActionsFromTree(appJson))];
    const organsUsed = extractOrgansFromTree(appJson);
    const organsUsedDedup = Array.from(
      new Map(organsUsed.map((o) => [`${o.organId}:${o.variant ?? ""}`, o])).values()
    );
    const layoutIdsUsed = [...new Set(extractLayoutIdsFromTree(appJson))];
    const primitivesUsed = [...new Set(extractPrimitivesFromTree(appJson, primSet))];
    const enginesUsed: string[] = [];
    const eng = (appJson as { engines?: string[] }).engines;
    if (Array.isArray(eng)) eng.forEach((e) => typeof e === "string" && enginesUsed.push(e));
    return {
      relativePath,
      appPath,
      moleculesUsed,
      structureType: metadata?.type,
      templateId: metadata?.templateId,
      palette: (appJson as { palette?: string }).palette,
      enginesUsed,
      blueprintNodeTypesUsed: [...new Set(allTypes)],
      actionsUsed,
      organsUsed: organsUsedDedup,
      primitivesUsed,
      layoutIdsUsed,
    };
  } catch {
    return null;
  }
}

/** All layout IDs that are valid (pageLayouts + componentLayouts + template values). */
function getAllowedLayoutIds(layoutIds: BuildAuthoritySurfaceV2["systemDrivenReference"]["layoutIds"]): Set<string> {
  const set = new Set<string>();
  for (const id of layoutIds.pageLayouts) set.add(id);
  for (const id of layoutIds.componentLayouts) set.add(id);
  for (const templateMap of Object.values(layoutIds.templates)) {
    if (templateMap && typeof templateMap === "object") for (const id of Object.values(templateMap)) set.add(id);
  }
  return set;
}

/** Check scan findings against contracts; return violation list. */
function checkViolations(
  findings: (AppScanFinding | null)[],
  surface: BuildAuthoritySurfaceV2
): BuildReportViolation[] {
  const violations: BuildReportViolation[] = [];
  const allowedMolSet = new Set(ALLOWED_MOLECULES);
  const structureSet = new Set(STRUCTURE_TYPES);
  const actionSet = new Set(surface.systemDrivenReference.actions);
  const engineNames = new Set(surface.systemDrivenReference.engines.map((e) => e.name));
  const primitiveSet = new Set(surface.buildingBlocks.primitiveRegistryKeys ?? []);
  const allowedLayoutSet = getAllowedLayoutIds(surface.systemDrivenReference.layoutIds);
  const organIds = new Set(Object.keys(surface.buildingBlocks.organs));
  const paletteSet = new Set(surface.systemDrivenReference.palettes.map((p) => p.toLowerCase()));

  /** When true, missing structure type or template is HARD; when false, WARNING. */
  const strictDeclaration = process.env.RUN_APPS_STRICT_DECLARATION === "hard";

  for (const f of findings) {
    if (!f) continue;
    for (const mol of f.moleculesUsed) {
      const normalized = mol.toLowerCase();
      if (normalized === "screen" || normalized === "slot") continue;
      if (!allowedMolSet.has(normalized)) {
        violations.push({
          appPath: f.relativePath,
          code: "MOLECULE_NOT_IN_SET",
          message: `Molecule type "${mol}" is not in the fixed 12. Allowed: ${[...ALLOWED_MOLECULES].join(", ")}.`,
          severity: "hard",
        });
      }
    }
    if (f.structureType && !structureSet.has(f.structureType.toLowerCase())) {
      violations.push({
        appPath: f.relativePath,
        code: "STRUCTURE_TYPE_NOT_IN_CONTRACT",
        message: `Structure type "${f.structureType}" is not in LAYOUT_SYSTEM_CONTRACT (allowed: ${[...STRUCTURE_TYPES].join(", ")}).`,
        severity: "hard",
      });
    }
    if (f.structureType && f.templateId) {
      const templates = TEMPLATES_BY_STRUCTURE_TYPE[f.structureType.toLowerCase()];
      if (templates && !(templates as readonly string[]).includes(f.templateId)) {
        violations.push({
          appPath: f.relativePath,
          code: "TEMPLATE_NOT_IN_CONTRACT",
          message: `Template "${f.templateId}" for structure type "${f.structureType}" is not in contract. Allowed for ${f.structureType}: ${templates.join(", ")}.`,
          severity: "hard",
        });
      }
    }
    for (const action of f.actionsUsed) {
      if (!actionSet.has(action)) {
        violations.push({
          appPath: f.relativePath,
          code: "ACTION_NOT_IN_REGISTRY",
          message: `Action "${action}" is not in action registry.`,
          severity: "hard",
        });
      }
    }
    for (const o of f.organsUsed) {
      if (!organIds.has(o.organId)) {
        violations.push({
          appPath: f.relativePath,
          code: "ORGAN_NOT_IN_INDEX",
          message: `Organ "${o.organId}" is not in organ-index.`,
          severity: "hard",
        });
      } else {
        const def = surface.buildingBlocks.organs[o.organId];
        if (o.variant && def?.variants?.length && !def.variants.includes(o.variant)) {
          violations.push({
            appPath: f.relativePath,
            code: "ORGAN_VARIANT_NOT_IN_INDEX",
            message: `Organ "${o.organId}" variant "${o.variant}" is not in organ-index (allowed: ${def.variants.join(", ")}).`,
            severity: "hard",
          });
        }
      }
    }
    for (const prim of f.primitivesUsed) {
      if (!primitiveSet.has(prim)) {
        violations.push({
          appPath: f.relativePath,
          code: "PRIMITIVE_NOT_IN_REGISTRY",
          message: `Primitive "${prim}" is not in primitive registry.`,
          severity: "hard",
        });
      }
    }
    for (const layoutId of f.layoutIdsUsed) {
      if (!allowedLayoutSet.has(layoutId)) {
        violations.push({
          appPath: f.relativePath,
          code: "LAYOUT_ID_NOT_IN_DEFINITIONS",
          message: `Layout ID "${layoutId}" is not in layout-definitions (pageLayouts/componentLayouts/templates).`,
          severity: "hard",
        });
      }
    }
    for (const eng of f.enginesUsed) {
      if (!engineNames.has(eng)) {
        violations.push({
          appPath: f.relativePath,
          code: "ENGINE_NOT_IN_REGISTRY",
          message: `Engine "${eng}" is not in engine registry.`,
          severity: "hard",
        });
      }
    }
    if (f.palette && !paletteSet.has(f.palette.trim().toLowerCase())) {
      violations.push({
        appPath: f.relativePath,
        code: "PALETTE_NOT_IN_SET",
        message: `Palette "${f.palette}" is not in discovered palette list. Allowed: ${surface.systemDrivenReference.palettes.join(", ") || "(none discovered)"}.`,
        severity: "hard",
      });
    }
    if (f.moleculesUsed.length > 0) {
      if (!f.structureType) {
        violations.push({
          appPath: f.relativePath,
          code: "STRUCTURE_TYPE_MISSING",
          message: "App uses TSX wrapper system but structure type is not declared. Declare structure.type in app.json.",
          severity: strictDeclaration ? "hard" : "soft",
        });
      } else if (!f.templateId) {
        violations.push({
          appPath: f.relativePath,
          code: "TEMPLATE_MISSING",
          message: `Structure type "${f.structureType}" is declared but templateId is missing. Declare structure.templateId in app.json.`,
          severity: strictDeclaration ? "hard" : "soft",
        });
      }
    }
  }
  return violations;
}

/** Build the V2 Build Report markdown (authority surface first, then selections, then violations, then five questions). */
function buildBuildReportV2(
  surface: BuildAuthoritySurfaceV2,
  appFindings: (AppScanFinding | null)[],
  violations: BuildReportViolation[]
): string {
  const bb = surface.buildingBlocks;
  const sys = surface.systemDrivenReference;
  const lines: string[] = [];

  lines.push("# Build Report V2 (Contract-Governed)");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("Authority: `src/02_Contracts_Reports/contracts/` and APP_BUILD_PROTOCOL_V2.");
  lines.push("");
  lines.push("---");
  lines.push("## Contract surfaces (authority)");
  lines.push("");
  lines.push("### Actions registry keys");
  lines.push(sys.actions.length ? sys.actions.join(", ") : "(none)");
  lines.push("");
  lines.push("### Behavior verbs (contract-verbs)");
  lines.push((sys.behaviorVerbs ?? []).length ? (sys.behaviorVerbs as string[]).join(", ") : "(none)");
  lines.push("");
  lines.push("### Primitive registry keys");
  lines.push((bb.primitiveRegistryKeys ?? []).length ? (bb.primitiveRegistryKeys as string[]).join(", ") : "(none)");
  lines.push("");
  lines.push("### Organ-index (organ IDs / variants)");
  for (const [organId, def] of Object.entries(bb.organs)) {
    lines.push(`- **${organId}**: variants: ${(def.variants ?? []).join(", ")}; slots: ${(def.slots ?? []).join(", ")}`);
  }
  if (Object.keys(bb.organs).length === 0) lines.push("(none)");
  lines.push("");
  lines.push("### Layout-definitions (pageLayouts / componentLayouts / templates)");
  lines.push("- **pageLayouts**: " + sys.layoutIds.pageLayouts.join(", ") || "(none)");
  lines.push("- **componentLayouts**: " + sys.layoutIds.componentLayouts.join(", ") || "(none)");
  for (const [tplName, tplMap] of Object.entries(sys.layoutIds.templates)) {
    if (tplMap && typeof tplMap === "object") {
      lines.push(`- **templates.${tplName}**: ` + Object.entries(tplMap).map(([k, v]) => `${k}=${v}`).join("; "));
    }
  }
  lines.push("");
  lines.push("### Blueprint universe (allowed node types)");
  lines.push(bb.blueprintNodeTypes.join(", "));
  lines.push("");
  lines.push("### Engine registry list");
  if (sys.engines.length) {
    for (const e of sys.engines) {
      lines.push(`- ${e.name}${e.integratesWith?.length ? ` (integratesWith: ${e.integratesWith.join(", ")})` : ""}${e.description ? ` — ${e.description}` : ""}`);
    }
  } else {
    lines.push("(None discovered.)");
  }
  lines.push("");

  lines.push("---");
  lines.push("## Runtime Defaults (Effective Resolution)");
  lines.push("");
  lines.push("When an app does **not** declare a value, the runtime resolves using these defaults. All inferred values must appear here or under Selected (Declared).");
  const runtimeDefaults = getRuntimeDefaults(sys.layoutIds);
  lines.push("- **Default layout ID (section):** From layout-definitions templates `defaultLayout` per template. When absent or no template: undefined.");
  const defaultLayoutEntries = Object.entries(runtimeDefaults.defaultSectionLayoutByTemplate).filter(([, v]) => v);
  if (defaultLayoutEntries.length) {
    for (const [tpl, id] of defaultLayoutEntries) lines.push(`  - Template \`${tpl}\`: \`${id}\``);
  } else {
    lines.push("  - (No defaultLayout keys in layout-definitions templates.)");
  }
  lines.push("- **Default palette:** \`" + runtimeDefaults.defaultPalette + "` (from palette-store / app fallback).");
  lines.push("- **Default structure type / template:** \`" + runtimeDefaults.defaultStructureType + "\` / \`" + runtimeDefaults.defaultTemplateId + "` (from LAYOUT_SYSTEM_CONTRACT convention).");
  lines.push("- **Default TSX envelope profile:** " + runtimeDefaults.defaultTsxEnvelopeProfile + ".");
  lines.push("");

  lines.push("---");
  lines.push("## A. All available structure types");
  lines.push("");
  lines.push([...STRUCTURE_TYPES].join(", "));
  lines.push("");

  lines.push("---");
  lines.push("## B. Selected structure type + why");
  lines.push("");
  const withStructure = appFindings.filter((f): f is AppScanFinding => f != null && f.structureType != null);
  if (withStructure.length) {
    for (const f of withStructure) {
      lines.push(`- **${f.relativePath}**: ${f.structureType} (from app metadata)`);
    }
  } else {
    lines.push("(No structure type declared in scanned app.json metadata.)");
  }
  lines.push("");

  lines.push("---");
  lines.push("## C. All available templates");
  lines.push("");
  for (const st of STRUCTURE_TYPES) {
    const tpl = (TEMPLATES_BY_STRUCTURE_TYPE as Record<string, string[]>)[st] ?? [];
    lines.push(`- **${st}**: ${tpl.join(", ")}`);
  }
  lines.push("");

  lines.push("---");
  lines.push("## D. Selected template + why");
  lines.push("");
  const withTemplate = appFindings.filter((f): f is AppScanFinding => f != null && f.templateId != null);
  if (withTemplate.length) {
    for (const f of withTemplate) {
      lines.push(`- **${f.relativePath}**: ${f.templateId} (structure: ${f.structureType ?? "—"})`);
    }
  } else {
    lines.push("(No template declared in scanned app.json metadata.)");
  }
  lines.push("");

  lines.push("---");
  lines.push("## E. All available molecules (the fixed 12)");
  lines.push("");
  lines.push([...ALLOWED_MOLECULES].join(", "));
  lines.push("");

  lines.push("---");
  lines.push("## F. Molecules used / selected");
  lines.push("");
  const withMolecules = appFindings.filter((f): f is AppScanFinding => f != null && f.moleculesUsed.length > 0);
  if (withMolecules.length) {
    for (const f of withMolecules) {
      lines.push(`- **${f.relativePath}**: ${[...new Set(f.moleculesUsed)].join(", ")}`);
    }
  } else {
    lines.push("(No app.json scanned or no molecule types found.)");
  }
  lines.push("");

  lines.push("---");
  lines.push("## G. All available engines");
  lines.push("");
  if (sys.engines.length) {
    for (const e of sys.engines) {
      lines.push(`- ${e.name}${e.description ? ` — ${e.description}` : ""}`);
    }
  } else {
    lines.push("(None discovered.)");
  }
  lines.push("");

  lines.push("---");
  lines.push("## H. Engines used / selected");
  lines.push("");
  const withEngines = appFindings.filter((f): f is AppScanFinding => f != null && f.enginesUsed.length > 0);
  if (withEngines.length) {
    for (const f of withEngines) {
      lines.push(`- **${f.relativePath}**: ${f.enginesUsed.join(", ")}`);
    }
  } else {
    lines.push("(None declared in scanned apps.)");
  }
  lines.push("");

  lines.push("---");
  lines.push("## I. All available palettes");
  lines.push("");
  lines.push(sys.palettes.length ? sys.palettes.join(", ") : "(None discovered.)");
  lines.push("");

  lines.push("---");
  lines.push("## J. Palette used / selected");
  lines.push("");
  const withPalette = appFindings.filter((f): f is AppScanFinding => f != null && f.palette != null);
  if (withPalette.length) {
    for (const f of withPalette) {
      lines.push(`- **${f.relativePath}**: ${f.palette} (declared)`);
    }
  }
  const withoutPalette = appFindings.filter((f): f is AppScanFinding => f != null && (f.palette == null || f.palette === ""));
  if (withoutPalette.length) {
    lines.push("Apps without palette declared (effective default in Runtime Defaults above):");
    for (const f of withoutPalette) lines.push(`- **${f.relativePath}**: (inferred default)`);
  }
  if (withPalette.length === 0 && withoutPalette.length === 0) lines.push("(No app.json scanned.)");
  lines.push("");

  lines.push("---");
  lines.push("## K. Blueprint node types used (and which molecules appear)");
  lines.push("");
  if (withMolecules.length) {
    for (const f of withMolecules) {
      lines.push(`- **${f.relativePath}**: node types: ${f.blueprintNodeTypesUsed.join(", ")}; molecules: ${f.moleculesUsed.join(", ")}`);
    }
  } else {
    lines.push("(No app.json scanned.)");
  }
  lines.push("");

  lines.push("---");
  lines.push("## K2. Per-app used (validate against contract surfaces; violations in L)");
  lines.push("");
  const allFindings = appFindings.filter((f): f is AppScanFinding => f != null);
  for (const f of allFindings) {
    lines.push(`### ${f.relativePath}`);
    lines.push("- **Actions used**: " + (f.actionsUsed.length ? f.actionsUsed.join(", ") : "(none)"));
    lines.push("- **Organs used**: " + (f.organsUsed.length ? f.organsUsed.map((o) => o.variant ? `${o.organId}:${o.variant}` : o.organId).join(", ") : "(none)"));
    lines.push("- **Primitives used**: " + (f.primitivesUsed.length ? f.primitivesUsed.join(", ") : "(none)"));
    lines.push("- **Layout IDs used**: " + (f.layoutIdsUsed.length ? f.layoutIdsUsed.join(", ") : "(none)"));
    lines.push("- **Engines used**: " + (f.enginesUsed.length ? f.enginesUsed.join(", ") : "(none)"));
    lines.push("");
  }
  if (allFindings.length === 0) lines.push("(No app.json scanned.)");
  lines.push("");

  lines.push("---");
  lines.push("## L. Contract violations");
  lines.push("");
  if (violations.length) {
    for (const v of violations) {
      lines.push(`- **${v.severity.toUpperCase()}** ${v.appPath ? `[${v.appPath}] ` : ""}${v.code}: ${v.message}`);
    }
  } else {
    lines.push("(None detected.)");
  }
  lines.push("");

  lines.push("---");
  lines.push("## Five questions");
  lines.push("");
  lines.push("- **What did I see?** Full authority surface above (structure types, templates, molecules, engines, palettes).");
  lines.push("- **What did I choose?** Selections per app in sections B, D, F, H, J.");
  lines.push("- **What did I invent?** Anything used that is not in the contract must appear in Violations (L).");
  lines.push("- **What did I violate?** See section L (molecule set, structure type, template, TSX/palette rules).");
  lines.push("- **What universal system did I extract?** Cross-app engines/behaviors must be registered and contract-aligned.");
  lines.push("");

  return lines.join("\n");
}

function runDiscovery(): Omit<BuildAuthoritySurfaceV2, "buildingBlocks" | "systemDrivenReference"> & {
  buildingBlocks: BuildAuthoritySurfaceV2["buildingBlocks"];
  systemDrivenReference: Omit<BuildAuthoritySurfaceV2["systemDrivenReference"], "actions" | "engines"> & { actions: string[]; engines: BuildAuthoritySurfaceV2["systemDrivenReference"]["engines"] };
} {
  const palettes = discoverPalettes();
  const layoutIds = discoverLayoutIds();
  const moleculesFs = discoverMoleculesFromFilesystem();
  const componentMapKeys = extractObjectKeysFromSource(PATH_MOLECULES_INDEX, "COMPONENT_MAP");
  const moleculeIds = moleculesFs.length ? moleculesFs : componentMapKeys;
  const organsFromIndex = discoverOrganIndex();
  const organsFromFs = discoverOrgansAndVariants();
  const organs = Object.keys(organsFromIndex).length ? organsFromIndex : organsFromFs;
  const blueprintNodeTypes = [...new Set([...Object.keys(ALLOWED_CONTENT_KEYS), ...Object.keys(organs), "Flow", "Step", "Choice", "Section", "System", "screen", "organ"])].sort();
  const primitiveRegistryKeys = discoverPrimitiveRegistryKeys();
  const actions = discoverActionsFromSource();
  const behaviorVerbs = discoverBehaviorVerbs();

  const molecules = moleculeIds.map((id) => ({
    id,
    allowedContentKeys: ALLOWED_CONTENT_KEYS[id] ?? [],
    expectedParams: EXPECTED_PARAMS[id],
  }));

  return {
    version: "2.0",
    generatedBy: "npm run apps",
    buildingBlocks: {
      molecules,
      organs,
      structureTypes: [...STRUCTURE_TYPES],
      blueprintNodeTypes,
      allowedContentKeys: ALLOWED_CONTENT_KEYS,
      expectedParams: EXPECTED_PARAMS,
      primitiveRegistryKeys,
    },
    systemDrivenReference: {
      palettes,
      layoutIds,
      actions,
      behaviorVerbs,
      engines: [],
    },
    sources: {
      palettes: "src/04_Presentation/palettes/*.json",
      layoutDefinitions: "src/04_Presentation/layout/data/layout-definitions.json",
      molecules: "src/04_Presentation/components/molecules/",
      organs: "src/04_Presentation/components/organs/",
      organIndex: "src/07_Dev_Tools/scripts/organ-index.json",
      expectedParams: "src/02_Contracts_Reports/contracts/expected-params.ts",
      blueprint: "src/07_Dev_Tools/scripts/blueprint.ts",
      actionRegistry: "src/05_Logic/logic/runtime/action-registry.ts",
      contractVerbs: "src/02_Contracts_Reports/contracts/contract-verbs.ts",
      primitiveRegistry: "src/lib/director/primitive-registry.ts",
      engineRegistry: "src/system/registry/engineRegistry.ts",
    },
  };
}

function readRuleFiles(root: string): { path: string; content: string }[] {
  return RULE_FILE_PATHS.map((relPath) => {
    const fullPath = path.join(root, relPath);
    if (!fs.existsSync(fullPath)) return { path: relPath, content: `(MISSING FILE) ${relPath}` };
    return { path: relPath, content: fs.readFileSync(fullPath, "utf8") };
  });
}

function buildCursorBuildCommandMd(
  surface: BuildAuthoritySurfaceV2,
  description: string,
  ruleContents: { path: string; content: string }[]
): string {
  const bb = surface.buildingBlocks;
  const sys = surface.systemDrivenReference;
  const lines: string[] = [];

  lines.push("# 0. NON-NEGOTIABLE DOCTRINE (Read First)");
  lines.push("");
  lines.push("- **1) Current State system** — no schema; state is system-driven.");
  lines.push("- **2) Palette system** — multi-part modular, chosen by system dropdown; never hardcoded.");
  lines.push("- **3) Layout system** — layout-definitions; chosen by system runtime, never hardcoded into TSX.");
  lines.push("- **4) Behavior system** — actions/engines/hooks must remain system-driven; no hardcoded flows.");
  lines.push("- **5) Molecule contracts** — content keys + params; TSX must not invent structure.");
  lines.push("- **6) Organ contracts** — variants + slots; blueprint-driven.");
  lines.push("- **7) Strict BLUEPRINT.txt + CONTENT.txt adherence** — no deviation.");
  lines.push("- **8) TSX files are dumb wrappers only** — JSON-driven; no structure/styling/content in TSX.");
  lines.push("- **9) Compatibility across web/app/learning render layers**.");
  lines.push("- **10) No mutation guarantee** — compileApp, runtime, registries, json-screen untouched.");
  lines.push("");
  lines.push("**npm run apps does not validate, score, decide, infer, or choose anything.** It only scans surfaces and emits this template.");
  lines.push("**Cursor must not ask questions; if ambiguous, suggest a change set.**");
  lines.push("");

  lines.push("# 1. Requested System Description");
  lines.push("");
  lines.push("- New action? YES / NO");
  lines.push(description);
  lines.push("");

  lines.push("# 2. Building Blocks Cursor May Use (CHOOSABLE)");
  lines.push("");
  lines.push("## 2.1 Molecules (id + allowed content keys + expected params)");
  for (const m of bb.molecules) {
    lines.push(`- **${m.id}**: content keys: [${m.allowedContentKeys.join(", ")}]${m.expectedParams ? `; expected params: [${m.expectedParams.join(", ")}]` : ""}`);
  }
  lines.push("");
  lines.push("## 2.2 Organs (id + variants + slots)");
  for (const [organId, def] of Object.entries(bb.organs)) {
    lines.push(`- **${organId}**: variants: [${def.variants.join(", ")}]; slots: [${def.slots.join(", ")}]`);
  }
  lines.push("");
  lines.push("## 2.3 Structure Types (allowed TSX wrapper families)");
  lines.push(bb.structureTypes.join(", "));
  lines.push("");
  lines.push("## 2.4 Blueprint Node Grammar (allowed node types)");
  lines.push(bb.blueprintNodeTypes.join(", "));
  lines.push("");

  lines.push("# 3. System-Driven References (NOT chosen per app)");
  lines.push("");
  lines.push("- **Palettes** (system dropdown chooses; DO NOT hardcode): " + sys.palettes.join(", "));
  lines.push("- **Layout IDs** (layout resolver chooses; DO NOT hardcode): pageLayouts: " + sys.layoutIds.pageLayouts.join(", ") + "; componentLayouts: " + sys.layoutIds.componentLayouts.join(", "));
  lines.push("- **Behaviors** (actions/engines exist; DO NOT hardcode flows): actions: " + sys.actions.join(", ") + "; engines: " + sys.engines.map((e) => e.name).join(", "));
  lines.push("");

  lines.push("# 4. How to Build (Cursor must generate these outputs)");
  lines.push("");
  lines.push("## 4.1 blueprint.txt rules (strict)");
  lines.push("- One node per line; hierarchy by indentation; type from blueprint node grammar only.");
  lines.push("- Sections and organs use allowed node types; arrows for flow where applicable.");
  lines.push("- **DO NOT hardcode palette, layout, or behavior in blueprint.**");
  lines.push("");
  lines.push("## 4.2 content.txt rules (strict)");
  lines.push("- One content block per blueprint node; keys must match molecule/organ contract (allowed content keys only).");
  lines.push("- **DO NOT hardcode palette, layout, or behavior in content.**");
  lines.push("");
  lines.push("## 4.3 wrapper config JSON rules (strict; TSX is dumb)");
  lines.push("- Wrapper config comes from structure type and system; TSX consumes JSON only.");
  lines.push("- **DO NOT hardcode palette, layout, or behavior in TSX or wrapper config.**");
  lines.push("");

  lines.push("# 5. Cursor Fill-Out Enforcement Template (Cursor must complete)");
  lines.push("");
  lines.push("## 5.1 TSX Wrapper Declaration");
  lines.push("Wrapper type: ___________");
  lines.push("Explain selection: ___________");
  lines.push("");
  lines.push("## 5.2 Blueprint Plan");
  lines.push("(Cursor fills)");
  lines.push("");
  lines.push("## 5.3 Content Plan");
  lines.push("(Cursor fills)");
  lines.push("");
  lines.push("## 5.4 Behavior Compatibility Plan (system-driven)");
  lines.push("Describe how you used existing behaviors WITHOUT creating new ones: ___________");
  lines.push("");
  lines.push("## 5.5 Registry Impact Check (STOP if YES)");
  lines.push("- New molecule? YES / NO");

  lines.push("- New organ? YES / NO");
  lines.push("- New layout? YES / NO");
  lines.push("- New behavior/action? YES / NO");
  lines.push("- New engine? YES / NO");
  lines.push("If YES → STOP and request approval.");
  lines.push("");

  lines.push("# 6. Full Compliance Rules (INLINED FOR REVIEW)");
  lines.push("");
  for (const { path: rulePath, content } of ruleContents) {

    lines.push("## " + rulePath);
    lines.push("");
    lines.push("```");
    lines.push(content);
    lines.push("```");
    lines.push("");

  }

  lines.push("# 7. Strict Non-Mutation Guarantee (must be present)");
  lines.push("");
  lines.push("- compileApp untouched");

  lines.push("- runtime untouched");
  lines.push("- registries untouched");
  lines.push("- renderer/json-screen untouched");

  lines.push("- only run-apps.ts changed (for this export behavior)");
  lines.push("");

  return lines.join("\n");
}

function findAppDirs(root: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(root)) return out;
  const entries = fs.readdirSync(root, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(root, e.name);
    if (!e.isDirectory()) continue;
    if (fs.existsSync(path.join(full, "blueprint.txt"))) out.push(full);
    out.push(...findAppDirs(full));
  }
  return out;
}

/** Find dirs that contain app.json (for scan/verify without requiring blueprint.txt). */
function findAppDirsWithAppJson(root: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(root)) return out;
  const entries = fs.readdirSync(root, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(root, e.name);
    if (!e.isDirectory()) continue;
    if (fs.existsSync(path.join(full, "app.json"))) out.push(full);
    out.push(...findAppDirsWithAppJson(full));
  }
  return out;
}

function collectAppPaths(): string[] {
  const seen = new Set<string>();
  const paths: string[] = [];
  for (const p of findAppDirs(APPS_ROOT)) {
    if (!seen.has(p)) { seen.add(p); paths.push(p); }
  }
  for (const p of findAppDirs(GENERATED_ROOT)) {
    if (!seen.has(p)) { seen.add(p); paths.push(p); }
  }
  return paths.sort();
}

/** Collect all app dirs that have app.json (for Build Report scan). */
function collectAppPathsWithAppJson(): string[] {
  const seen = new Set<string>();
  const paths: string[] = [];
  for (const p of findAppDirsWithAppJson(APPS_ROOT)) {
    if (!seen.has(p)) { seen.add(p); paths.push(p); }
  }
  for (const p of findAppDirsWithAppJson(GENERATED_ROOT)) {
    if (!seen.has(p)) { seen.add(p); paths.push(p); }
  }
  return paths.sort();
}

function buildReport(results: AppResult[], enforcementGaps: string[], totalApps: number): string {
  const lines: string[] = [];
  lines.push("# Apps enforcement report");
  lines.push("");
  lines.push("Generated by `npm run apps` (single authority: compileApp only). No scoring or validation.");
  lines.push("");

  lines.push("## Summary");
  lines.push("");

  const ok = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok).length;
  lines.push(`- Total app dirs: ${totalApps}`);
  lines.push(`- Compiled OK: ${ok}`);
  lines.push(`- Failed: ${fail}`);
  lines.push(`- Enforcement gaps: ${enforcementGaps.length}`);
  lines.push("");

  lines.push("## Per-app results");
  lines.push("");
  for (const r of results) {

    lines.push(`### ${r.relativePath}`);
    lines.push("");
    lines.push(`- **Status:** ${r.ok ? "OK" : "FAIL"}`);
    if (r.error) lines.push(`- **Error:** ${r.error}`);
    if (r.validation) lines.push(`- **Validation:** ${r.validation.errors.length} error(s), ${r.validation.warnings.length} warning(s), safeToContinue: ${r.validation.safeToContinue}`);

    if (r.manifestKeys != null) lines.push(`- **Manifest keys:** ${r.manifestKeys}`);
    lines.push("");
  }
  if (enforcementGaps.length) {
    lines.push("## Enforcement gaps");
    lines.push("");
    for (const g of enforcementGaps) lines.push(`- ${g}`);
    lines.push("");
  }
  lines.push("## Authority");
  lines.push("");
  lines.push("- Single entry: `npm run apps` → run-apps.ts.");
  lines.push("- Single compiler: blueprint.ts compileApp(). Only it produces app.json.");
  lines.push("");
  lines.push("## Strict non-mutation guarantee");
  lines.push("");
  lines.push("- compileApp untouched; runtime untouched; registries untouched; renderer/json-screen untouched.");
  lines.push("");
  return lines.join("\n");
}

async function run(): Promise<void> {
  console.log("[run-apps] v2 — NON-INTERACTIVE scan + verify + report only.\n");

  const surface = runDiscovery();
  surface.systemDrivenReference.engines = await discoverEngines();

  const surfacePath = path.join(ROOT, "BUILD_AUTHORITY_SURFACE.json");
  fs.writeFileSync(surfacePath, JSON.stringify(surface, null, 2), "utf8");
  console.log(`[run-apps] Wrote ${surfacePath}`);

  const ruleContents = readRuleFiles(ROOT);
  const commandPath = path.join(ROOT, "CURSOR_BUILD_COMMAND.md");
  const commandMd = buildCursorBuildCommandMd(surface, "(scan+verify+report only; non-interactive)", ruleContents);
  fs.writeFileSync(commandPath, commandMd, "utf8");
  console.log(`[run-apps] Wrote ${commandPath}`);

  const auditDir = path.join(ROOT, "_audit");
  if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir, { recursive: true });
  fs.writeFileSync(path.join(auditDir, "BUILD_AUTHORITY_SURFACE.json"), JSON.stringify(surface, null, 2), "utf8");
  fs.writeFileSync(path.join(auditDir, "CURSOR_BUILD_COMMAND.md"), commandMd, "utf8");
  console.log("[run-apps] Wrote _audit/BUILD_AUTHORITY_SURFACE.json and _audit/CURSOR_BUILD_COMMAND.md");

  // --- Build Report V2: scan + verify + report (no compile by default)
  if (!fs.existsSync(BUILD_REPORTS_DIR)) fs.mkdirSync(BUILD_REPORTS_DIR, { recursive: true });
  const appPathsWithJson = collectAppPathsWithAppJson();
  console.log(`[run-apps] Scanning ${appPathsWithJson.length} app(s) with app.json for Build Report.\n`);

  const findings: (AppScanFinding | null)[] = [];
  const primitiveKeys = surface.buildingBlocks.primitiveRegistryKeys ?? [];
  for (const appPath of appPathsWithJson) {
    const f = scanAppForFindings(appPath, primitiveKeys);
    findings.push(f);
    if (f) console.log(`  Scan ${f.relativePath}: molecules [${f.moleculesUsed.join(", ")}]`);
  }

  const violations = checkViolations(findings, surface);
  const buildReportMd = buildBuildReportV2(surface, findings, violations);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const buildReportPath = path.join(BUILD_REPORTS_DIR, `BUILD_REPORT_${timestamp}.md`);
  fs.writeFileSync(buildReportPath, buildReportMd, "utf8");
  console.log(`\n[run-apps] Wrote Build Report: ${buildReportPath}`);
  console.log(`[run-apps] Violations: ${violations.length}`);

  // Legacy apps-enforcement-report (summary; no compile)
  const summaryResults: AppResult[] = appPathsWithJson.map((appPath) => ({
    appPath,
    relativePath: path.relative(ROOT, appPath),
    ok: !violations.some((v) => v.appPath === path.relative(ROOT, appPath)),
  }));
  const reportPath = path.join(ROOT, "apps-enforcement-report.md");
  const legacyReport = [
    "# Apps enforcement report",
    "",
    "Generated by `npm run apps` (scan + verify + report; no build by default).",
    "",
    "## Summary",
    "",
    `- Apps scanned (with app.json): ${appPathsWithJson.length}`,
    `- Contract violations: ${violations.length}`,
    `- Full Build Report: ${path.relative(ROOT, buildReportPath)}`,
    "",
  ].join("\n");
  fs.writeFileSync(reportPath, legacyReport, "utf8");
  console.log(`[run-apps] Wrote ${reportPath}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
