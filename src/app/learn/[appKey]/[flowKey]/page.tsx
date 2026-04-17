import { notFound, redirect } from "next/navigation";
import { loadCatalog } from "@/lib/deck-platform/registry";
import { normalizeDeckAppKey } from "@/lib/deck-platform/legacy-app-keys";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LearnSearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  params: { appKey: string; flowKey: string };
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

export default function LearnFlowEntryPage({ params, searchParams }: PageProps) {
  const appKey = normalizeDeckAppKey(params.appKey);
  const flowKey = params.flowKey.trim();
  const entry = loadCatalog().find(
    (item) => item.deckRef.appKey === appKey && item.deckRef.flowKey === flowKey
  );

  if (!entry) {
    notFound();
  }

  const suffix = toQueryString(searchParams);
  const destination = `/learn/${encodeURIComponent(entry.deckRef.appKey)}/${encodeURIComponent(entry.deckRef.flowKey)}/${encodeURIComponent(entry.deckRef.defaultVersion)}${suffix}`;
  redirect(destination);
}
