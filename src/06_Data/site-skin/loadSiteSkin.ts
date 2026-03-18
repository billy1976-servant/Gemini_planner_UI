import type { SiteSkinDocument } from "@/lib/site-skin/siteSkin.types";

export async function loadSiteSkin(domain: string, pageId: string): Promise<SiteSkinDocument> {
  const res = await fetch(`/api/sites/${encodeURIComponent(domain)}/skins/${encodeURIComponent(pageId)}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    let message = `Failed to load SiteSkin (${res.status})`;
    try {
      const data = await res.json();
      message = data?.error || data?.message || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return (await res.json()) as SiteSkinDocument;
}

