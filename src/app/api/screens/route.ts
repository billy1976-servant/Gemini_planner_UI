import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function findRepoRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, "src", "01_App"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

const REPO_ROOT = findRepoRoot(process.cwd());
const O1_APP_BASE = path.join(REPO_ROOT, "src", "01_App");

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

/**
 * GET /api/screens
 * Scans src/01_App/* — each directory is a root section.
 * Returns categories with rootSection = displayName = dir.name (no renaming, no tsx: prefix).
 */
export async function GET() {
  try {
    if (!fs.existsSync(O1_APP_BASE)) {
      return NextResponse.json([]);
    }

    const rootDirs = fs
      .readdirSync(O1_APP_BASE, { withFileTypes: true })
      .filter((d): d is fs.Dirent => d.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

    const result: ScreensIndexItem[] = [];

    for (const dir of rootDirs) {
      const rootPath = path.join(O1_APP_BASE, dir.name);
      const rootSection = dir.name;
      const displayName = dir.name;

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
    }

    return NextResponse.json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[api/screens] Error", message);
    return NextResponse.json(
      { error: message, path: O1_APP_BASE },
      { status: 500 }
    );
  }
}
