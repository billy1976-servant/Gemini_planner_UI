"use client";

/**
 * CLIENT PROVIDER — GOOGLE ADS
 * --------------------------------
 * - Calls our internal API route
 * - No CORS
 * - Maps response to ScanEvent[]
 * - Deterministic
 */

import { ScanEvent } from "../types";

export async function fetchGoogleAdsSignal(query?: string): Promise<ScanEvent[]> {
  const res = await fetch("/api/google-ads", { cache: "no-store" });

  if (!res.ok) {
    if (res.status === 400) {
      const error = await res.json();
      throw new Error(`[google-ads] Configuration error: ${error.message || "Missing required environment variables"}`);
    }
    throw new Error(`[google-ads] API fetch failed: HTTP ${res.status}`);
  }

  const data = await res.json();

  // If API is not fully configured, return empty array (not an error)
  if (!data.configured) {
    return [];
  }

  // Map API response to ScanEvent[]
  // TODO: Replace with actual Google Ads data mapping when API is fully integrated
  const now = Date.now();
  
  // For now, return a deterministic event indicating API readiness
  // In production, this would map actual campaign/keyword data from Google Ads
  return [
    {
      id: `ads-${now}`,
      keyword: query || "google-ads-api",
      region: "US",
      timestamp: now,
      rawValue: data.configured ? 1 : 0,
      score: data.configured ? 1 : 0,
      momentum: 0,
      trend: "flat" as const,
      tags: ["google-ads", "api-ready"],
      source: "google-ads",
    },
  ];
}


