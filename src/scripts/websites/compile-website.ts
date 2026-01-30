/**
 * PRODUCT PIPELINE COMPILER (SIMPLIFIED)
 *
 * GOAL:
 * Scan site → Extract products → Normalize → Output clean product dataset
 * NO page rebuilding. NO category page generation. NO fake site structure.
 */


import * as fs from "fs";
import * as path from "path";
import { scanWebsite } from "./adapters/scan-adapter";
import { normalizeToProductGraph } from "./adapters/normalize-adapter";
import { attachResearch } from "./adapters/research-adapter";
import { runValueTranslation } from "./adapters/value-translation-adapter";


export function generateSiteKey(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
}


export async function compileWebsite(siteUrl: string): Promise<void> {
  const siteKey = generateSiteKey(siteUrl);


  const baseDir = path.join(process.cwd(), "src", "content", "sites", siteKey);
  const rawDir = path.join(baseDir, "raw");
  const normalizedDir = path.join(baseDir, "normalized");


  fs.mkdirSync(rawDir, { recursive: true });
  fs.mkdirSync(normalizedDir, { recursive: true });


  console.log(`\n🔍 SCANNING SITE: ${siteUrl}`);


  // PHASE 1 — SCAN
  const siteSnapshot = await scanWebsite(siteUrl);
  fs.writeFileSync(path.join(rawDir, "site.snapshot.json"), JSON.stringify(siteSnapshot, null, 2));


  console.log(`📄 Pages scanned: ${siteSnapshot.rawData?.v2?.pages?.length || 0}`);


  // PHASE 2 — PRODUCT GRAPH
  const productGraph = await normalizeToProductGraph(siteSnapshot);
  fs.writeFileSync(path.join(rawDir, "product.graph.json"), JSON.stringify(productGraph, null, 2));


  console.log(`🛒 Products extracted: ${productGraph.products?.length || 0}`);


  // PHASE 3 — RESEARCH (optional but useful)
  const researchBundle = await attachResearch(productGraph);
  fs.writeFileSync(path.join(normalizedDir, "research.bundle.json"), JSON.stringify(researchBundle, null, 2));


  // PHASE 4 — VALUE MODEL
  const valueModel = await runValueTranslation(productGraph, researchBundle);
  fs.writeFileSync(path.join(normalizedDir, "value.model.json"), JSON.stringify(valueModel, null, 2));


  // FINAL OUTPUT (PRODUCT MASTER FILE)
  const finalProductsPath = path.join(normalizedDir, "products.final.json");
  fs.writeFileSync(finalProductsPath, JSON.stringify(productGraph.products || [], null, 2));


  console.log(`\n✅ PRODUCT PIPELINE COMPLETE`);
  console.log(`📦 Final product file: ${finalProductsPath}`);
  console.log(`🧾 Total products: ${productGraph.products?.length || 0}`);
  console.log(`=====================================================\n`);
}


