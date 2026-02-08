#!/usr/bin/env ts-node
/**
 * Website Compiler - CLI Runner
 *
 * Usage: npm run compile
 */

import { createInterface } from "node:readline/promises";
import { compileWebsite } from "./compile-website";

function normalizeWebsiteUrl(input: string): string {
  const trimmed = input.trim();

  if (!trimmed) {
    return trimmed;
  }

  // If the user already provided a protocol, use as-is
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Default to https for bare domains like "gibson.com"
  return `https://${trimmed}`;
}

async function main() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const websiteUrl = await rl.question("Enter website URL: ");

    if (!websiteUrl || !websiteUrl.trim()) {
      console.error("[COMPILE] Error: Website URL is required");
      process.exit(1);
    }

    const trimmedUrl = websiteUrl.trim();
    const normalizedUrl = normalizeWebsiteUrl(trimmedUrl);
    console.log("[COMPILE] Starting compilation for:", normalizedUrl);

    await compileWebsite(normalizedUrl);
    console.log("[COMPILE] Done");
  } catch (error: any) {
    console.error("[COMPILE] Error:", error?.message || error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("[COMPILE] Fatal error:", error);
    process.exit(1);
  });
}

