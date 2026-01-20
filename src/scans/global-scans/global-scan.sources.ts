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
 *
 * FUTURE:
 * - Google Ads
 * - TikTok
 * - Reddit
 * - News
 * - Any other provider
 */
import { fetchGoogleTrendsSignal } from "./providers/google-trends.provider";
/**
 * CANONICAL SIGNAL FETCHER
 * 🔒 REQUIRED SIGNATURE — DO NOT CHANGE
 */
export async function fetchScanSignal(query: string) {
  // TEMP: Google Trends disabled (returns empty signal)
  return {
    timestamp: Date.now(),
    query,
    value: 0,
  };
}


