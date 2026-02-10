/**
 * GET /api/module-templates
 * Returns blueprint options from src/08_Modules (contractors, medical, legal).
 * Only lists *.blueprint.txt files; ignores _master.blueprint.txt.
 * Used by the Template app dropdown in CreateNewInterfacePanel.
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
      const dir = path.join(MODULES_ROOT, vertical);
      if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;

      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (!file.endsWith(".blueprint.txt")) continue;
        if (file.startsWith("_master")) continue;

        const base = file.replace(/\.blueprint\.txt$/, "");
        const value = `${vertical}_${base}`;
        const label = `${vertical} / ${base.replace(/-/g, " ")}`;
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
