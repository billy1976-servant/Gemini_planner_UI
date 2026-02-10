/**
 * POST /api/create-from-module
 * Copies a single blueprint from 08_Modules into apps/generated/<slug>/.
 * Writes blueprint.txt (from the selected subtype) and an empty content.txt.
 * Does NOT compile. Used when user selects a module template and clicks "Duplicate template & open".
 */

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MODULES_ROOT = path.join(process.cwd(), "src", "08_Modules");
/** Generated apps: src/01_App/apps-json/generated (not under apps/) */
const GENERATED_APPS_ROOT = path.join(process.cwd(), "src", "01_App", "apps-json", "generated");

type Body = {
  moduleTemplate: string;
  slug: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const moduleTemplate = (body.moduleTemplate || "").trim();
    const slug = (body.slug || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-|-$/g, "") || "my-interface";

    if (!moduleTemplate) {
      return NextResponse.json(
        { error: "moduleTemplate is required" },
        { status: 400 }
      );
    }

    const underscoreIdx = moduleTemplate.indexOf("_");
    if (underscoreIdx <= 0 || underscoreIdx === moduleTemplate.length - 1) {
      return NextResponse.json(
        { error: "moduleTemplate must be like vertical_subtype (e.g. contractors_painter)" },
        { status: 400 }
      );
    }

    const vertical = moduleTemplate.slice(0, underscoreIdx);
    const subtype = moduleTemplate.slice(underscoreIdx + 1);
    const blueprintFileName = `${subtype}.blueprint.txt`;
    const blueprintPath = path.join(MODULES_ROOT, vertical, blueprintFileName);

    if (!fs.existsSync(blueprintPath)) {
      return NextResponse.json(
        { error: `Blueprint not found: ${vertical}/${blueprintFileName}` },
        { status: 404 }
      );
    }

    const destDir = path.join(GENERATED_APPS_ROOT, slug);
    if (fs.existsSync(destDir)) {
      return NextResponse.json(
        { error: `Target folder already exists: generated/${slug}` },
        { status: 400 }
      );
    }

    fs.mkdirSync(destDir, { recursive: true });
    const blueprintContent = fs.readFileSync(blueprintPath, "utf8");
    fs.writeFileSync(path.join(destDir, "blueprint.txt"), blueprintContent, "utf8");
    fs.writeFileSync(path.join(destDir, "content.txt"), "", "utf8");

    return NextResponse.json({
      ok: true,
      appPath: `generated/${slug}`,
      slug,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
