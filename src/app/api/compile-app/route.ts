/**
 * POST /api/compile-app
 * Additive: Generate and/or compile app from module tree.
 * Body: { action: "generate" | "compile", ... }
 * - generate: { moduleId, slug, placeholders?, contentMode? } → writes blueprint + content, then compiles
 * - compile: { appPath } → compiles existing folder (appPath relative to apps-json/apps or absolute)
 */

import { NextResponse } from "next/server";
import path from "path";
import type { ModuleId } from "@/module-system/module-registry";
import {
  generateFiles,
  getGeneratedScreenPath,
} from "@/module-system/generate-app";

const APPS_JSON_APPS = path.join(
  process.cwd(),
  "src",
  "01_App",
  "apps-json",
  "apps"
);

type GenerateBody = {
  action: "generate";
  moduleId: ModuleId;
  slug: string;
  placeholders?: Record<string, string>;
  contentMode?: "auto" | "manual";
};

type CompileBody = {
  action: "compile";
  /** Relative to apps-json/apps (e.g. "generated/dentist-smith") or absolute path */
  appPath: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerateBody | CompileBody;

    if (body.action === "generate") {
      const { moduleId, slug, placeholders, contentMode } = body;
      if (!moduleId || !slug) {
        return NextResponse.json(
          { error: "moduleId and slug required" },
          { status: 400 }
        );
      }
      const appDir = generateFiles({
        moduleId,
        slug,
        placeholders,
        contentMode,
      });
      const { compileApp } = await import(
        "../../../07_Dev_Tools/scripts/blueprint"
      );
      compileApp(appDir);
      return NextResponse.json({
        ok: true,
        appDir,
        screenPath: getGeneratedScreenPath(slug),
      });
    }

    if (body.action === "compile") {
      let appPath: string;
      if (path.isAbsolute(body.appPath)) {
        appPath = body.appPath;
      } else {
        appPath = path.join(APPS_JSON_APPS, body.appPath);
      }
      const { compileApp } = await import(
        "../../../07_Dev_Tools/scripts/blueprint"
      );
      compileApp(appPath);
      return NextResponse.json({
        ok: true,
        appPath,
      });
    }

    return NextResponse.json(
      { error: "action must be 'generate' or 'compile'" },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
