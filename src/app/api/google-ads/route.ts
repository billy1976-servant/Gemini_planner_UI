export const runtime = "nodejs";


import { NextResponse } from "next/server";


/**
 * SERVER-SIDE GOOGLE ADS API PROXY (Diagnostics-first)
 *
 * This route proves:
 * 1) Which folder the running server is using (process.cwd()).
 * 2) Whether GOOGLE_ADS_* variables exist in process.env at runtime.
 * 3) Which variables are missing (treats empty/whitespace as missing).
 *
 * IMPORTANT:
 * - This does NOT print your secret values.
 * - It only reports whether they exist + their character length.
 */


const REQUIRED_ENV_VARS = [
  "GOOGLE_ADS_DEVELOPER_TOKEN",
  "GOOGLE_ADS_CLIENT_ID",
  "GOOGLE_ADS_CLIENT_SECRET",
  "GOOGLE_ADS_REFRESH_TOKEN",
  "GOOGLE_ADS_CUSTOMER_ID",
] as const;


const OPTIONAL_ENV_VARS = ["GOOGLE_ADS_LOGIN_CUSTOMER_ID"] as const;


function readEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (raw == null) return undefined;
  const trimmed = raw.trim();
  return trimmed.length ? trimmed : undefined;
}


function statusOf(name: string) {
  const v = readEnv(name);
  return {
    present: Boolean(v),
    length: v ? v.length : 0,
  };
}


export async function GET() {
  const cwd = process.cwd();

  const requiredStatus = Object.fromEntries(
    REQUIRED_ENV_VARS.map((k) => [k, statusOf(k)])
  );

  const optionalStatus = Object.fromEntries(
    OPTIONAL_ENV_VARS.map((k) => [k, statusOf(k)])
  );

  const missing = REQUIRED_ENV_VARS.filter((k) => !readEnv(k));

  // Show which GOOGLE_ADS_* keys exist at all (names only, no values)
  const googleAdsKeys = Object.keys(process.env).filter((k) =>
    k.startsWith("GOOGLE_ADS_")
  );

  const diagnostics = {
    cwd,
    nodeEnv: process.env.NODE_ENV ?? null,
    googleAdsKeys,
    requiredStatus,
    optionalStatus,
  };


  if (missing.length) {
    return NextResponse.json(
      {
        error: "Missing required environment variables",
        missing,
        diagnostics,
        nextStepHint:
          googleAdsKeys.length === 0
            ? "ZERO GOOGLE_ADS_* keys exist in process.env. That means this running server is not loading your .env.local, OR you are hitting a different server instance/port than the one you restarted."
            : "Some GOOGLE_ADS_* keys exist, but required ones are empty/whitespace or missing. That usually means formatting/parsing issues in .env.local (hidden characters, extra symbols, or bad line format).",
      },
      { status: 400 }
    );
  }


  return NextResponse.json(
    {
      ok: true,
      message:
        "All required GOOGLE_ADS_* env vars are present (not empty). Ready to call Google Ads API.",
      diagnostics,
    },
    { status: 200 }
  );
}


