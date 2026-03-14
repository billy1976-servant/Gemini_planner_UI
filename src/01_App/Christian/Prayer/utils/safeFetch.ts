/**
 * Safe fetch helper: never throws, returns null on failure.
 * Prevents UI crashes when APIs are unavailable (e.g. "Failed to fetch", CORS, wrong host).
 */
export async function safeFetch(url: string, options?: RequestInit): Promise<unknown> {
  if (!url || typeof url !== "string") {
    console.warn("[safeFetch] Invalid URL:", url);
    return null;
  }
  try {
    const res = await fetch(url, { cache: "no-store", ...options });
    if (!res.ok) {
      console.warn("[safeFetch] Non-OK response:", res.status, url);
      return null;
    }
    try {
      return await res.json();
    } catch {
      return null;
    }
  } catch (err) {
    console.warn("[safeFetch] Request failed (network/CORS/URL?):", url, err);
    return null;
  }
}
