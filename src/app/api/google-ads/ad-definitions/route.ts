import * as fs from "fs";
import * as path from "path";
import { NextRequest, NextResponse } from "next/server";
import { loadAdDefinitions } from "@/logic/business/execute";
import { validateAdDefinition } from "@/logic/business/execute/ad-types";

const BUSINESS_FILES = path.join(process.cwd(), "src", "00_Projects", "Business_Files");

/**
 * GET /api/google-ads/ad-definitions?businessId=...
 * Returns all ad definitions for the given business (read-only).
 */
export async function GET(request: NextRequest) {
  try {
    const businessId =
      request.nextUrl.searchParams.get("businessId")?.trim() ?? "default";
    const definitions = loadAdDefinitions(businessId);
    return NextResponse.json({ definitions });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load ad definitions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/google-ads/ad-definitions
 * Body: { businessId: string, ...adDefinition }. Validates against AdDefinition, writes to Business_Files/<businessId>/ads/<id>.json.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const businessId = typeof body.businessId === "string" ? body.businessId.trim() : "";
    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
    }
    const { businessId: _b, ...adPayload } = body;
    const ad = validateAdDefinition(adPayload);
    const adsDir = path.join(BUSINESS_FILES, businessId, "ads");
    fs.mkdirSync(adsDir, { recursive: true });
    const safeId = ad.id.replace(/[^a-zA-Z0-9-_]/g, "-");
    const filePath = path.join(adsDir, `${safeId || ad.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(ad, null, 2), "utf-8");
    return NextResponse.json({ ok: true, id: ad.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save ad definition";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
