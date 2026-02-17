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
const APPS_JSON_BASE = path.join(REPO_ROOT, "src", "01_App", "apps-json");
const APPS_TSX_BASE = path.join(REPO_ROOT, "src", "01_App", "apps-tsx");


/* ======================================================
   TSX DISCOVERY — ALL TOP-LEVEL FOLDERS (no whitelist/filter)
   Level 1 = category (every directory under apps-tsx)
   Level 2 = direct .tsx files in category OR subfolders
   Level 3 = .tsx files inside selected subfolder
   No hardcoded folder names; one failing dir does not hide others.
====================================================== */
function collectTsxScreens(): Array<{
  category: string;
  directFiles: string[];
  folders: Record<string, string[]>;
}> {
  if (!fs.existsSync(APPS_TSX_BASE)) return [];

  const topLevelDirs = fs
    .readdirSync(APPS_TSX_BASE, { withFileTypes: true })
    .filter((d): d is fs.Dirent => d.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  return topLevelDirs.map(group => {
    const groupPath = path.join(APPS_TSX_BASE, group.name);
    let directFiles: string[] = [];
    let folders: Record<string, string[]> = {};

    try {
      const entries = fs.readdirSync(groupPath, { withFileTypes: true });

      directFiles = entries
        .filter(
          f =>
            f.isFile() &&
            f.name.endsWith(".tsx") &&
            !f.name.endsWith(".d.ts") &&
            !f.name.startsWith("_template")
        )
        .map(f => f.name.replace(/\.tsx$/, ""));

      const subdirs = entries.filter((d): d is fs.Dirent => d.isDirectory());
      for (const app of subdirs) {
        const appPath = path.join(groupPath, app.name);
        try {
          const fileEntries = fs.readdirSync(appPath, { withFileTypes: true });
          const files = fileEntries
            .filter(
              f =>
                f.isFile() &&
                f.name.endsWith(".tsx") &&
                !f.name.endsWith(".d.ts") &&
                !f.name.startsWith("_template")
            )
            .map(f => f.name.replace(/\.tsx$/, ""));
          if (files.length > 0) folders[app.name] = files;
        } catch {
          /* skip this subfolder so one bad dir does not break the category */
        }
      }
    } catch (_err) {
      /* Include category with empty children so Navigator still lists this folder */
    }

    return {
      category: group.name,
      directFiles,
      folders,
    };
  });
}


/**
 * GET /api/screens
 * Lists:
 * category → folder → *.json
 * category → folder → *.tsx
 */
export async function GET() {
  try {
    console.log("[api/screens] ROOT =", REPO_ROOT);
    console.log("[api/screens] JSON BASE =", APPS_JSON_BASE, fs.existsSync(APPS_JSON_BASE));
    console.log("[api/screens] TSX BASE =", APPS_TSX_BASE, fs.existsSync(APPS_TSX_BASE));

    if (!fs.existsSync(APPS_JSON_BASE)) {
      console.error("[api/screens] ❌ BASE folder does not exist", { APPS_JSON_BASE });
      // Return empty array instead of crashing
      return NextResponse.json([]);
    }

    /* ---------------- JSON (FIXED PATH, RECURSIVE) ---------------- */
    const collectJsonFolders = (categoryPath: string): Record<string, string[]> => {
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
          const key = prefix || ".";
          result[key] = files;
        }
      };

      walk(categoryPath, "");
      return result;
    };

    const jsonCategories = fs
      .readdirSync(APPS_JSON_BASE, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(category => {
        const categoryPath = path.join(APPS_JSON_BASE, category.name);

        console.log("[api/screens] 📂 Processing category", {
          category: category.name,
          categoryPath,
          exists: fs.existsSync(categoryPath),
        });

        const folders = collectJsonFolders(categoryPath);

        return { category: category.name, folders };
      });


    /* ---------------- TSX (ADDITIVE) ---------------- */
    const tsxCategories = collectTsxScreens();

    const result = [
      ...jsonCategories.map(c => ({ ...c, directFiles: (c as any).directFiles ?? [] })),
      ...tsxCategories.map(c => ({
        category: `tsx:${c.category}`,
        directFiles: c.directFiles,
        folders: c.folders,
      })),
    ];

    console.log("[api/screens] ✅ Success", {
      jsonCategoriesCount: jsonCategories.length,
      tsxCategoriesCount: tsxCategories.length,
      totalCategories: result.length,
    });

    return NextResponse.json(result);
  } catch (e: any) {
    console.error("[api/screens] ❌ Error in GET handler", {
      error: e.message,
      stack: e.stack,
      APPS_JSON_BASE,
      APPS_TSX_BASE,
    });
    return NextResponse.json(
      { error: e.message, path: APPS_JSON_BASE },
      { status: 500 }
    );
  }
}


