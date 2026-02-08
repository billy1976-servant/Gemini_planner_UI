#!/usr/bin/env ts-node
/**
 * Regenerate Gibson Product Graph - Full Re-scan
 * 
 * Re-scans Gibson website to extract full product dataset.
 * This will fetch fresh HTML from product pages and extract products.
 */

import * as fs from "fs";
import * as path from "path";
import { scanWebsite } from "./websites/adapters/scan-adapter";
import { normalizeToProductGraph } from "./websites/adapters/normalize-adapter";

const SITE_URL = "https://www.gibson.com";
const SITE_KEY = "gibson-com";
const OUTPUT_DIR = path.join(
  process.cwd(),
  "src",
  "content",
  "compiled",
  "sites",
  SITE_KEY
);

async function main() {
  console.log("[REGENERATE] Starting full Gibson website re-scan...");
  console.log(`[REGENERATE] Site URL: ${SITE_URL}`);
  console.log(`[REGENERATE] This may take a few minutes...\n`);

  // Step 1: Scan website to get V2 pages structure
  console.log("[REGENERATE] Phase 1: Scanning website for PDP pages...");
  const siteSnapshot = await scanWebsite(SITE_URL);
  
  // Save updated snapshot
  const snapshotPath = path.join(OUTPUT_DIR, "site.snapshot.json");
  fs.writeFileSync(snapshotPath, JSON.stringify(siteSnapshot, null, 2), "utf-8");
  console.log(`[REGENERATE] ✓ Snapshot saved to ${snapshotPath}`);

  // Step 2: Extract products from V2 pages
  console.log("\n[REGENERATE] Phase 2: Extracting products from PDP pages...");
  const productGraph = await normalizeToProductGraph(siteSnapshot);

  console.log(`[REGENERATE] Extracted ${productGraph.products.length} products`);
  console.log(`[REGENERATE] Categories: ${productGraph.categories.join(", ")}`);
  console.log(`[REGENERATE] Brands: ${productGraph.brands.join(", ")}`);

  if (productGraph.products.length === 0) {
    console.error("[REGENERATE] ERROR: No products extracted!");
    console.error("[REGENERATE] Check scan output for PDP detection issues");
    process.exit(1);
  }

  // Step 3: Write product graph
  const graphPath = path.join(OUTPUT_DIR, "product.graph.json");
  fs.writeFileSync(graphPath, JSON.stringify(productGraph, null, 2), "utf-8");
  console.log(`[REGENERATE] ✓ Product graph written to ${graphPath}`);

  // Step 4: Show summary
  console.log("\n[REGENERATE] Product Summary:");
  console.log(`  Total Products: ${productGraph.products.length}`);
  console.log(`  Categories: ${productGraph.categories.length}`);
  console.log(`  Brands: ${productGraph.brands.join(", ")}`);
  
  console.log("\n[REGENERATE] Sample products:");
  productGraph.products.slice(0, 10).forEach((product: any, index: number) => {
    const imageCount = product.images?.length || 0;
    const category = product.category || "uncategorized";
    console.log(`  ${index + 1}. ${product.name} (${category}) - ${imageCount} images`);
  });

  console.log("\n[REGENERATE] ✓ Complete! Product dataset restored.");
}

main().catch((error) => {
  console.error("[REGENERATE] Fatal error:", error);
  process.exit(1);
});
