/**
 * Validates all learn flow version JSON files discovered by deck-platform catalog.
 * Usage: npm run deck:check
 */
import fs from "fs";
import { learnVersionAbsPath, loadCatalog } from "../src/lib/deck-platform/registry";
import { formatValidationReport, validateLandingDeck } from "../src/lib/landing-deck/validate-landing-deck";

let hasError = false;

for (const entry of loadCatalog()) {
  for (const versionKey of entry.availableVersions) {
    const abs = learnVersionAbsPath(entry.flowRootAbsPath, versionKey);
    const rel = abs.replace(/\\/g, "/");
    let raw: string;
    try {
      raw = fs.readFileSync(abs, "utf8");
    } catch (e) {
      console.error(`ERROR ${rel}: ${e instanceof Error ? e.message : String(e)}`);
      hasError = true;
      continue;
    }
    let deck: unknown;
    try {
      deck = JSON.parse(raw) as unknown;
    } catch (e) {
      console.error(`ERROR ${rel}: invalid JSON — ${e instanceof Error ? e.message : String(e)}`);
      hasError = true;
      continue;
    }
    const issues = validateLandingDeck(deck, { pathLabel: rel });
    const errors = issues.filter((i) => i.severity === "error");
    if (errors.length > 0) {
      hasError = true;
      console.error(formatValidationReport(issues));
    } else if (issues.some((i) => i.severity === "warn")) {
      console.warn(formatValidationReport(issues));
    } else {
      console.log(`OK ${rel}`);
    }
  }
}

process.exit(hasError ? 1 : 0);
