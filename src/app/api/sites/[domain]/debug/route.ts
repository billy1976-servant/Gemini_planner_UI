/**
 * API Route: /api/sites/[domain]/debug
 * 
 * Debug route that returns both normalized data and compiled schema.
 * Useful for testing the full pipeline.
 */

import { NextResponse } from "next/server";
import { normalizeSiteData } from "@/lib/site-compiler/normalizeSiteData";
import { compileSiteToSchema } from "@/lib/site-compiler/compileSiteToSchema";

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
    
    // Step 1: Normalize raw data
    const normalized = normalizeSiteData(domain);
    
    // Step 2: Compile to schema
    const schema = await compileSiteToSchema(domain);
    
    return NextResponse.json({
      domain,
      normalized: {
        domain: normalized.domain,
        pagesCount: normalized.pages.length,
        productsCount: normalized.products.length,
        navigationCount: normalized.navigation.length,
        mediaCount: normalized.media.length,
        // Include sample data for debugging
        samplePage: normalized.pages[0] || null,
        sampleProduct: normalized.products[0] || null,
      },
      schema: {
        domain: schema.domain,
        pagesCount: schema.pages.length,
        samplePage: schema.pages[0] || null,
      },
      pipeline: {
        step1_normalize: "✓ Success",
        step2_compile: "✓ Success",
      },
    }, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params);
    const domain = resolvedParams?.domain || "unknown";
    console.error(`[api/sites/${domain}/debug] Error:`, error);
    
    return NextResponse.json(
      { 
        error: "Pipeline failed",
        message: error?.message || String(error),
        stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}
