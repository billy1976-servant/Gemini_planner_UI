import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";


/* ======================================================
   JSON SCREENS (FIXED PATH)
   Actual location: src/01_App/apps-json
====================================================== */
const BASE = path.join(process.cwd(), "src", "01_App", "apps-json");


/* ======================================================
   TSX SCREENS (FIXED PATH)
   Actual location: src/01_App/apps-tsx
   Matches EXACTLY:
   src/01_App/apps-tsx/<group>/<app>/<file>.tsx
====================================================== */
const TSX_BASE = path.join(
  process.cwd(),
  "src",
  "01_App",
  "apps-tsx"
);


/* ======================================================
   TSX DISCOVERY — FLEXIBLE 2-LEVEL OR 3-LEVEL
   Level 1 = category (folder under apps-tsx)
   Level 2 = direct .tsx files in category OR subfolders
   Level 3 = .tsx files inside selected subfolder
====================================================== */
function collectTsxScreens(): Array<{
  category: string;
  directFiles: string[];
  folders: Record<string, string[]>;
}> {
  if (!fs.existsSync(TSX_BASE)) return [];

  return fs
    .readdirSync(TSX_BASE, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(group => {
      const groupPath = path.join(TSX_BASE, group.name);
      const entries = fs.readdirSync(groupPath, { withFileTypes: true });

      const directFiles = entries
        .filter(
          f =>
            f.isFile() &&
            f.name.endsWith(".tsx") &&
            !f.name.endsWith(".d.ts") &&
            !f.name.startsWith("_template")
        )
        .map(f => f.name.replace(/\.tsx$/, ""));

      const folders = entries
        .filter(d => d.isDirectory())
        .reduce<Record<string, string[]>>((acc, app) => {
          const appPath = path.join(groupPath, app.name);
          const files = fs
            .readdirSync(appPath, { withFileTypes: true })
            .filter(
              f =>
                f.isFile() &&
                f.name.endsWith(".tsx") &&
                !f.name.endsWith(".d.ts") &&
                !f.name.startsWith("_template")
            )
            .map(f => f.name.replace(/\.tsx$/, ""));
          if (files.length) acc[app.name] = files;
          return acc;
        }, {});

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
    // 🔑 LOG: Check if BASE folder exists
    console.log("[api/screens] 📍 Checking BASE path", {
      BASE,
      exists: fs.existsSync(BASE),
      cwd: process.cwd(),
    });

    if (!fs.existsSync(BASE)) {
      console.error("[api/screens] ❌ BASE folder does not exist", { BASE });
      // Return empty array instead of crashing
      return NextResponse.json([]);
    }

    /* ---------------- JSON (FIXED PATH) ---------------- */
    const jsonCategories = fs
      .readdirSync(BASE, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(category => {
        const categoryPath = path.join(BASE, category.name);

        console.log("[api/screens] 📂 Processing category", {
          category: category.name,
          categoryPath,
          exists: fs.existsSync(categoryPath),
        });

        const folders = fs
          .readdirSync(categoryPath, { withFileTypes: true })
          .filter(d => d.isDirectory())
          .reduce<Record<string, string[]>>((acc, folder) => {
            const folderPath = path.join(categoryPath, folder.name);

            const files = fs
              .readdirSync(folderPath, { withFileTypes: true })
              .filter(f => f.isFile() && f.name.endsWith(".json"))
              .map(f => f.name);

            if (files.length) acc[folder.name] = files;
            return acc;
          }, {});

        return { category: category.name, folders };
      });

    // 🔑 LOG: Check if TSX_BASE folder exists
    console.log("[api/screens] 📍 Checking TSX_BASE path", {
      TSX_BASE,
      exists: fs.existsSync(TSX_BASE),
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
      BASE,
      TSX_BASE,
    });
    return NextResponse.json(
      { error: e.message, path: BASE },
      { status: 500 }
    );
  }
}


