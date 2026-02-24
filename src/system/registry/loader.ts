import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";


async function walk(dir: string, exts = new Set([".ts", ".tsx"])): Promise<string[]> {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      // skip build artifacts
      if (e.name === "node_modules" || e.name === "dist" || e.name === ".next") continue;
      out.push(...(await walk(full, exts)));
    } else if (e.isFile()) {
      const ext = path.extname(e.name);
      if (!exts.has(ext)) continue;
      // ignore d.ts
      if (e.name.endsWith(".d.ts")) continue;
      out.push(full);
    }
  }
  return out;
}


function looksLikeIndexFile(p: string) {
  const base = path.basename(p).toLowerCase();
  return base === "index.ts" || base === "index.tsx";
}


export async function loadRegistrations(opts: {
  repoRoot: string;
  engineDir: string;
  templateDirs: string[];
}) {
  const engines = await walk(path.join(opts.repoRoot, opts.engineDir));
  for (const f of engines) {
    if (looksLikeIndexFile(f)) continue;
    try {
      await import(pathToFileURL(f).toString());
    } catch (_e) {
      // Skip files that fail in Node (e.g. browser-only or require.context)
    }
  }

  for (const relDir of opts.templateDirs) {
    const files = await walk(path.join(opts.repoRoot, relDir), new Set([".ts", ".tsx"]));
    for (const f of files) {
      if (looksLikeIndexFile(f)) continue;
      try {
        await import(pathToFileURL(f).toString());
      } catch (_e) {
        // Skip files that fail in Node (e.g. React/Webpack-only)
      }
    }
  }
}
