import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CONFIG_DIR = path.join(
  process.cwd(),
  "src",
  "01_App",
  "(live) Business",
  "Container_Creations"
);

const VARIANTS: Record<string, string> = {
  default: "ContainerCreationsLanding-2.json",
  v1: "ContainerCreationsLanding-v1.json",
  v2: "ContainerCreationsLanding-v2.json",
  v3: "ContainerCreationsLanding-3.json",
};

/** Fallback when requested variant file is missing. */
const FALLBACK_FILENAME = "ContainerCreationsLanding-2.json";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const variantParam = searchParams.get("variant");
    const variantKey =
      variantParam && VARIANTS[variantParam] ? variantParam : "default";
    const filename = VARIANTS[variantKey];
    const configPath = path.join(CONFIG_DIR, filename);

    if (!fs.existsSync(configPath)) {
      const fallbackPath = path.join(CONFIG_DIR, FALLBACK_FILENAME);
      if (fs.existsSync(fallbackPath)) {
        const content = fs.readFileSync(fallbackPath, "utf8");
        const config = JSON.parse(content);
        return NextResponse.json(config, {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            Pragma: "no-cache",
            Expires: "0",
          },
        });
      }
      return NextResponse.json(
        { error: "Config file not found" },
        { status: 404 }
      );
    }

    const content = fs.readFileSync(configPath, "utf8");
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
