import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { parseVersionFromSegment } from "@/lib/version-utils";
import { resolveVersionedFileInDir } from "@/lib/versioned-file-resolver";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CONFIG_DIR = path.join(
  process.cwd(),
  "src",
  "01_App",
  "ContainerCreations",
  "Learn",
  "landing"
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const variantParam = searchParams.get("variant");
    const versionFromVariant = parseVersionFromSegment(variantParam);

    const versionNumber = versionFromVariant ?? null;
    const result = resolveVersionedFileInDir(CONFIG_DIR, versionNumber);

    if (!result) {
      return NextResponse.json(
        { error: "Config file not found" },
        { status: 404 }
      );
    }

    const content = fs.readFileSync(result.fullPath, "utf8");
    const config = JSON.parse(content);
    return NextResponse.json(config, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (err) {
    console.error("[container-creations-landing-config]", err);
    return NextResponse.json(
      { error: "Failed to read config" },
      { status: 500 }
    );
  }
}
