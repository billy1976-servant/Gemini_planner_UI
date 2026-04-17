import { notFound, redirect } from "next/navigation";
import { loadCatalog } from "@/lib/deck-platform/registry";
import { normalizeDeckAppKey } from "@/lib/deck-platform/legacy-app-keys";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LearnSearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  params: { appKey: string };
  searchParams: LearnSearchParams;
};

function toQueryString(searchParams: LearnSearchParams): string {
  const q = new URLSearchParams();
  for (const [key, raw] of Object.entries(searchParams)) {
    if (raw == null) continue;
    if (Array.isArray(raw)) {
      for (const v of raw) q.append(key, v);
      continue;
    }
    q.set(key, raw);
  }
  const text = q.toString();
  return text ? `?${text}` : "";
}

export default function LearnAppEntryPage({ params, searchParams }: PageProps) {
  const appKey = normalizeDeckAppKey(params.appKey);
  const appFlows = loadCatalog()
    .filter((entry) => entry.deckRef.appKey === appKey)
    .sort((a, b) => a.deckRef.flowKey.localeCompare(b.deckRef.flowKey));

  if (appFlows.length === 0) {
    notFound();
  }

  const target = appFlows[0];
  const suffix = toQueryString(searchParams);
  const destination = `/learn/${encodeURIComponent(target.deckRef.appKey)}/${encodeURIComponent(target.deckRef.flowKey)}/${encodeURIComponent(target.deckRef.defaultVersion)}${suffix}`;
  redirect(destination);
}
