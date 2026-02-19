/**
 * Runtime contract validation for TSX website screens.
 * Same pattern as validateScreenJson for JSON screens — ensures nodes, nodeOrder, and optional palette.
 */
import { palettes } from "@/palettes";
import type { TsxWebsiteContract } from "./types";

export type TsxWebsiteContractValidation = {
  valid: boolean;
  errors: string[];
  /** Resolved palette name (contract.palette if valid, else "default"). */
  resolvedPaletteName: string;
};

function getValidPaletteNames(): string[] {
  return Object.keys(palettes ?? {});
}

/**
 * Validates TSX website contract and resolves palette to a valid global palette name.
 * Use resolvedPaletteName when syncing to state/palette-store so Palette Contract stays PASS.
 */
export function validateTsxWebsiteContract(contract: unknown): TsxWebsiteContractValidation {
  const errors: string[] = [];
  const validNames = getValidPaletteNames();

  if (!contract || typeof contract !== "object") {
    return { valid: false, errors: ["Contract is missing or not an object"], resolvedPaletteName: "default" };
  }

  const c = contract as TsxWebsiteContract;

  if (!Array.isArray(c.nodes)) {
    errors.push("Contract must have a 'nodes' array");
  }
  if (!Array.isArray(c.nodeOrder)) {
    errors.push("Contract must have a 'nodeOrder' array");
  }

  const requestedPalette = typeof c.palette === "string" ? c.palette.trim() : undefined;
  const defaultName = validNames.length > 0 && validNames.includes("default") ? "default" : validNames[0] ?? "default";
  const resolvedPaletteName =
    requestedPalette && validNames.includes(requestedPalette) ? requestedPalette : defaultName;
  if (requestedPalette && !validNames.includes(requestedPalette)) {
    errors.push(`Palette "${requestedPalette}" is not in global palette set; using "default"`);
  }

  return {
    valid: errors.length === 0,
    errors,
    resolvedPaletteName,
  };
}
