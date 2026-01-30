/**
 * API Route: /api/sites/[domain]/brand
 * 
 * Returns brand info (logo + palette) from exports/brand.json
 * Reads from /exports/brand.json (packaged by npm run website).
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string }> | { domain: string } }
) {
  try {
    // Handle both Next.js 14 and 15 param formats
    const resolvedParams = await Promise.resolve(params);
    const domain = resolvedParams.domain;
    
    // Read from exports directory
    const brandPath = path.join(
      process.cwd(),
      "src",
      "content",
      "sites",
      domain,
      "exports",
      "brand.json"
    );
    
    if (!fs.existsSync(brandPath)) {
      // Brand info is optional, return null if not found
      return NextResponse.json(null);
    }
    
    const brandContent = fs.readFileSync(brandPath, "utf-8");
    const brand = JSON.parse(brandContent);
    
    return NextResponse.json(brand);
  } catch (error: any) {
    console.error(`[API] Error loading brand for ${params.domain}:`, error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to load brand info",
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
