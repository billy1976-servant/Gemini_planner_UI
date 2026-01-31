import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { compileSite, siteExists } from "@/lib/siteCompiler";

const SITES_ROOT = path.join(process.cwd(), "src", "apps-offline", "sites");

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ domain: string }> | { domain: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { domain } = resolvedParams;

    if (!domain) {
      return NextResponse.json({ error: "No site/domain provided" }, { status: 400 });
    }

    // 1) Compiled sites (content/compiled/sites)
    if (siteExists(domain)) {
      const compiledSite = await compileSite(domain);
      if (compiledSite) {
        return NextResponse.json(compiledSite, {
          headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
        });
      }
    }

    // 2) Fallback: apps-offline/sites/{domain}/site.json (legacy site config)
    const sitePath = path.join(SITES_ROOT, domain, "site.json");
    if (fs.existsSync(sitePath)) {
      const fileContent = fs.readFileSync(sitePath, "utf-8");
      if (fileContent.trim()) {
        const json = JSON.parse(fileContent);
        return NextResponse.json(json, {
          headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
        });
      }
    }

    return NextResponse.json(
      { error: "Site not found", siteId: domain },
      { status: 404 }
    );
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params);
    const domain = resolvedParams?.domain || "unknown";
    console.error(`[api/sites/${domain}] Error:`, error);
    return NextResponse.json(
      { error: "Failed to load site", message: error?.message || String(error) },
      { status: 500 }
    );
  }
}
