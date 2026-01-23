/**
 * Website Compiler - Orchestrator
 * 
 * Performs these phases in order:
 * 1. scanWebsite(siteUrl) → siteSnapshot
 * 2. normalizeToProductGraph(siteSnapshot) → productGraph
 * 3. attachResearch(productGraph) → researchBundle
 * 4. runValueTranslation(productGraph, researchBundle) → valueModel
 * 
 * Writes final report artifact to: content/compiled/sites/{siteKey}/report.final.json
 */

import * as fs from "fs";
import * as path from "path";
import { scanWebsite } from "./adapters/scan-adapter";
import { normalizeToProductGraph } from "./adapters/normalize-adapter";
import { attachResearch } from "./adapters/research-adapter";
import { runValueTranslation } from "./adapters/value-translation-adapter";

export interface SiteSnapshot {
  url: string;
  html?: string;
  extractedAt: string;
  rawData: Record<string, any>;
}

export interface ResearchBundle {
  researchFacts: string[]; // Research fact IDs
  bindings: Record<string, string[]>; // assumptionId -> researchFactIds
}

export interface ValueModel {
  rankedValueConclusions: any[];
  valueImpactBlocks: any[];
  appliedAssumptions: string[];
  appliedResearchFacts: string[];
}

export interface FinalReport {
  siteUrl: string;
  siteKey: string;
  generatedAt: string;
  siteSnapshot: SiteSnapshot;
  productGraph: any;
  researchBundle: ResearchBundle;
  valueModel: ValueModel;
}

/**
 * Generate deterministic site key from URL
 * 
 * Rule: Strip protocol, strip trailing slashes, lowercase, replace non-alphanumerics with -
 * Example: https://bendsoapcompany.com/ → bendsoapcompany-com
 */
export function generateSiteKey(url: string): string {
  try {
    const urlObj = new URL(url);
    let siteKey = urlObj.hostname + urlObj.pathname;
    
    // Remove trailing slashes
    siteKey = siteKey.replace(/\/+$/, "");
    
    // Lowercase
    siteKey = siteKey.toLowerCase();
    
    // Replace non-alphanumerics with -
    siteKey = siteKey.replace(/[^a-z0-9]/g, "-");
    
    // Remove multiple consecutive dashes
    siteKey = siteKey.replace(/-+/g, "-");
    
    // Remove leading/trailing dashes
    siteKey = siteKey.replace(/^-+|-+$/g, "");
    
    return siteKey;
  } catch (error) {
    // Fallback: simple sanitization
    return url
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}

/**
 * Compile website to final report artifact
 */
export async function compileWebsite(siteUrl: string): Promise<void> {
  const siteKey = generateSiteKey(siteUrl);
  const outputDir = path.join(process.cwd(), "content", "compiled", "sites", siteKey);
  
  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`[COMPILE] Site key: ${siteKey}`);
  console.log(`[COMPILE] Output directory: ${outputDir}`);

  // Phase 1: Scan website
  console.log(`[COMPILE] Phase 1: Scanning website...`);
  const siteSnapshot = await scanWebsite(siteUrl);
  const snapshotPath = path.join(outputDir, "site.snapshot.json");
  fs.writeFileSync(snapshotPath, JSON.stringify(siteSnapshot, null, 2), "utf8");
  console.log(`[COMPILE] ✓ Site snapshot written to ${snapshotPath}`);

  // Phase 2: Normalize to product graph
  console.log(`[COMPILE] Phase 2: Normalizing to product graph...`);
  const productGraph = await normalizeToProductGraph(siteSnapshot);
  const graphPath = path.join(outputDir, "product.graph.json");
  fs.writeFileSync(graphPath, JSON.stringify(productGraph, null, 2), "utf8");
  console.log(`[COMPILE] ✓ Product graph written to ${graphPath}`);

  // Phase 3: Attach research
  console.log(`[COMPILE] Phase 3: Attaching research...`);
  const researchBundle = await attachResearch(productGraph);
  const researchPath = path.join(outputDir, "research.bundle.json");
  fs.writeFileSync(researchPath, JSON.stringify(researchBundle, null, 2), "utf8");
  console.log(`[COMPILE] ✓ Research bundle written to ${researchPath}`);

  // Phase 4: Run value translation
  console.log(`[COMPILE] Phase 4: Running value translation...`);
  const valueModel = await runValueTranslation(productGraph, researchBundle);
  const valuePath = path.join(outputDir, "value.model.json");
  fs.writeFileSync(valuePath, JSON.stringify(valueModel, null, 2), "utf8");
  console.log(`[COMPILE] ✓ Value model written to ${valuePath}`);

  // Construct final report
  const finalReport: FinalReport = {
    siteUrl,
    siteKey,
    generatedAt: new Date().toISOString(),
    siteSnapshot,
    productGraph,
    researchBundle,
    valueModel,
  };

  // Write final report
  const reportPath = path.join(outputDir, "report.final.json");
  fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2), "utf8");
  console.log(`[COMPILE] ✓ Final report written to ${reportPath}`);

  console.log(`[COMPILE] Compilation complete for ${siteKey}`);
}
