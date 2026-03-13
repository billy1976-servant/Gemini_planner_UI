import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const UPLOADS_DIR = path.join(
  process.cwd(),
  "src",
  "01_App",
  "Christian",
  "Prayer",
  "uploads"
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pathParam = searchParams.get("path");
    if (!pathParam) {
      return NextResponse.json({ error: "path required" }, { status: 400 });
    }
    const basename = path.basename(pathParam);
    if (basename !== pathParam || basename.includes("..")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }
    const filePath = path.join(UPLOADS_DIR, basename);
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const buf = fs.readFileSync(filePath);
    const ext = path.extname(basename).toLowerCase();
    const mime: Record<string, string> = {
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".m4a": "audio/mp4",
      ".ogg": "audio/ogg",
      ".webm": "audio/webm",
    };
    const contentType = mime[ext] ?? "application/octet-stream";
    return new NextResponse(buf, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("[api/prayer/audio]", err);
    return NextResponse.json({ error: "Failed to serve audio" }, { status: 500 });
  }
}
