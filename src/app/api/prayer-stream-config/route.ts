import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CONFIG_PATH = path.join(
  process.cwd(),
  "src",
  "01_App",
  "(live) Business",
  "Prayer_Stream",
  "PrayerStreamOnboarding.json"
);

export async function GET() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return NextResponse.json(
        { error: "Config file not found" },
        { status: 404 }
      );
    }

    const content = fs.readFileSync(CONFIG_PATH, "utf8");
    const config = JSON.parse(content);
    return NextResponse.json(config, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (err) {
    console.error("[prayer-stream-config]", err);
    return NextResponse.json(
      { error: "Failed to read config" },
      { status: 500 }
    );
  }
}

