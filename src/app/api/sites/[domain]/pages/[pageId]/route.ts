/**
 * API Route: /api/sites/[domain]/pages/[pageId]
 * 
 * Returns a single page JSON for the specified domain and pageId.
 * Reads from /compiled/pages/{pageId}.json.
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
  { params }: { params: Promise<{ domain: string; pageId: string }> | { domain: string; pageId: string } }
) {
  try {
    // Handle both Next.js 14 and 15 param formats
    const resolvedParams = await Promise.resolve(params);
    const { domain, pageId } = resolvedParams;
    
    // Convert pageId to filename (home -> home.json, pages-faq -> pages-faq.json)
    const safeFilename = pageId === "home" ? "home.json" : `${pageId}.json`;
    
    // Read from compiled pages directory
    const pagePath = path.join(
      process.cwd(),
      "src",
      "content",
      "sites",
      domain,
      "compiled",
      "pages",
      safeFilename
    );
    
    if (!fs.existsSync(pagePath)) {
      return NextResponse.json(
        { 
          error: `Page not found: ${pageId}`,
          path: pagePath
        },
        { status: 404 }
      );
    }
    
    const pageContent = fs.readFileSync(pagePath, "utf-8");
    const page = JSON.parse(pageContent);
    
    return NextResponse.json(page, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params);
    const domain = resolvedParams?.domain || "unknown";
    const pageId = resolvedParams?.pageId || "unknown";
    console.error(`[api/sites/${domain}/pages/${pageId}] Error loading page:`, error);
    
    return NextResponse.json(
      { 
        error: "Failed to load page",
        message: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
