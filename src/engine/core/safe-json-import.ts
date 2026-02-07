/**
 * Safe JSON screen import — NEVER THROWS.
 * Loads screen JSON by path; returns ok/json or ok:false with error message.
 * Uses fetch in browser (no static imports). Uses fs in Node (tests).
 */

const SCREEN_BASE = "/api/screens";

function withJsonSuffix(p: string): string {
  return /\.json$/i.test(p) ? p : `${p}.json`;
}

function normalizeError(err: unknown): string {
  if (err == null) return "Unknown error";
  if (typeof err === "string") return err;
  if (err instanceof Error) {
    const msg = err.message || "Error";
    // Normalize common Next/build errors into readable strings
    if (msg.includes("Cannot find module") || msg.includes("Module not found"))
      return `Module not found: ${msg.replace(/.*Cannot find module[^\']*\'?([^\']+)\'.*/, "$1").trim() || msg}`;
    if (msg.includes("ENOENT")) return `File not found: ${msg}`;
    if (msg.includes("Unexpected token") || msg.includes("JSON")) return `Invalid JSON: ${msg}`;
    return msg;
  }
  try {
    return String(err);
  } catch {
    return "Unknown error";
  }
}

/**
 * Load JSON screen from path (relative to apps-json/apps, with or without .json).
 * Uses fetch to /api/screens/{path} only (no Node/fs) so the client bundle never pulls in "fs".
 * For Node-only tests, use the loader in contracts/load-app-offline-json.node.ts.
 */
export async function safeImportJson(
  path: string
): Promise<{ ok: true; json: any } | { ok: false; error: string }> {
  const pathWithJson = withJsonSuffix(path.replace(/^\/+/, ""));
  const normalized = pathWithJson
    .replace(/^src\//, "")
    .replace(/^apps-json\/apps\//, "")
    .replace(/^apps-json\//, "")
    .replace(/^apps\//, "");

  try {
    const url = `${SCREEN_BASE}/${normalized}?t=${Date.now()}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache, no-store", Pragma: "no-cache" },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const detail = text.length > 200 ? text.slice(0, 200) + "…" : text;
      return {
        ok: false,
        error: `HTTP ${res.status}: ${res.statusText}${detail ? ` — ${detail}` : ""}`,
      };
    }
    const json = await res.json();
    return { ok: true, json };
  } catch (e) {
    return { ok: false, error: normalizeError(e) };
  }
}
