/**
 * POST /api/compile-app
 * TXT-only compiler endpoint.
 *
 * Body: { action: "compile", appPath }
 * - compile: { appPath } → compiles existing folder (appPath relative to apps-json/apps or absolute)
 * - blueprint.txt and content.txt MUST already exist in the target folder.
 */

import { NextResponse } from "next/server";
import path from "path";

const APPS_JSON_APPS = path.join(
  process.cwd(),
  "src",
  "01_App",
  "(dead) Json",
  "apps"
);

/** Generated apps: src/01_App/(dead) Json/generated */
const APPS_JSON_GENERATED = path.join(
  process.cwd(),
  "src",
  "01_App",
  "(dead) Json",
  "generated"
);

type CompileBody = {
  action: "compile";
  /** Relative to apps-json/apps (e.g. "journal_track") or apps-json/generated (e.g. "generated/dentist-smith") or absolute path */
  appPath: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CompileBody;

    if (body.action === "compile") {
      let appPath: string;
      if (path.isAbsolute(body.appPath)) {
        appPath = body.appPath;
      } else if (body.appPath.startsWith("generated/")) {
        appPath = path.join(APPS_JSON_GENERATED, body.appPath.slice("generated/".length));
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
      { error: "action must be 'compile'" },
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
