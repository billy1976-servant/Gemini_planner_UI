export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getProjectionSnapshots } from "@/logic/business/projections/projection-store";

/**
 * GET /api/google-ads/projection-snapshots
 * Returns list of stored projection snapshots. No projection math changes.
 */
export async function GET() {
  try {
    const snapshots = getProjectionSnapshots();
    return NextResponse.json({ snapshots });
  } catch (error: any) {
    console.error("[projection-snapshots] Error:", error);
    return NextResponse.json(
      { error: "Failed to list snapshots", message: error.message },
      { status: 500 }
    );
  }
}
