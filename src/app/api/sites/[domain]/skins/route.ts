/**
 * API Route: /api/sites/[domain]/skins
 *
 * Returns list of available SiteSkin JSON documents for the specified domain.
 * Reads from /compiled/skins/ directory.
 * Server-side only - uses Node.js fs module.
 */

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ domain: string }> | { domain: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { domain } = resolvedParams;

    const skinsDir = path.join(
      process.cwd(),
      "src",
      "content",
      "sites",
      domain,
      "compiled",
      "skins"
    );

    if (!fs.existsSync(skinsDir)) {
      return NextResponse.json(
        {
          error: "Skins directory not found. Create compiled skins for this domain.",
          path: skinsDir,
        },
        { status: 404 }
      );
    }

    const skinFiles = fs.readdirSync(skinsDir).filter((f) => f.endsWith(".skin.json"));
    const skins = skinFiles.map((filename) => {
      const pageId = filename.replace(/\.skin\.json$/i, "");
      return { pageId, filename };
    });

    return NextResponse.json(skins, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params);
    const domain = resolvedParams?.domain || "unknown";
    console.error(`[api/sites/${domain}/skins] Error loading skins list:`, error);

    return NextResponse.json(
      {
        error: "Failed to load skins list",
        message: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

