/**
 * GET /api/app-templates
 * Returns every folder under apps-json/apps that contains blueprint.txt.
 * Used by CreateNewInterfacePanel to populate the app template dropdown.
 */

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const APPS_ROOT = path.join(process.cwd(), "src", "01_App", "apps-json", "apps");

export type AppTemplateEntry = {
  value: string;
  label: string;
};

function collectTemplates(dir: string, prefix: string): AppTemplateEntry[] {
  const result: AppTemplateEntry[] = [];
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return result;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    const fullPath = path.join(dir, name);
    const relPath = prefix ? `${prefix}/${name}` : name;
    const blueprintPath = path.join(fullPath, "blueprint.txt");

    if (fs.existsSync(blueprintPath) && fs.statSync(blueprintPath).isFile()) {
      const label = name.replace(/-/g, " ");
      result.push({ value: relPath, label });
    }
    // One level of nesting (e.g. apps/templates/doctor)
    const nested = collectTemplates(fullPath, relPath);
    result.push(...nested);
  }
  return result;
}

export async function GET() {
  try {
    if (!fs.existsSync(APPS_ROOT)) {
      return NextResponse.json({ templates: [] });
    }

    const templates = collectTemplates(APPS_ROOT, "");
    return NextResponse.json({ templates });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message, templates: [] },
      { status: 500 }
    );
  }
}
