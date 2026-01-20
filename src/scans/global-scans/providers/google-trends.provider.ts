"use client";


/**
 * CLIENT PROVIDER — GOOGLE TRENDS
 * --------------------------------
 * - Calls our internal API route
 * - No CORS
 * - No paid APIs
 * - Deterministic
 */


export async function fetchGoogleTrendsSignal(query: string) {
  const res = await fetch(
    `/api/google-trends?query=${encodeURIComponent(query)}`,
    { cache: "no-store" }
  );


  if (!res.ok) {
    throw new Error("[google-trends] proxy fetch failed");
  }


  const data = await res.json();


  return {
    source: "google-trends",
    query,
    raw: data,
    timestamp: Date.now(),
  };
}


