/**
 * Persist pipeline contract result to a JSON file (Node only).
 * Used by E2E to save forensic artifacts. No-op in browser.
 */

import type { LayoutContractResult } from "./pipelineContractTester";

function isNode(): boolean {
  return typeof process !== "undefined" && typeof process.cwd === "function";
}

/**
 * Write contract result to ./artifacts/pipeline-contract/<YYYY-MM-DD_HH-mm-ss>_<screenKey>.json
 * Node-only (uses fs/path). No-op in browser.
 */
export function persistContractArtifact(result: LayoutContractResult | { type: string; [key: string]: unknown }): string | null {
  if (!isNode()) return null;
  try {
    const fs = require("fs") as typeof import("fs");
    const path = require("path") as typeof import("path");
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 8).replace(/:/g, "-");
    
    // Handle both LayoutContractResult and live capture format
    let screenKey: string;
    let filename: string;
    if ("type" in result && result.type === "live-layout-session") {
      screenKey = ((result as any).screenKey ?? "unknown").replace(/[^a-zA-Z0-9-_]/g, "_");
      filename = `${date}_${time}_layout-session_${screenKey}.json`;
    } else {
      screenKey = ((result as LayoutContractResult).debugDump?.screenKey ?? "unknown").replace(/[^a-zA-Z0-9-_]/g, "_");
      filename = `${date}_${time}_${screenKey}.json`;
    }
    
    const dir = path.join(process.cwd(), "artifacts", "pipeline-contract");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filepath = path.join(dir, filename);
    const payload = JSON.stringify(result, null, 2);
    fs.writeFileSync(filepath, payload, "utf8");
    return filepath;
  } catch {
    return null;
  }
}
