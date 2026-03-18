// src/app/api/local-screens/[...path]/route.ts
// API route to serve local screen flow files using catch-all pattern

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SCREENS_ROOT = path.join(process.cwd(), "src", "screens", "tsx-screens");

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path?: string[] }> | { path?: string[] } }
) {
  try {
    // Handle both sync and async params (Next.js 14 vs 15)
    const resolvedParams = params instanceof Promise ? await params : params;
    const pathArray = resolvedParams?.path;
    
    if (!pathArray || pathArray.length < 2) {
      return NextResponse.json({ error: "Screen folder and file name required" }, { status: 400 });
    }

    const screenFolder = pathArray[0];
    const fileName = pathArray.slice(1).join("/"); // Handle nested paths if needed

    // Security: Only allow alphanumeric, underscores, hyphens, and dots
    if (!/^[a-zA-Z0-9_-]+$/.test(screenFolder) || !/^[a-zA-Z0-9_./-]+$/.test(fileName)) {
      return NextResponse.json({ error: "Invalid screen folder or file name" }, { status: 400 });
    }

    // Path to the flow file
    const jsonPath = path.join(SCREENS_ROOT, screenFolder, fileName);

    if (!fs.existsSync(jsonPath)) {
      return NextResponse.json(
        { error: `File not found: ${screenFolder}/${fileName}` },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(jsonPath, "utf8");
    let json;
    try {
      json = JSON.parse(fileContent);
    } catch (parseError: any) {
      return NextResponse.json(
        { error: `Invalid JSON in ${screenFolder}/${fileName}: ${parseError.message}` },
        { status: 500 }
      );
    }

    // Disable caching to ensure fresh loads
    return NextResponse.json(json, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (err: any) {
    console.error("[api/local-screens] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
