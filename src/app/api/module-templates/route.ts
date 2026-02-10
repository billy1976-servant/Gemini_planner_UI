/**
 * GET /api/module-templates
 * Discovers templates from 08_Modules/<vertical>/<subtype>/content.txt.
 * Blueprint source is vertical/master/blueprint.txt (same for all subtypes in that vertical).
 * Returns value: "vertical_subtype" for use by create-from-module.
 */

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MODULES_ROOT = path.join(process.cwd(), "src", "08_Modules");

const VERTICALS = ["contractors", "medical", "legal"] as const;

export type ModuleTemplateEntry = {
  value: string;
  label: string;
};

export async function GET() {
  try {
    const templates: ModuleTemplateEntry[] = [];

    if (!fs.existsSync(MODULES_ROOT)) {
      return NextResponse.json({ templates: [] });
    }

    for (const vertical of VERTICALS) {
      const verticalDir = path.join(MODULES_ROOT, vertical);
      if (!fs.existsSync(verticalDir) || !fs.statSync(verticalDir).isDirectory()) continue;

      const masterBlueprint = path.join(verticalDir, "master", "blueprint.txt");
      if (!fs.existsSync(masterBlueprint)) continue;

      const entries = fs.readdirSync(verticalDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name === "master") continue;
        const subtype = entry.name;
        const contentPath = path.join(verticalDir, subtype, "content.txt");
        if (!fs.existsSync(contentPath) || !fs.statSync(contentPath).isFile()) continue;

        const value = `${vertical}_${subtype}`;
        const label = `${vertical} / ${subtype.replace(/-/g, " ")}`;
        templates.push({ value, label });
      }
    }

    return NextResponse.json({ templates });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message, templates: [] },
      { status: 500 }
    );
  }
}
