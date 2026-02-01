#!/usr/bin/env ts-node
/**
 * Contract validation runner (documentation-only)
 *
 * Contracts are documentation only; no programmatic validation is run.
 * This script exits successfully for compatibility with existing scripts.
 */
const ROOT = "src/apps-offline";

function main() {
  console.log(`[contract:validate] Contracts are documentation only. No validation run.`);
  console.log(`[contract:validate] Scope: ${ROOT}`);
}

main();
