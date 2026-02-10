/**
 * POST /api/create-from-module
 * Copies from 08_Modules: vertical/master/blueprint.txt + vertical/<subtype>/content.txt
 * into apps-json/generated/<slug>/, then compiles so app.json exists before redirect.
 */

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MODULES_ROOT = path.join(process.cwd(), "src", "08_Modules");
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

    const masterBlueprintPath = path.join(MODULES_ROOT, vertical, "master", "blueprint.txt");
    if (!fs.existsSync(masterBlueprintPath)) {
      return NextResponse.json(
        { error: `Master blueprint not found: ${vertical}/master/blueprint.txt` },
        { status: 404 }
      );
    }

    const subtypeContentPath = path.join(MODULES_ROOT, vertical, subtype, "content.txt");
    if (!fs.existsSync(subtypeContentPath)) {
      return NextResponse.json(
        { error: `Subtype content not found: ${vertical}/${subtype}/content.txt` },
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

    const blueprintContent = fs.readFileSync(masterBlueprintPath, "utf8");
    const contentContent = fs.readFileSync(subtypeContentPath, "utf8");
    fs.writeFileSync(path.join(destDir, "blueprint.txt"), blueprintContent, "utf8");
    fs.writeFileSync(path.join(destDir, "content.txt"), contentContent, "utf8");

    const { compileApp } = await import(
      "../../../07_Dev_Tools/scripts/blueprint"
    );
    compileApp(destDir);

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
