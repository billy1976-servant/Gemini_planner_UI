/** Shared href builder (safe for Server and Client Components; no Node APIs). */
export function learnEditorHref(appKey: string, flowKey: string, versionKey: string): string {
  const q = new URLSearchParams({ runtimeMode: "builder" });
  return `/learn/${encodeURIComponent(appKey)}/${encodeURIComponent(flowKey)}/${encodeURIComponent(versionKey)}?${q}`;
}
