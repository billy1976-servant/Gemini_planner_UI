import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // Read from sites index file
    const sitesIndexPath = path.join(
      process.cwd(),
      "src",
      "content",
      "sites",
      "_index",
      "sites.json"
    );

    if (!fs.existsSync(sitesIndexPath)) {
      // Return empty array if index doesn't exist yet
      return NextResponse.json([]);
    }

    const sitesContent = fs.readFileSync(sitesIndexPath, "utf-8");
    const sites = JSON.parse(sitesContent);

    return NextResponse.json(Array.isArray(sites) ? sites : []);
  } catch (error: any) {
    console.error("[api/sites/list] Error listing sites:", error);
    return NextResponse.json(
      { error: "Failed to list sites", details: error?.message },
      { status: 500 }
    );
  }
}
