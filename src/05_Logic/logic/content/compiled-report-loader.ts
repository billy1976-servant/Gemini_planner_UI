/**
 * Compiled Report Loader
 * 
 * Read-only loader for compiled website reports.
 * Must not mutate the report.
 * 
 * CONTRACT-BOUNDARY: Do not change shape without updating SystemContract.ts
 */

import * as fs from "fs";
import * as path from "path";

export interface CompiledReport {
  siteUrl: string;
  siteKey: string;
  generatedAt: string;
  siteSnapshot: any;
  productGraph: any;
  researchBundle: any;
  valueModel: any;
}

const COMPILED_SITES_DIR = path.join(process.cwd(), "src", "screens", "generated-websites");

/**
 * Load compiled report by site key
 * 
 * @param siteKey - The site key (e.g., "bendsoapcompany-com")
 * @returns The compiled report or null if not found
 */
export function loadCompiledReport(siteKey: string): CompiledReport | null {
  const reportPath = path.join(COMPILED_SITES_DIR, siteKey, "report.final.json");

  if (!fs.existsSync(reportPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(reportPath, "utf8");
    const report = JSON.parse(content) as CompiledReport;
    return report;
  } catch (error) {
    console.error(`[CompiledReportLoader] Error loading report for ${siteKey}:`, error);
    return null;
  }
}

/**
 * List all compiled site keys
 * 
 * @returns Array of site keys
 */
export function listCompiledSites(): string[] {
  if (!fs.existsSync(COMPILED_SITES_DIR)) {
    return [];
  }

  try {
    const entries = fs.readdirSync(COMPILED_SITES_DIR, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch (error) {
    console.error(`[CompiledReportLoader] Error listing compiled sites:`, error);
    return [];
  }
}

/**
 * Check if a compiled report exists for a site key
 * 
 * @param siteKey - The site key
 * @returns True if report exists, false otherwise
 */
export function hasCompiledReport(siteKey: string): boolean {
  const reportPath = path.join(COMPILED_SITES_DIR, siteKey, "report.final.json");
  return fs.existsSync(reportPath);
}
