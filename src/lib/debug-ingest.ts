/**
 * Optional debug/telemetry ingest. Set NEXT_PUBLIC_DEBUG_INGEST_URL in env to enable.
 * When unset (e.g. production), no requests are sent. Disabled for localhost/127.0.0.1
 * to avoid ERR_INSUFFICIENT_RESOURCES and connection errors. Throttled to at most once per 5s.
 */
const _url = typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_DEBUG_INGEST_URL;
export const DEBUG_INGEST_URL = (_url && String(_url).trim()) || "";

const THROTTLE_MS = 5000;
let lastSendTime = 0;

function shouldSkipIngestUrl(url: string): boolean {
  if (!url) return true;
  const lower = url.toLowerCase();
  return lower.includes("127.0.0.1") || lower.includes("localhost");
}

export function sendDebugIngest(
  payload: Record<string, unknown>,
  sessionIdHeader = "X-Debug-Session-Id"
): void {
  if (!DEBUG_INGEST_URL) return;
  if (shouldSkipIngestUrl(DEBUG_INGEST_URL)) return;
  const now = Date.now();
  if (now - lastSendTime < THROTTLE_MS) return;
  lastSendTime = now;
  const sessionId = (payload.sessionId as string) || "";
  fetch(DEBUG_INGEST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(sessionId ? { [sessionIdHeader]: sessionId } : {}),
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
}
