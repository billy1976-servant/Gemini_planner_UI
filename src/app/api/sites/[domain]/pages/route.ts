/**
 * API Route: /api/sites/[domain]/pages
 * 
 * Returns list of available pages for the specified domain.
 * Reads from /compiled/pages/ directory.
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
    
    // Read from compiled pages directory
    const pagesDir = path.join(
      process.cwd(),
      "src",
      "content",
      "sites",
      domain,
      "compiled",
      "pages"
    );
    
    if (!fs.existsSync(pagesDir)) {
      return NextResponse.json(
        { 
          error: "Pages directory not found. Run 'npm run website' to package the site.",
          path: pagesDir
        },
        { status: 404 }
      );
    }
    
    // Read all page files
    const pageFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.json'));
    const pages = pageFiles.map(filename => {
      const filePath = path.join(pagesDir, filename);
      const content = fs.readFileSync(filePath, "utf-8");
      const page = JSON.parse(content);
      return {
        id: page.id,
        path: page.path,
        title: page.title,
      };
    });
    
    return NextResponse.json(pages, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params);
    const domain = resolvedParams?.domain || "unknown";
    console.error(`[api/sites/${domain}/pages] Error loading pages list:`, error);
    
    return NextResponse.json(
      { 
        error: "Failed to load pages list",
        message: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
