import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * API route for loading site configurations
 * Phase 1 - Core Site Structure
 */

const SITES_ROOT = path.join(
  process.cwd(),
  "src",
  "apps-offline",
  "sites"
);

export async function GET(
  _req: Request,
  { params }: { params: { siteId: string } }
) {
  try {
    if (!params?.siteId) {
      return NextResponse.json(
        { error: "No site ID provided" },
        { status: 400 }
      );
    }

    const siteId = params.siteId;
    const sitePath = path.join(SITES_ROOT, siteId, "site.json");
    
    console.log("[api/sites] File resolution", {
      siteId,
      sitePath,
      exists: fs.existsSync(sitePath),
    });
    
    if (!fs.existsSync(sitePath)) {
      return NextResponse.json(
        { error: "Site not found", siteId },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(sitePath, "utf8");
    
    if (!fileContent.trim()) {
      console.error("[api/sites] ❌ Empty file", { sitePath });
      return NextResponse.json(
        { error: "Site file is empty", path: sitePath },
        { status: 500 }
      );
    }
    
    try {
      const json = JSON.parse(fileContent);
      console.log("[api/sites] ✅ Site loaded", {
        siteId,
        pagesCount: json?.pages?.length,
        hasNavigation: !!json?.navigation,
        hasFooter: !!json?.footer,
      });
      
      return NextResponse.json(json, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      });
    } catch (parseError: any) {
      console.error("[api/sites] ❌ JSON parse error", {
        sitePath,
        error: parseError.message,
        fileLength: fileContent.length,
        firstChars: fileContent.substring(0, 100),
      });
      return NextResponse.json(
        { error: `Invalid JSON: ${parseError.message}`, path: sitePath },
        { status: 500 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
