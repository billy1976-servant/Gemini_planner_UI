/**
 * Web2Extractor V2 — entry script.
 * Prompts for domain, normalizes URL, crawls, extracts, normalizes, writes web2-results.json.
 * Separates universal fields from discovered attributes; dedupes variants. Attribute groups are generated later by pattern analysis.
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { normalizeSiteUrl, discoverProductUrls } from "./crawler";
import { extractProduct } from "./extractor";
import { normalizeProduct } from "./normalizer";
import type { NormalizedProduct, ProductCatalogEntry, ProductCatalog, CatalogAttributes } from "./types";

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/** Parse price string to number; null if missing or invalid. */
function priceToNumber(price: string | null | undefined): number | null {
  if (price == null || price === "") return null;
  const cleaned = String(price).replace(/[$,\s]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Canonical product name for variant grouping: strip pack size / variant suffix. */
function canonicalName(name: string): string {
  return name
    .replace(/\s*\(?\d+\s*[-]?(?:pack|pk|pc|piece|unit)s?\)?/gi, "")
    .replace(/\s*-\s*\d+\s*pack\s*$/gi, "")
    .replace(/\s*\(\d+[\s-]?pack\)\s*$/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .toLowerCase();
}

/** Deduplicate variants: group by canonical name + brand, keep one canonical entry with variants[]. */
function deduplicateVariants(products: NormalizedProduct[]): ProductCatalogEntry[] {
  const byCanonical = new Map<string, NormalizedProduct[]>();
  for (const p of products) {
    const key = `${canonicalName(p.universal.name)}|${(p.attributes.brand ?? "").toLowerCase()}`;
    if (!byCanonical.has(key)) byCanonical.set(key, []);
    byCanonical.get(key)!.push(p);
  }
  const entries: ProductCatalogEntry[] = [];
  for (const group of byCanonical.values()) {
    const canonical = group[0];
    const hasVariants = group.length > 1;
    const attrs = canonical.attributes;
    const catalogAttrs: CatalogAttributes = {
      sku: attrs.sku,
      brand: attrs.brand,
      availability: attrs.availability,
      features: attrs.features,
      specs: attrs.specs,
    };
    const entry: ProductCatalogEntry = {
      name: canonical.universal.name,
      url: canonical.universal.url,
      price: priceToNumber(canonical.universal.price),
      description: canonical.universal.description,
      images: canonical.universal.images,
    };
    if (attrs.content != null && attrs.content !== "") entry.rawContent = attrs.content;
    if (
      catalogAttrs.sku != null ||
      catalogAttrs.brand != null ||
      catalogAttrs.availability != null ||
      catalogAttrs.features.length > 0 ||
      Object.keys(catalogAttrs.specs).length > 0
    ) {
      entry.attributes = catalogAttrs;
    }
    if (hasVariants) {
      entry.variants = group.slice(1).map((p) => ({
        url: p.universal.url,
        price: priceToNumber(p.universal.price),
        sku: p.attributes.sku ?? undefined,
      }));
    }
    entries.push(entry);
  }
  return entries;
}

async function main(): Promise<void> {
  let siteInput: string;

  if (process.argv[2]) {
    siteInput = process.argv[2];
    console.log("Using domain from argument:", siteInput);
  } else {
    siteInput = await prompt("Enter website domain: ");
  }

  const siteUrl = normalizeSiteUrl(siteInput);
  if (!siteUrl) {
    console.error("Invalid domain. Example: containercreations.com");
    process.exit(1);
  }

  const domainSlug = (() => {
    try {
      return new URL(siteUrl).hostname.replace(/^www\./, "");
    } catch {
      return "website";
    }
  })();
  const outDir = path.join(process.cwd(), "src", "web2extractor", domainSlug);
  const outPath = path.join(outDir, "web2-results.json");

  console.log("Normalized URL:", siteUrl);
  console.log("Output:", outPath);
  console.log("");

  const productUrls = await discoverProductUrls(siteUrl);
  if (productUrls.length === 0) {
    console.log("No product URLs found. Writing empty web2-results.json");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify({ products: [] }, null, 2), "utf-8");
    console.log("Wrote", outPath);
    return;
  }

  const results: NormalizedProduct[] = [];
  for (let i = 0; i < productUrls.length; i++) {
    const url = productUrls[i];
    process.stdout.write(`[${i + 1}/${productUrls.length}] ${url.slice(0, 60)}... `);
    try {
      const raw = await extractProduct(url);
      const normalized = normalizeProduct(raw);
      results.push(normalized);
      console.log(normalized.universal.name || "(no name)");
    } catch (err) {
      console.log("FAILED:", (err as Error).message);
    }
  }

  const products = deduplicateVariants(results);
  const catalog: ProductCatalog = { products };

  const outPath = path.join(process.cwd(), "web2-results.json");
  fs.writeFileSync(outPath, JSON.stringify(catalog, null, 2), "utf-8");
  console.log("");
  console.log("Wrote", catalog.products.length, "product entries to", outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
