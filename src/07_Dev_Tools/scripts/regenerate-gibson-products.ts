#!/usr/bin/env ts-node
/**
 * Regenerate Gibson Product Graph
 * 
 * Re-extracts products from existing site.snapshot.json and writes
 * updated product.graph.json with full product dataset.
 */

import * as fs from "fs";
import * as path from "path";
import { normalizeToProductGraph } from "./websites/adapters/normalize-adapter";

const SITE_KEY = "gibson-com";
const SNAPSHOT_PATH = path.join(
  process.cwd(),
  "src",
  "content",
  "compiled",
  "sites",
  SITE_KEY,
  "site.snapshot.json"
);

const OUTPUT_PATH = path.join(
  process.cwd(),
  "src",
  "content",
  "compiled",
  "sites",
  SITE_KEY,
  "product.graph.json"
);

async function main() {
  console.log("[REGENERATE] Loading site snapshot...");
  
  if (!fs.existsSync(SNAPSHOT_PATH)) {
    console.error(`[REGENERATE] ERROR: Snapshot file not found: ${SNAPSHOT_PATH}`);
    process.exit(1);
  }

  const snapshotContent = fs.readFileSync(SNAPSHOT_PATH, "utf-8");
  const siteSnapshot = JSON.parse(snapshotContent);

  console.log("[REGENERATE] Extracting products from snapshot...");
  console.log(`[REGENERATE] Snapshot URL: ${siteSnapshot.url || "N/A"}`);
  
  // Check if we have V2 pages structure
  if (siteSnapshot.rawData?.v2?.pages) {
    const pages = siteSnapshot.rawData.v2.pages;
    const pdpPages = pages.filter((p: any) => p.isPDP);
    console.log(`[REGENERATE] Found ${pages.length} total pages`);
    console.log(`[REGENERATE] Found ${pdpPages.length} PDP pages`);
  } else {
    console.warn("[REGENERATE] WARNING: No V2 pages structure found in snapshot");
    console.warn("[REGENERATE] Will attempt extraction from legacy structure");
  }

  // Extract product graph
  const productGraph = await normalizeToProductGraph(siteSnapshot);

  console.log(`[REGENERATE] Extracted ${productGraph.products.length} products`);
  console.log(`[REGENERATE] Categories: ${productGraph.categories.join(", ")}`);
  console.log(`[REGENERATE] Brands: ${productGraph.brands.join(", ")}`);

  if (productGraph.products.length === 0) {
    console.error("[REGENERATE] ERROR: No products extracted!");
    console.error("[REGENERATE] Check snapshot structure and PDP page detection");
    process.exit(1);
  }

  // Write product graph
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(productGraph, null, 2), "utf-8");
  console.log(`[REGENERATE] ✓ Product graph written to ${OUTPUT_PATH}`);

  // Show sample products
  console.log("\n[REGENERATE] Sample products:");
  productGraph.products.slice(0, 5).forEach((product: any, index: number) => {
    console.log(`  ${index + 1}. ${product.name} (${product.category}) - ${product.images?.length || 0} images`);
  });

  console.log("\n[REGENERATE] ✓ Complete!");
}

main().catch((error) => {
  console.error("[REGENERATE] Fatal error:", error);
  process.exit(1);
});
