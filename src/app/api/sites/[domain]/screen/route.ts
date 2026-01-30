/**
 * API Route: /api/sites/[domain]/screen
 * 
 * Returns compiled screen model for the specified domain.
 * Server-side only - uses Node.js fs module.
 */

import { NextResponse } from "next/server";
import { compileSiteToScreenModel } from "@/lib/site-compiler/compileSiteToScreenModel";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ domain: string }> | { domain: string } }
) {
  try {
    // Handle both Next.js 14 and 15 param formats
    const resolvedParams = await Promise.resolve(params);
    const { domain } = resolvedParams;
    
    const screenModel = await compileSiteToScreenModel(domain);
    
    return NextResponse.json(screenModel, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params);
    const domain = resolvedParams?.domain || "unknown";
    console.error(`[api/sites/${domain}/screen] Error compiling screen model:`, error);
    
    return NextResponse.json(
      { 
        error: "Failed to compile screen model",
        message: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
