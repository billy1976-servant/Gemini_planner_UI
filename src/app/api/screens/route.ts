import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";


/* ======================================================
   JSON SCREENS (UNCHANGED)
====================================================== */
const BASE = path.join(process.cwd(), "src", "apps-json");


/* ======================================================
   TSX SCREENS (CORRECT ROOT)
   Matches EXACTLY:
   src/apps-tsx/tsx-screens/<group>/<app>/<file>.tsx
====================================================== */
const TSX_BASE = path.join(
  process.cwd(),
  "src",
  "apps-tsx"
);


/* ======================================================
   TSX DISCOVERY — FINAL, CORRECT DEPTH
   category = <group>
   folder   = <app>
   file     = <file>.tsx
====================================================== */
function collectTsxScreens() {
  if (!fs.existsSync(TSX_BASE)) return [];


  return fs
    .readdirSync(TSX_BASE, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(group => {
      const groupPath = path.join(TSX_BASE, group.name);


      const folders = fs
        .readdirSync(groupPath, { withFileTypes: true })
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
                !f.name.startsWith("_template") // Exclude template files
            )
            .map(f => f.name.replace(/\.tsx$/, ""));


          if (files.length) acc[app.name] = files;
          return acc;
        }, {});


      return {
        category: group.name,
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
    /* ---------------- JSON (UNCHANGED) ---------------- */
    const jsonCategories = fs
      .readdirSync(BASE, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(category => {
        const categoryPath = path.join(BASE, category.name);


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


    /* ---------------- TSX (ADDITIVE) ---------------- */
    const tsxCategories = collectTsxScreens();


    return NextResponse.json([
      ...jsonCategories,
      ...tsxCategories.map(c => ({
        category: `tsx:${c.category}`,
        folders: c.folders,
      })),
    ]);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}


