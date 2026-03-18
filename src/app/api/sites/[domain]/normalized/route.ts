/**
 * API Route: /api/sites/[domain]/normalized
 * 
 * Returns normalized site data for the specified domain.
 * Reads from /compiled/normalized.json (packaged by npm run website).
 * Server-side only - uses Node.js fs module.
 */

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Force dynamic rendering - these routes depend on file system data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ domain: string }> | { domain: string } }
) {
  try {
    // Handle both Next.js 14 and 15 param formats
    const resolvedParams = await Promise.resolve(params);
    const { domain } = resolvedParams;
    
    // Read from compiled directory
    const normalizedPath = path.join(
      process.cwd(),
      "src",
      "content",
      "sites",
      domain,
      "compiled",
      "normalized.json"
    );
    
    if (!fs.existsSync(normalizedPath)) {
      return NextResponse.json(
        { 
          error: "Normalized data not found. Run 'npm run website' to package the site.",
          path: normalizedPath
        },
        { status: 404 }
      );
    }
    
    const normalizedContent = fs.readFileSync(normalizedPath, "utf-8");
    const normalizedSite = JSON.parse(normalizedContent);
    
    return NextResponse.json(normalizedSite, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params);
    const domain = resolvedParams?.domain || "unknown";
    console.error(`[api/sites/${domain}/normalized] Error loading normalized data:`, error);
    
    return NextResponse.json(
      { 
        error: "Failed to load normalized data",
        message: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
