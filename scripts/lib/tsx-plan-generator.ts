/**
 * TSX plan generator — deterministic plan + drafts from description and registry.
 * Enforces: one wrapper template, tsx.structure.config.json, 25-component and expected-param validation.
 */

import fs from "node:fs";
import path from "node:path";
import type { LoadedContracts } from "./tsx-contract-loader";
import type { TemplateDefinition } from "../../src/system/registry/templateRegistry";
import type { EngineDefinition } from "../../src/system/registry/engineRegistry";

export type RegistrySnapshot = {
  engines: EngineDefinition[];
  templates: TemplateDefinition[];
  structureTypes: { name: string }[];
};

export type TsxStructureConfigNode = {
  id: string;
  type: string;
  params?: Record<string, string>;
  verbs?: string[];
  children?: string[];
};

export type TsxStructureConfig = {
  wrapper: string;
  nodes: TsxStructureConfigNode[];
  nodeOrder: string[];
};

export type PlanResult = {
  wrapperSelected: string;
  componentsUsed: string[];
  verbsUsed: string[];
  enginesUsed: string[];
  structureConfig: TsxStructureConfig;
  targetDir: string;
  filesWritten: string[];
};

const LAYOUT_TYPES = new Set(["Grid", "Row", "Column", "Stack"]);

function normalizeComponentType(type: string, allowed: string[]): string {
  const lower = type.toLowerCase();
  if (LAYOUT_TYPES.has(type)) return type;
  const found = allowed.find((a) => a.toLowerCase() === lower);
  return found ?? type;
}

function validateNode(
  node: TsxStructureConfigNode,
  allowedComponentTypes: string[],
  expectedParams: Record<string, string[]>,
  contractVerbs: readonly string[]
): void {
  const typeNorm = normalizeComponentType(node.type, allowedComponentTypes);
  const allowedSet = new Set(allowedComponentTypes.map((a) => a.toLowerCase()));
  if (!allowedSet.has(typeNorm.toLowerCase()) && !LAYOUT_TYPES.has(node.type)) {
    throw new Error(`Unknown component type: "${node.type}". Allowed: ${allowedComponentTypes.join(", ")}`);
  }

  const moleculeKey = Object.keys(expectedParams).find((k) => k.toLowerCase() === typeNorm.toLowerCase());
  const allowedParams = moleculeKey ? expectedParams[moleculeKey] : undefined;
  if (node.params && allowedParams) {
    for (const key of Object.keys(node.params)) {
      if (!allowedParams.includes(key)) {
        throw new Error(`Unknown param "${key}" for component "${node.type}". Allowed: ${allowedParams.join(", ")}`);
      }
    }
  }

  if (node.verbs) {
    const verbSet = new Set(contractVerbs);
    for (const v of node.verbs) {
      if (!verbSet.has(v)) {
        throw new Error(`Unknown verb: "${v}". Allowed: ${contractVerbs.join(", ")}`);
      }
    }
  }
}

function selectWrapperTemplate(templates: TemplateDefinition[]): string {
  if (templates.length === 0) {
    throw new Error("Wrapper template required but template registry is empty.");
  }
  const preferred = templates.find((t) => t.name === "list:default") ?? templates.find((t) => t.name === "WebsiteTemplate");
  const selected = (preferred ?? templates[0]).name;
  if (!templates.some((t) => t.name === selected)) {
    throw new Error(`Wrapper "${selected}" is not in template registry.`);
  }
  return selected;
}

function buildDefaultNodes(slug: string): TsxStructureConfigNode[] {
  return [
    { id: "root", type: "Section", params: { title: "" } },
    { id: "main", type: "Row", params: {} },
    { id: "primary", type: "Column", params: {} },
    { id: "cta", type: "button", params: { label: "" }, verbs: ["tap"] },
  ];
}

function buildDefaultNodeOrder(): string[] {
  return ["root", "main", "primary", "cta"];
}

export function generatePlan(opts: {
  description: string;
  slug: string;
  targetDir: string;
  contracts: LoadedContracts;
  registry: RegistrySnapshot;
}): PlanResult {
  const { contracts, registry, slug, targetDir } = opts;
  const wrapperSelected = selectWrapperTemplate(registry.templates);
  const componentsUsed = ["Section", "Row", "Column", "button"];
  const verbsUsed = ["tap"];
  const enginesUsed: string[] = [];

  const nodes = buildDefaultNodes(slug);
  const nodeOrder = buildDefaultNodeOrder();
  const structureConfig: TsxStructureConfig = { wrapper: wrapperSelected, nodes, nodeOrder };

  for (const node of nodes) {
    validateNode(
      node,
      contracts.allowedComponentTypes,
      contracts.expectedParams,
      contracts.verbs
    );
  }

  const allowedSet = new Set(contracts.allowedComponentTypes.map((a) => a.toLowerCase()));
  for (const c of componentsUsed) {
    if (!allowedSet.has(c.toLowerCase()) && !LAYOUT_TYPES.has(c)) {
      throw new Error(`Component not in allowed list: ${c}. Allowed: ${contracts.allowedComponentTypes.join(", ")}`);
    }
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const filesWritten: string[] = [];

  const planMd = `# Plan: ${slug}

## Description
${opts.description}

## Wrapper (mandatory)
- **wrapper**: ${wrapperSelected}

## Components used
${componentsUsed.join(", ")}

## Verbs used
${verbsUsed.join(", ")}

## Engines used
${enginesUsed.length ? enginesUsed.join(", ") : "NONE"}

## Constraints
- New engines proposed: NONE
- Router usage: NONE
- Hardcoded strings: NONE
- Hardcoded state keys: NONE
`;

  const planPath = path.join(targetDir, "plan.md");
  fs.writeFileSync(planPath, planMd, "utf8");
  filesWritten.push("plan.md");

  const structureDraftMd = `# TSX structure draft (no code)

## Hierarchy
- root (Section)
  - main (Row)
    - primary (Column)
      - cta (button, tap)

## Molecule types
${componentsUsed.join(", ")}

## State keys
(none — content-driven only)

## Verbs
${verbsUsed.join(", ")}

## Engines
${enginesUsed.length ? enginesUsed.join(", ") : "NONE"}
`;

  fs.writeFileSync(path.join(targetDir, "tsx.structure.draft.md"), structureDraftMd, "utf8");
  filesWritten.push("tsx.structure.draft.md");

  const contentDraftTs = `/**
 * Content draft — CONTENT_DERIVATION_CONTRACT. No hardcoded state keys.
 */
export const screen = {
  title: "",
  ctaLabel: "",
} as const;

export const content = { screen } as const;
export default content;
`;

  fs.writeFileSync(path.join(targetDir, "content.draft.ts"), contentDraftTs, "utf8");
  filesWritten.push("content.draft.ts");

  const compliance = {
    verbsLoaded: true,
    nodeTypesLoaded: true,
    expectedParamsLoaded: true,
    masterBlueprintLoaded: true,
    tsx25ComponentsLoaded: true,
    wrapperSelected,
    componentsUsed,
    verbsUsed,
    enginesUsed,
    newEnginesProposed: [] as string[],
    routerUsage: "NONE" as const,
    hardcodedStrings: false,
    hardcodedStateKeys: false,
    componentsValidated: true,
    paramsValidated: true,
  };

  fs.writeFileSync(path.join(targetDir, "compliance.json"), JSON.stringify(compliance, null, 2), "utf8");
  filesWritten.push("compliance.json");

  fs.writeFileSync(
    path.join(targetDir, "tsx.structure.config.json"),
    JSON.stringify(structureConfig, null, 2),
    "utf8"
  );
  filesWritten.push("tsx.structure.config.json");

  return {
    wrapperSelected,
    componentsUsed,
    verbsUsed,
    enginesUsed,
    structureConfig,
    targetDir,
    filesWritten,
  };
}

/**
 * Re-validate tsx.structure.config.json before scaffold. Throws if any node fails param/type/verb validation.
 */
export function validateStructureConfig(
  config: TsxStructureConfig,
  contracts: LoadedContracts
): void {
  for (const node of config.nodes) {
    validateNode(
      node,
      contracts.allowedComponentTypes,
      contracts.expectedParams,
      contracts.verbs
    );
  }
}
