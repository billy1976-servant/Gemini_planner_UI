/**
 * TSX contract loader — single source for npm run app contract audit.
 * Loads only TSX contracts; does not reference JSON_SCREEN_CONTRACT or JSON compiler.
 */

import fs from "node:fs";
import path from "node:path";
import { CONTRACT_VERB_LIST } from "../../src/02_Contracts_Reports/contracts/contract-verbs";
import { LAYOUT_NODE_TYPES_LIST } from "../../src/02_Contracts_Reports/contracts/layout-node-types";
import { EXPECTED_PARAMS } from "../../src/02_Contracts_Reports/contracts/expected-params";

const CONTRACTS_DIR = "src/02_Contracts_Reports/contracts";

const MANDATORY_MD = [
  "BLUEPRINT_UNIVERSE_CONTRACT.md",
  "CONTENT_DERIVATION_CONTRACT.md",
  "ENGINE_LAWS.md",
  "PARAM_KEY_MAPPING.md",
] as const;

const MASTER_BLUEPRINT_FILE = "master-business.blueprint.txt";

export type LoadedContracts = {
  verbs: readonly string[];
  verbsCount: number;
  layoutNodeTypes: readonly string[];
  layoutNodeTypesCount: number;
  expectedParams: Record<string, string[]>;
  expectedParamCount: number;
  allowedComponentTypes: string[];
  mdContracts: Record<string, string>;
  masterBlueprint: string;
};

/**
 * Allowed component types = layout node types + molecule types (EXPECTED_PARAMS keys) + Stepper from blueprint.
 * Used for 25-component contract validation.
 */
function buildAllowedComponentTypes(): string[] {
  const layout = [...LAYOUT_NODE_TYPES_LIST];
  const molecules = Object.keys(EXPECTED_PARAMS);
  const fromBlueprint = ["stepper"];
  const set = new Set<string>([...layout, ...molecules, ...fromBlueprint]);
  return Array.from(set);
}

export function loadTsxContracts(repoRoot: string): LoadedContracts {
  const contractsPath = path.join(repoRoot, CONTRACTS_DIR);

  if (!fs.existsSync(contractsPath)) {
    throw new Error(`CONTRACT AUDIT FAIL: contracts dir not found: ${contractsPath}`);
  }

  const mdContracts: Record<string, string> = {};
  for (const name of MANDATORY_MD) {
    const p = path.join(contractsPath, name);
    if (!fs.existsSync(p)) {
      throw new Error(`CONTRACT AUDIT FAIL: mandatory contract missing: ${name}`);
    }
    mdContracts[name] = fs.readFileSync(p, "utf8");
  }

  const masterPath = path.join(contractsPath, MASTER_BLUEPRINT_FILE);
  if (!fs.existsSync(masterPath)) {
    throw new Error(`CONTRACT AUDIT FAIL: mandatory file missing: ${MASTER_BLUEPRINT_FILE}`);
  }
  const masterBlueprint = fs.readFileSync(masterPath, "utf8");

  const verbs = CONTRACT_VERB_LIST;
  const layoutNodeTypes = LAYOUT_NODE_TYPES_LIST;
  const expectedParams = EXPECTED_PARAMS;
  const expectedParamCount = Object.keys(EXPECTED_PARAMS).reduce(
    (sum, k) => sum + (EXPECTED_PARAMS[k]?.length ?? 0),
    0
  );
  const allowedComponentTypes = buildAllowedComponentTypes();
  if (allowedComponentTypes.length === 0) {
    throw new Error("CONTRACT AUDIT FAIL: TSX25 component list is empty.");
  }

  return {
    verbs: verbs as readonly string[],
    verbsCount: verbs.length,
    layoutNodeTypes: layoutNodeTypes as readonly string[],
    layoutNodeTypesCount: layoutNodeTypes.length,
    expectedParams,
    expectedParamCount,
    allowedComponentTypes,
    mdContracts,
    masterBlueprint,
  };
}
