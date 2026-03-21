import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/** Resolve 01_App in a way that is stable across dev (Cursor/Next) and build environments. */
function getO1AppBase(): string {
  const candidates: string[] = [];

  // 1) Prefer resolving relative to the compiled route location (works in dev + prod when bundled to .next/server).
  try {
    const fromCompiled = path.resolve(__dirname, "..", "..", "..", "..", "..", "src", "01_App");
    candidates.push(fromCompiled);
  } catch {
    // __dirname may not be available in some runtimes; ignore and fall back to cwd-based resolution.
  }

  // 2) Fallback: assume process.cwd() is the repo root (common in local dev when running `next dev` from project root).
  const fromCwd = path.resolve(process.cwd(), "src", "01_App");
  candidates.push(fromCwd);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // If nothing matched, keep behavior deterministic but log enough detail to debug.
  console.warn("[api/screens] Unable to resolve 01_App base", {
    cwd: process.cwd(),
    candidates,
  });
  return candidates[0] ?? fromCwd;
}

const O1_APP_BASE = getO1AppBase();
const REPO_ROOT = path.dirname(path.dirname(O1_APP_BASE));
const TSX_ORGANISMS_ROOT = path.join(REPO_ROOT, "src", "04_Presentation", "components", "organisms", "tsx-organisms");
const TSX_ORGANS_ROOT = path.join(REPO_ROOT, "src", "04_Presentation", "components", "organs", "tsx-organs");

// Temporary diagnostics to verify path resolution and Business root discovery in local dev.
const O1_APP_BASE_EXISTS = fs.existsSync(O1_APP_BASE);
console.log("[api/screens] init", {
  cwd: process.cwd(),
  O1_APP_BASE,
  O1_APP_BASE_EXISTS,
});

export type ScreensIndexItem = {
  category: string;
  directFiles: string[];
  folders: Record<string, string[]>;
  rootSection: string;
  displayName: string;
};

/* ======================================================
   JSON FOLDERS — recursive walk for .json files
====================================================== */
function collectJsonFolders(categoryPath: string): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  const walk = (dir: string, prefix: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".json")) {
        files.push(entry.name);
      } else if (entry.isDirectory()) {
        const nextDir = path.join(dir, entry.name);
        const nextPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
        walk(nextDir, nextPrefix);
      }
    }
    if (files.length) {
      result[prefix || "."] = files;
    }
  };
  walk(categoryPath, "");
  return result;
}

/* ======================================================
   TSX DISCOVERY — recursive .tsx under a root
   Category = top-level dir; folders = subdirs with .tsx
====================================================== */
function collectTsxUnderRoot(rootPath: string): ScreensIndexItem[] {
  if (!fs.existsSync(rootPath)) return [];

  const topLevelDirs = fs
    .readdirSync(rootPath, { withFileTypes: true })
    .filter((d): d is fs.Dirent => d.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  return topLevelDirs.map((group) => {
    const groupPath = path.join(rootPath, group.name);
    let directFiles: string[] = [];
    const folders: Record<string, string[]> = {};

    try {
      const entries = fs.readdirSync(groupPath, { withFileTypes: true });
      directFiles = entries
        .filter(
          (f) =>
            f.isFile() &&
            f.name.endsWith(".tsx") &&
            !f.name.endsWith(".d.ts") &&
            !f.name.startsWith("_template")
        )
        .map((f) => f.name.replace(/\.tsx$/, ""));

      const subdirs = entries.filter((d): d is fs.Dirent => d.isDirectory());
      for (const app of subdirs) {
        const appPath = path.join(groupPath, app.name);
        try {
          const fileEntries = fs.readdirSync(appPath, { withFileTypes: true });
          const files = fileEntries
            .filter(
              (f) =>
                f.isFile() &&
                f.name.endsWith(".tsx") &&
                !f.name.endsWith(".d.ts") &&
                !f.name.startsWith("_template")
            )
            .map((f) => f.name.replace(/\.tsx$/, ""));
          if (files.length > 0) folders[app.name] = files;
        } catch {
          /* skip */
        }
      }
    } catch {
      /* include category with empty children */
    }

    return {
      category: group.name,
      directFiles,
      folders,
      rootSection: path.basename(rootPath),
      displayName: path.basename(rootPath),
    };
  });
}

/* ======================================================
   GENERIC WALK — .json and .tsx under a root
   Top-level subdirs = categories; recursive folders.
====================================================== */
function collectGenericUnderRoot(rootPath: string, rootName: string): ScreensIndexItem[] {
  if (!fs.existsSync(rootPath)) return [];

  const topLevelDirs = fs
    .readdirSync(rootPath, { withFileTypes: true })
    .filter((d): d is fs.Dirent => d.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  return topLevelDirs.map((group) => {
    const groupPath = path.join(rootPath, group.name);
    const folders: Record<string, string[]> = {};
    const directFiles: string[] = [];

    const walk = (dir: string, prefix: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const files: string[] = [];
      for (const entry of entries) {
        if (
          entry.isFile() &&
          (entry.name.endsWith(".json") || entry.name.endsWith(".tsx"))
        ) {
          if (!entry.name.endsWith(".d.ts") && !entry.name.startsWith("_template")) {
            files.push(entry.name.replace(/\.(json|tsx)$/, ""));
          }
        } else if (entry.isDirectory()) {
          const nextDir = path.join(dir, entry.name);
          const nextPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
          walk(nextDir, nextPrefix);
        }
      }
      if (files.length) {
        folders[prefix || "."] = files;
      }
    };

    try {
      const entries = fs.readdirSync(groupPath, { withFileTypes: true });
      for (const e of entries) {
        if (e.isFile() && (e.name.endsWith(".json") || e.name.endsWith(".tsx"))) {
          if (!e.name.endsWith(".d.ts") && !e.name.startsWith("_template")) {
            directFiles.push(e.name.replace(/\.(json|tsx)$/, ""));
          }
        } else if (e.isDirectory()) {
          walk(path.join(groupPath, e.name), e.name);
        }
      }
    } catch {
      /* include with empty children */
    }

    return {
      category: group.name,
      directFiles,
      folders,
      rootSection: rootName,
      displayName: rootName,
    };
  });
}

function collectTsxDirectFiles(rootPath: string, rootName: string, categoryName: string): ScreensIndexItem | null {
  if (!fs.existsSync(rootPath)) return null;
  const entries = fs.readdirSync(rootPath, { withFileTypes: true });
  const directFiles = entries
    .filter(
      (f) =>
        f.isFile() &&
        f.name.endsWith(".tsx") &&
        !f.name.endsWith(".d.ts") &&
        !f.name.startsWith("_template")
    )
    .map((f) => f.name.replace(/\.tsx$/, ""));
  if (directFiles.length === 0) return null;
  return {
    category: categoryName,
    directFiles,
    folders: {},
    rootSection: rootName,
    displayName: rootName,
  };
}

/**
 * GET /api/screens
 * Scans src/01_App/* — each directory is a root section.
 * Returns categories with rootSection = displayName = dir.name (no renaming, no tsx: prefix).
 */
/** When filesystem scan yields nothing (misconfigured cwd in serverless, etc.), return empty index — same shape as success. */
function getDefensiveFallbackList(): ScreensIndexItem[] {
  return [];
}

export async function GET() {
  const safeFallback = (): Response =>
    NextResponse.json([], {
      status: 200,
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    });

  try {
    let sawBusinessRoot = false;
    if (!fs.existsSync(O1_APP_BASE)) {
      console.warn("[api/screens] O1_APP_BASE not found, returning fallback list only", O1_APP_BASE);
      return safeFallback();
    }

    const rootDirs = fs
      .readdirSync(O1_APP_BASE, { withFileTypes: true })
      .filter((d): d is fs.Dirent => d.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

    const result: ScreensIndexItem[] = [];

    for (const dir of rootDirs) {
      try {
        const rootPath = path.join(O1_APP_BASE, dir.name);
        const rootSection = dir.name;
        const displayName = dir.name;

        if (dir.name === "Business") {
          sawBusinessRoot = true;
        }

        if (dir.name === "(dead) Json") {
          const categories = fs
            .readdirSync(rootPath, { withFileTypes: true })
            .filter((d): d is fs.Dirent => d.isDirectory())
            .map((category) => ({
              category: category.name,
              directFiles: [] as string[],
              folders: collectJsonFolders(path.join(rootPath, category.name)),
              rootSection,
              displayName,
            }));
          result.push(...categories);
        } else if (dir.name === "(dead) Tsx") {
          result.push(...collectTsxUnderRoot(rootPath));
        } else {
          result.push(...collectGenericUnderRoot(rootPath, rootSection));
        }
      } catch (perDirErr) {
        const msg = perDirErr instanceof Error ? perDirErr.message : String(perDirErr);
        console.warn("[api/screens] Skipping root dir", dir.name, msg);
      }
    }

    console.log("[api/screens] scan summary", {
      O1_APP_BASE,
      sawBusinessRoot,
      rootSections: rootDirs.map((d) => d.name),
      businessIndexCount: result.filter((x) => x.rootSection === "Business").length,
    });

    const organismsItem = collectTsxDirectFiles(TSX_ORGANISMS_ROOT, "tsx-organisms", "organisms");
    if (organismsItem) result.push(organismsItem);
    const organsItem = collectTsxDirectFiles(TSX_ORGANS_ROOT, "tsx-organs", "organs");
    if (organsItem) result.push(organsItem);

    if (result.length === 0) {
      console.warn("[api/screens] Scan returned no sections, using fallback list");
      return NextResponse.json(getDefensiveFallbackList(), {
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      });
    }

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[api/screens] Error", message);
    return safeFallback();
  }
}
