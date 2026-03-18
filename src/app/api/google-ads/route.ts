export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getGoogleAdsMode } from "./client";

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
  let mode: "mock" | "live";
  try {
    mode = getGoogleAdsMode();
  } catch (e: any) {
    return NextResponse.json(
      {
        error: "Invalid or missing GOOGLE_ADS_MODE",
        message: e.message,
        nextStepHint: "Set GOOGLE_ADS_MODE=mock or GOOGLE_ADS_MODE=live in .env.local",
      },
      { status: 400 }
    );
  }

  const cwd = process.cwd();
  const requiredStatus = Object.fromEntries(
    REQUIRED_ENV_VARS.map((k) => [k, statusOf(k)])
  );
  const optionalStatus = Object.fromEntries(
    OPTIONAL_ENV_VARS.map((k) => [k, statusOf(k)])
  );
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

  if (mode === "mock") {
    return NextResponse.json(
      {
        ok: true,
        message: "Mock mode: no Google API calls. All required GOOGLE_ADS_* vars not required.",
        diagnostics,
        mode: "mock",
      },
      { status: 200 }
    );
  }

  const missing = REQUIRED_ENV_VARS.filter((k) => !readEnv(k));
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
      mode: "live",
    },
    { status: 200 }
  );
}


