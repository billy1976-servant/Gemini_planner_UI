/**
 * Canonical base URL for the app (origin only, no path).
 * Used for manifest icons and favicon/apple-touch-icon so mobile WebViews
 * and PWA handlers get absolute URLs.
 * - VERCEL_URL (server) or NEXT_PUBLIC_VERCEL_URL (client) with https://
 * - Fallback: https://hi-sense.vercel.app
 */
export function getBaseUrl(): string {
  const v = process.env.NEXT_PUBLIC_VERCEL_URL ?? process.env.VERCEL_URL;
  if (v) return v.startsWith("http") ? v : `https://${v}`;
  return "https://hi-sense.vercel.app";
}
