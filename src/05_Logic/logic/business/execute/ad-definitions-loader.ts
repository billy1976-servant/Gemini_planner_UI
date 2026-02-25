/**
 * Load ad definitions from Business_Files/<businessId>/ads/*.json
 * Auto-discover JSON files; no registry. Returns empty array if folder missing.
 */

import * as fs from "fs";
import * as path from "path";
import type { AdDefinition } from "./ad-types";
import { validateAdDefinition } from "./ad-types";

const BUSINESS_FILES = path.join(process.cwd(), "src", "00_Projects", "Business_Files");

export function loadAdDefinitions(businessId: string): AdDefinition[] {
  if (!businessId || typeof businessId !== "string") {
    return [];
  }
  const trimmed = businessId.trim();
  if (trimmed === "") return [];

  const adsDir = path.join(BUSINESS_FILES, trimmed, "ads");
  if (!fs.existsSync(adsDir) || !fs.statSync(adsDir).isDirectory()) {
    return [];
  }

  const entries = fs.readdirSync(adsDir, { withFileTypes: true });
  const result: AdDefinition[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".json")) {
      continue;
    }
    const filePath = path.join(adsDir, entry.name);
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw);
      const ad = validateAdDefinition(data);
      result.push(ad);
    } catch (err) {
      throw new Error(
        `Invalid ad definition in ${entry.name}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return result;
}
