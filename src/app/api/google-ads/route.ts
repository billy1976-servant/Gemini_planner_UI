import { NextResponse } from "next/server";


export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_ADS_CLIENT_ID;


  return NextResponse.json({
    ok: true,
    step: "google-ads-api-proof",
    timestamp: new Date().toISOString(),


    env_check: {
      NEXT_PUBLIC_GOOGLE_ADS_CLIENT_ID: clientId ?? "MISSING",
    },


    status: clientId
      ? "API route is live and env vars are readable"
      : "Env var missing — check .env.local and restart dev server",


    next_required_for_real_data: [
      "Google Ads Developer Token",
      "OAuth refresh token (not client secret)",
      "Google Ads Customer ID",
    ],


    note:
      "This endpoint proves wiring works. No Google Ads data can be fetched until the three items above exist."
  });
}


