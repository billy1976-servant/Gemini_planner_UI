/**
 * API Route: /api/sites/[domain]/schema
 * 
 * Returns compiled SiteSchema JSON for the specified domain.
 * Reads from /compiled/schema.json (packaged by npm run website).
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
    const schemaPath = path.join(
      process.cwd(),
      "src",
      "content",
      "sites",
      domain,
      "compiled",
      "schema.json"
    );
    
    if (!fs.existsSync(schemaPath)) {
      return NextResponse.json(
        { 
          error: "Schema not found. Run 'npm run website' to package the site.",
          path: schemaPath
        },
        { status: 404 }
      );
    }
    
    const schemaContent = fs.readFileSync(schemaPath, "utf-8");
    const schema = JSON.parse(schemaContent);
    
    return NextResponse.json(schema, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params);
    const domain = resolvedParams?.domain || "unknown";
    console.error(`[api/sites/${domain}/schema] Error loading schema:`, error);
    
    return NextResponse.json(
      { 
        error: "Failed to load schema",
        message: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
