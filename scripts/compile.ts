#!/usr/bin/env ts-node
/**
 * Website Compiler - CLI Runner
 * 
 * Usage: npm run compile
 */

import { createInterface } from "node:readline/promises";
import { compileWebsite } from "./compile/compile-website";

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
    console.log("[COMPILE] Starting compilation for:", trimmedUrl);

    await compileWebsite(trimmedUrl);
    console.log("[COMPILE] Done");
  } catch (error: any) {
    console.error("[COMPILE] Error:", error.message);
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
