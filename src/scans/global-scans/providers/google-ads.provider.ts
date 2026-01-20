// src/scans/global-scans/providers/google-ads.provider.ts
import { ScanEvent } from "../types"; // adjust import if needed


export async function fetchGoogleAdsSignal(): Promise<ScanEvent[]> {
  // TEMP: stub until real Ads API is wired
  const now = Date.now();


  return [
    {
      id: "ads-demo-1",
      keyword: "campaign: Search – Nashville",
      region: "US",
      timestamp: now,
      rawValue: 0,
      score: 0,          // ← mapped performance signal
      momentum: 0,       // ← velocity / delta signal
      trend: "flat",
      tags: ["google-ads", "stub"],
      source: "google-ads",
    },
  ];
}


