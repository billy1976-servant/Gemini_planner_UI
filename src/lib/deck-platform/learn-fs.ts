/**
 * Server-only: filesystem discovery under `src/01_App`. Do not import from Client Components.
 */
import fs from "fs";
import path from "path";
import { normalizeDeckAppKey } from "./legacy-app-keys";
import { getO1AppBaseAbs } from "./registry";

/**
 * Absolute path to `.../<brand>/learn` for an `appKey`, discovered by walking `src/01_App`
 * (same brand rules as {@link loadCatalog}: brand folder basename is `[a-z0-9]+` and contains `learn/`).
 */
export function findLearnDirAbsForAppKey(appKey: string): string | null {
  const normalized = normalizeDeckAppKey(appKey.trim());
  if (!normalized) return null;
  const o1 = getO1AppBaseAbs();
  if (!fs.existsSync(o1)) return null;

  const matches: string[] = [];

  function walk(dir: string) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const full = path.join(dir, e.name);
      const learnChild = path.join(full, "learn");
      try {
        if (
          e.name !== "learn" &&
          fs.existsSync(learnChild) &&
          fs.statSync(learnChild).isDirectory()
        ) {
          const brandRaw = e.name;
          if (/^[a-z0-9]+$/.test(brandRaw) && normalizeDeckAppKey(brandRaw) === normalized) {
            matches.push(learnChild);
          }
        }
      } catch {
        /* skip */
      }
      walk(full);
    }
  }

  walk(o1);
  return matches[0] ?? null;
}
