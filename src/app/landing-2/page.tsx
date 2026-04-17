import { loadCatalog, normalizeVersionKey } from "@/lib/deck-platform/registry";
import { notFound, redirect } from "next/navigation";

type Landing2SearchParams = Record<string, string | string[] | undefined>;

function parseQueryString(sp: Landing2SearchParams, key: string): string | undefined {
  const raw = sp[key];
  if (typeof raw === "string" && raw.length > 0) return raw;
  if (Array.isArray(raw) && typeof raw[0] === "string" && raw[0].length > 0) return raw[0];
  return undefined;
}

function parseScreenParam(sp: Landing2SearchParams): string | null {
  const raw = sp.screen;
  if (typeof raw === "string") return raw.length ? raw : null;
  if (Array.isArray(raw) && typeof raw[0] === "string" && raw[0].length) return raw[0];
  return null;
}

/**
 * `/landing-2` redirects into the learn platform URL (folder SSOT + `/api/learn/resolve`), not the old JSON picker.
 */
export default function Landing2Page({ searchParams }: { searchParams: Landing2SearchParams }) {
  const catalog = loadCatalog();
  const entry = catalog.find(
    (e) => e.deckRef.appKey === "containercreations" && e.deckRef.flowKey === "vent-onboarding"
  );
  if (!entry) notFound();

  const rawVersion = parseQueryString(searchParams, "version");
  const initialKey =
    normalizeVersionKey(rawVersion, entry.availableVersions, entry.deckRef.defaultVersion) ??
    entry.deckRef.defaultVersion;

  const qs = new URLSearchParams();
  const runtimeMode = parseQueryString(searchParams, "runtimeMode");
  const slideBuilder = parseQueryString(searchParams, "slideBuilder");
  const screen = parseScreenParam(searchParams);
  if (runtimeMode) qs.set("runtimeMode", runtimeMode);
  if (slideBuilder) qs.set("slideBuilder", slideBuilder);
  if (screen) qs.set("screen", screen);
  const q = qs.toString();

  redirect(
    `/learn/containercreations/vent-onboarding/${encodeURIComponent(initialKey)}${q ? `?${q}` : ""}`
  );
}
