import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
} as const;

const CONFIG_DIR = path.join(
  process.cwd(),
  "src",
  "01_App",
  "(live) Business",
  "Container_Creations"
);

const VARIANTS: Record<string, string> = {
  default: "landing-2.json",
  v1: "ContainerCreationsLanding-v1.json",
  v2: "ContainerCreationsLanding-v2.json",
  v3: "ContainerCreationsLanding-3.json",
};

/** Fallback when requested variant file is missing. */
const FALLBACK_FILENAME = "landing-2.json";

/** `version` query: `landing-{n}.json` (digits only; avoids path traversal). */
function filenameFromVersionParam(versionRaw: string): string | null {
  if (!/^\d+$/.test(versionRaw.trim())) return null;
  return `landing-${versionRaw.trim()}.json`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const variantParam = searchParams.get("variant");
    const versionParam = searchParams.get("version");

    let filename: string;

    if (variantParam && VARIANTS[variantParam]) {
      filename = VARIANTS[variantParam];
    } else if (versionParam) {
      const fromVersion = filenameFromVersionParam(versionParam);
      filename = fromVersion ?? VARIANTS.default;
    } else {
      filename = VARIANTS.default;
    }

    const configPath = path.join(CONFIG_DIR, filename);

    if (!fs.existsSync(configPath)) {
      const fallbackPath = path.join(CONFIG_DIR, FALLBACK_FILENAME);
      if (fs.existsSync(fallbackPath)) {
        const content = fs.readFileSync(fallbackPath, "utf8");
        const config = JSON.parse(content);
        return NextResponse.json(config, { headers: NO_CACHE });
      }
      return NextResponse.json(
        { error: "Config file not found" },
        { status: 404 }
      );
    }

    const content = fs.readFileSync(configPath, "utf8");
    const config = JSON.parse(content);
    return NextResponse.json(config, { headers: NO_CACHE });
  } catch (err) {
    console.error("[container-creations-landing-config]", err);
    return NextResponse.json(
      { error: "Failed to read config" },
      { status: 500 }
    );
  }
}
