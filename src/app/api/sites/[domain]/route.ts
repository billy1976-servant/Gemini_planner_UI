import { NextResponse } from "next/server";
import { compileSite } from "@/lib/siteCompiler/compileSite";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ domain: string }> | { domain: string } }
) {
  try {
    // Handle both Next.js 14 and 15 param formats
    const resolvedParams = await Promise.resolve(params);
    const { domain } = resolvedParams;
    
    const compiledSite = await compileSite(domain);
    
    if (!compiledSite) {
      return NextResponse.json(
        { error: `Site not found: ${domain}` },
        { status: 404 }
      );
    }
    
    return NextResponse.json(compiledSite);
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params);
    const domain = resolvedParams?.domain || "unknown";
    console.error(`[api/sites/${domain}] Error compiling site:`, error);
    
    return NextResponse.json(
      { 
        error: "Failed to compile site",
        message: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
