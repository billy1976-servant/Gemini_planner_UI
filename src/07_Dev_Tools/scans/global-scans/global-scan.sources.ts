"use client";
/**
 * GLOBAL SCAN SOURCES — REAL DATA
 *
 * PURPOSE:
 * - Route scan requests to real providers
 * - NO fake numbers
 * - NO randomness
 * - NO AI
 *
 * CURRENT:
 * - Google Trends (public, free)
 * - Google Ads (requires API credentials)
 *
 * FUTURE:
 * - TikTok
 * - Reddit
 * - News
 * - Any other provider
 */
import { fetchGoogleTrendsSignal } from "./providers/google-trends.provider";
import { fetchGoogleAdsSignal } from "./providers/google-ads.provider";

/**
 * CANONICAL SIGNAL FETCHER
 * 🔒 REQUIRED SIGNATURE — DO NOT CHANGE
 */
export async function fetchScanSignal(query: string) {
  // Try Google Trends first (free, no credentials needed)
  try {
    const trendsData = await fetchGoogleTrendsSignal(query);
    if (trendsData && trendsData.raw) {
      // Extract value from Google Trends response
      // Google Trends returns complex data, extract a meaningful value
      const value = trendsData.raw?.default?.timelineData?.[0]?.value?.[0] || 0;
      return {
        timestamp: trendsData.timestamp,
        query,
        value,
        source: "google-trends",
      };
    }
  } catch (error) {
    // Fall through to try Google Ads
  }

  // Try Google Ads (requires API credentials)
  try {
    const adsEvents = await fetchGoogleAdsSignal(query);
    if (adsEvents && adsEvents.length > 0) {
      // Use the first event's rawValue as the signal value
      const event = adsEvents[0];
      return {
        timestamp: event.timestamp,
        query,
        value: event.rawValue,
        source: "google-ads",
      };
    }
  } catch (error) {
    // Both providers failed or not configured
  }

  // If all providers fail or return no data, return zero (not an error)
  return {
    timestamp: Date.now(),
    query,
    value: 0,
    source: "none",
  };
}


