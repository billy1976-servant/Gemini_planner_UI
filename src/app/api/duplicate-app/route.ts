import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const APPS_ROOT = path.join(
  process.cwd(),
  "src",
  "01_App",
  "apps-json",
  "apps"
);

const GENERATED_ROOT = path.join(
  process.cwd(),
  "src",
  "01_App",
  "apps-json",
  "generated"
);

function resolveAppRoot(appPath: string): string {
  if (appPath.startsWith("generated/")) {
    return path.join(GENERATED_ROOT, appPath.slice("generated/".length));
  }
  return path.join(APPS_ROOT, appPath);
}

type DuplicateBody = {
  templateAppPath: string;
  newAppPath: string;
};

function copyDir(src: string, dest: string) {
  if (!fs.existsSync(src)) {
    throw new Error(`Template app not found: ${src}`);
  }
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      // Copy TXT and JSON contract files; skip compiled app.json so compile step regenerates.
      if (entry.name === "app.json") continue;
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as DuplicateBody;
    const template = (body.templateAppPath || "").trim();
    const target = (body.newAppPath || "").trim();

    if (!template || !target) {
      return NextResponse.json(
        { error: "templateAppPath and newAppPath are required" },
        { status: 400 }
      );
    }

    const srcDir = resolveAppRoot(template);
    const destDir = resolveAppRoot(target);

    if (fs.existsSync(destDir)) {
      return NextResponse.json(
        { error: `Target app folder already exists: ${target}` },
        { status: 400 }
      );
    }

    copyDir(srcDir, destDir);

    return NextResponse.json({
      ok: true,
      template,
      appPath: target,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

