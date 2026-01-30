#!/usr/bin/env ts-node
/**
 * Compile product graph to offline screen JSON.
 *
 * Reads product.graph.json (compiled or raw), runs the product-screen adapter,
 * optionally validates with blueprint contract, and writes to
 * src/apps-offline/apps/websites/<site>/products.json so /api/screens serves it.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/scripts/compile-product-screen.ts <domain>
 *   e.g. compile-product-screen.ts bendsoap-com
 */
import fs from "fs";
import path from "path";
import { compileProductDataToScreen } from "@/lib/product-screen-adapter";
import { warnBlueprintViolations } from "@/contracts/blueprint-universe.validator";

const COMPILED_SITES = path.join(process.cwd(), "content", "compiled", "sites");
const RAW_SITES = path.join(process.cwd(), "src", "content", "sites", "raw");
const APPS_WEBSITES = path.join(process.cwd(), "src", "apps-offline", "apps", "websites");

function loadProductGraph(domain: string): { products: unknown[] } | null {
  const compiledPath = path.join(COMPILED_SITES, domain, "product.graph.json");
  const rawPath = path.join(RAW_SITES, domain, "product.graph.json");

  for (const p of [compiledPath, rawPath]) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, "utf8");
        const json = JSON.parse(raw);
        if (json && Array.isArray(json.products)) return json;
        return null;
      } catch (e: unknown) {
        console.warn(`[compile-product-screen] Failed to read ${p}:`, (e as Error)?.message ?? e);
      }
    }
  }
  return null;
}

function main() {
  const domain = process.argv[2];
  if (!domain) {
    console.error("Usage: compile-product-screen.ts <domain>");
    console.error("Example: compile-product-screen.ts bendsoap-com");
    process.exit(1);
  }

  const graph = loadProductGraph(domain);
  if (!graph || !graph.products?.length) {
    console.error(`[compile-product-screen] No product graph found for domain: ${domain}`);
    process.exit(1);
  }

  const screen = compileProductDataToScreen(graph, {
    sectionTitle: "Products",
    currentView: "|products",
    layout: "grid",
    maxProducts: 100,
  });

  const outDir = path.join(APPS_WEBSITES, domain);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outPath = path.join(outDir, "products.json");
  fs.writeFileSync(outPath, JSON.stringify(screen, null, 2), "utf8");
  console.log(`[compile-product-screen] Wrote ${outPath}`);

  try {
    warnBlueprintViolations(screen, {
      source: "product-screen-adapter",
      dedupeKeyPrefix: `product-screen:${domain}`,
      maxWarnings: 200,
    });
  } catch (e) {
    console.warn("[compile-product-screen] Contract validation failed:", (e as Error)?.message ?? e);
  }
}

main();
