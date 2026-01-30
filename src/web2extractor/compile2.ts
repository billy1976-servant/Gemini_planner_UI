/**
 * Web2Extractor V2 — entry script.
 * Prompts for domain, normalizes URL, crawls, extracts, normalizes, writes web2-results.json.
 * Fully standalone: no imports from old pipeline.
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { normalizeSiteUrl, discoverProductUrls } from "./crawler";
import { extractProduct } from "./extractor";
import { normalizeProduct } from "./normalizer";
import type { NormalizedProduct } from "./types";

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
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

  console.log("Normalized URL:", siteUrl);
  console.log("");

  const productUrls = await discoverProductUrls(siteUrl);
  if (productUrls.length === 0) {
    console.log("No product URLs found. Writing empty web2-results.json");
    const outPath = path.join(process.cwd(), "web2-results.json");
    fs.writeFileSync(outPath, "[]", "utf-8");
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
      console.log(normalized.name || "(no name)");
    } catch (err) {
      console.log("FAILED:", (err as Error).message);
    }
  }

  const outPath = path.join(process.cwd(), "web2-results.json");
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), "utf-8");
  console.log("");
  console.log("Wrote", results.length, "products to", outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
