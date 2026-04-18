import { Suspense } from "react";
import LandingDeckRenderer from "@/lib/landing-deck/LandingDeckRenderer";
import { loadCatalog, normalizeVersionKey } from "@/lib/deck-platform/registry";
import { normalizeDeckAppKey } from "@/lib/deck-platform/legacy-app-keys";
import { notFound } from "next/navigation";
import {
  parseLandingRuntimeMode,
  parseSlideBuilderFlagDefaultOn,
} from "@/lib/slide-builder-query";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LearnSearchParams = Record<string, string | string[] | undefined>;

export type LearnDeckEditorPageProps = {
  appKey: string;
  flowKey: string;
  versionKey: string;
  searchParams: LearnSearchParams;
};

function parseScreenParam(sp: LearnSearchParams): string | null {
  const raw = sp.screen;
  if (typeof raw === "string") return raw.length ? raw : null;
  if (Array.isArray(raw) && typeof raw[0] === "string" && raw[0].length) return raw[0];
  return null;
}

/** Shared server tree for `/learn` and `/learn/{app}/{flow}/{version}`. */
export default function LearnDeckEditorPage({
  appKey: appKeyParam,
  flowKey: flowKeyParam,
  versionKey: versionKeyParam,
  searchParams,
}: LearnDeckEditorPageProps) {
  const appKey = normalizeDeckAppKey(appKeyParam);
  const flowKey = flowKeyParam.trim();
  const catalog = loadCatalog();
  const entry = catalog.find((e) => e.deckRef.appKey === appKey && e.deckRef.flowKey === flowKey);
  if (!entry) notFound();
  const learnFlowCatalog = catalog
    .map((c) => ({
      appKey: c.deckRef.appKey,
      flowKey: c.deckRef.flowKey,
      title: c.title,
      availableVersions: c.availableVersions,
      defaultVersion: c.deckRef.defaultVersion,
    }))
    .sort((a, b) => {
      const appCmp = a.appKey.localeCompare(b.appKey);
      if (appCmp !== 0) return appCmp;
      return a.flowKey.localeCompare(b.flowKey);
    });

  const initialDeckVersion =
    normalizeVersionKey(versionKeyParam, entry.availableVersions, entry.deckRef.defaultVersion) ??
    entry.deckRef.defaultVersion;

  return (
    <>
    <Suspense
      fallback={
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            color: "#64748b",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Loading editor…
        </div>
      }
    >
      <LandingDeckRenderer
        deckAppKey={appKey}
        deckFlowKey={flowKey}
        learnDeck={{ appKey, flowKey }}
        initialDeckVersion={initialDeckVersion}
        availableDeckVersions={entry.availableVersions}
        learnFlowCatalog={learnFlowCatalog}
        slideBuilderFlag={parseSlideBuilderFlagDefaultOn(searchParams.slideBuilder)}
        runtimeModeParam={parseLandingRuntimeMode(searchParams.runtimeMode) ?? null}
        screenParam={parseScreenParam(searchParams)}
      />
    </Suspense>
    </>
  );
}
