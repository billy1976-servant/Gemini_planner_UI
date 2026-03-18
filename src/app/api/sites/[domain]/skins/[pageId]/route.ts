/**
 * API Route: /api/sites/[domain]/skins/[pageId]
 *
 * Returns a SiteSkin JSON document for the specified domain and pageId.
 * Reads from /compiled/skins/{pageId}.skin.json.
 * Server-side only - uses Node.js fs module.
 */

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ domain: string; pageId: string }> | { domain: string; pageId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { domain, pageId } = resolvedParams;

    const safeFilename = `${pageId}.skin.json`;
    const skinPath = path.join(
      process.cwd(),
      "src",
      "content",
      "sites",
      domain,
      "compiled",
      "skins",
      safeFilename
    );

    if (!fs.existsSync(skinPath)) {
      return NextResponse.json(
        {
          error: `Skin not found: ${pageId}`,
          path: skinPath,
        },
        { status: 404 }
      );
    }

    const content = fs.readFileSync(skinPath, "utf-8");
    const skin = JSON.parse(content);

    return NextResponse.json(skin, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params);
    const domain = resolvedParams?.domain || "unknown";
    const pageId = resolvedParams?.pageId || "unknown";
    console.error(`[api/sites/${domain}/skins/${pageId}] Error loading skin:`, error);

    return NextResponse.json(
      {
        error: "Failed to load skin",
        message: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

