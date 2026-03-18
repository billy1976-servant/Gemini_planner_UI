export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getCampaignsData } from "../get-campaigns-data";

export async function GET() {
  try {
    const data = await getCampaignsData();
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.message?.includes("GOOGLE_ADS_MODE")) {
      return NextResponse.json(
        { error: error.message, message: error.message },
        { status: 400 }
      );
    }
    console.error("[Google Ads API] Error fetching campaigns:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch campaigns",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
