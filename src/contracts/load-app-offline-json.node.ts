/**
 * Node-only loader for apps-json JSON. Used by contract tests (ts-node).
 * Do not import from client code — use safeImportJson from engine/core in the browser.
 */

import fs from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "src", "apps-json", "apps");

function withJson(p: string): string {
  return /\.json$/i.test(p) ? p : `${p}.json`;
}

export async function loadAppOfflineJson(
  relativePath: string
): Promise<{ ok: true; json: any } | { ok: false; error: string }> {
  try {
    const normalized = withJson(relativePath.replace(/^\/+/, ""));
    const fullPath = path.join(ROOT, path.normalize(normalized));
    if (!fs.existsSync(fullPath)) {
      return { ok: false, error: `File not found: ${normalized}` };
    }
    const raw = fs.readFileSync(fullPath, "utf8");
    const json = JSON.parse(raw);
    return { ok: true, json };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) };
  }
}
