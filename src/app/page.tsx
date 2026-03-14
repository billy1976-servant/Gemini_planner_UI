"use client";
export const dynamic = "force-dynamic";
// Path contract: TSX resolution uses require.context("../01_App/apps-tsx", ...) (see scripts/validate-paths.js)
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getScreenById, setScreenPaths, flattenIndexToPaths } from "@/07_Dev_Tools/nav/screen-registry";
import { useSyncExternalStore } from "react";
import ExperienceRenderer from "@/engine/core/ExperienceRenderer";
import { loadScreen } from "@/engine/core/screen-loader";
import { getLayout, subscribeLayout } from "@/engine/core/layout-store";
import { getState, subscribeState } from "@/state/state-store";
import { setCurrentScreenTree } from "@/engine/core/current-screen-tree-store";
import { getExperienceProfile } from "@/lib/layout/profile-resolver";
import { getTemplateProfile } from "@/lib/layout/template-profiles";
import { composeOfflineScreen } from "@/lib/screens/compose-offline-screen";
import {
  expandOrgansInDocument,
  assignSectionInstanceKeys,
  loadOrganVariant,
} from "@/components/organs";
import { hasLayoutNodeType, collapseLayoutNodes } from "@/engine/core/collapse-layout-nodes";
import { applySkinBindings } from "@/logic/bridges/skinBindings.apply";
import { collectSectionKeysAndNodes, collectSectionLabels } from "@/layout";
import {
  loadGlobalCapabilities,
  resolveCapabilityProfile,
  setCapabilityProfile,
  CapabilityProvider,
  getDomainMicroLoaders,
  type ResolveCapabilityProfileOptions,
} from "@/03_Runtime/capability";
import { TsxEmbedProvider } from "@/lib/tsx-embed-context";
import { resolveTsxScreen } from "@/lib/tsx-screen-resolver";
import { TSXScreenWithEnvelope } from "@/lib/tsx-structure/TSXScreenWithEnvelope";
import { AppShellDirector } from "@/lib/director/AppShellDirector";

/** Canonical default when URL/state missing or invalid (bare id). Never pass bare ids to loadScreen. */
const DEFAULT_SCREEN_PATH = "tsx:HiClarify/HiClarifyOnboarding";
const HOME_SCREEN_PATH = "HiClarify/home/home_screen";
const RETURNING_USER_KEY = "hiclarify_entered_once";

function isReturningUser(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(RETURNING_USER_KEY) === "1";
  } catch {
    return false;
  }
}

/** Build synthetic json-skin tree so TSX screens render through the same pipeline (ExperienceRenderer → JsonRenderer → JsonSkinEngine). */
function buildTsxEmbedTree(tsxPath: string) {
  return {
    type: "json-skin",
    id: "tsx-wrapper",
    children: [
      { type: "tsx-embed", params: { path: tsxPath }, children: [] },
    ],
  };
}

export default function Page() {
  const searchParams = useSearchParams();
  const stateSnapshot = useSyncExternalStore(subscribeState, getState, getState);
  const currentView = (stateSnapshot?.values?.currentView as string) ?? "";

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [screensReady, setScreensReady] = useState(false);

  const screenParam =
    searchParams?.get("screen")?.trim() ||
    currentView?.trim() ||
    "";
  const byId = screensReady && screenParam ? getScreenById(screenParam) : null;
  const rawPath = byId ? byId.path : screenParam;
  const isValidPath =
    rawPath.startsWith("tsx:") || rawPath.includes("/");
  const effectivePath = isValidPath ? rawPath : DEFAULT_SCREEN_PATH;

  useEffect(() => {
    fetch("/api/screens")
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setScreenPaths(flattenIndexToPaths(arr));
        setScreensReady(true);
      })
      .catch(() => setScreensReady(true));
  }, []);

  useEffect(() => {
    loadScreen(effectivePath)
      .then((loaded) => {
        setError(null);
        setData(loaded);
      })
      .catch((err) => {
        setError(err?.message ?? "Failed to load app");
        setData(null);
      });
  }, [effectivePath]);

  const layoutSnapshot = useSyncExternalStore(subscribeLayout, getLayout, getLayout);

  const experience = (stateSnapshot?.values?.experience ?? (layoutSnapshot as { experience?: string })?.experience) ?? "website";
  const effectiveTemplateId =
    stateSnapshot?.values?.templateId ??
    (layoutSnapshot as { templateId?: string })?.templateId ??
    null;
  const effectiveLayoutMode =
    stateSnapshot?.values?.layoutMode ?? (layoutSnapshot as { mode?: "template" | "custom" })?.mode ?? "template";

  const experienceProfile = getExperienceProfile(experience);
  const templateProfile = getTemplateProfile(effectiveTemplateId ?? "");

  const isTsxScreen = data?.__type === "tsx-screen";
  const json = isTsxScreen ? null : data;

  // Capability hub: resolve and write to store on screen/template change (JSON screens only)
  useEffect(() => {
    if (!json) return;
    const global = loadGlobalCapabilities();
    const options: ResolveCapabilityProfileOptions = {
      global,
      domainMicroLoaders: getDomainMicroLoaders(),
      templateId: effectiveTemplateId ?? undefined,
      templateProfile: templateProfile ? { capabilities: templateProfile.capabilities } : undefined,
      screenCapabilities: (json as { capabilities?: Record<string, string> })?.capabilities ?? undefined,
    };
    const profile = resolveCapabilityProfile(options);
    setCapabilityProfile(profile);
  }, [json, effectiveTemplateId, templateProfile]);

  const effectiveProfile = useMemo(
    () => {
      if (!templateProfile) return { ...experienceProfile, mode: effectiveLayoutMode };
      return {
        ...experienceProfile,
        id: templateProfile.id,
        sections: templateProfile.sections,
        defaultSectionLayoutId: templateProfile.defaultSectionLayoutId,
        layoutVariants: (templateProfile as { layoutVariants?: Record<string, unknown> }).layoutVariants,
        visualPreset: templateProfile.visualPreset,
        containerWidth: templateProfile.containerWidth,
        widthByRole: templateProfile.widthByRole,
        spacingScale: templateProfile.spacingScale,
        cardPreset: templateProfile.cardPreset,
        heroMode: templateProfile.heroMode,
        sectionBackgroundPattern: templateProfile.sectionBackgroundPattern,
        mode: effectiveLayoutMode,
      };
    },
    [experience, effectiveTemplateId, effectiveLayoutMode, experienceProfile, templateProfile]
  );

  if (error) return <div style={{ color: "red", padding: 16 }}>{error}</div>;
  if (!data) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading…</div>;

  if (isTsxScreen) {
    const tsxScreenPath = effectivePath.startsWith("tsx:") ? effectivePath : `tsx:${effectivePath}`;
    const TsxComponent = resolveTsxScreen(tsxScreenPath);
    if (!TsxComponent) {
      return (
        <div style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
          <h2 style={{ color: "#b91c1c", marginBottom: 8 }}>Screen not found</h2>
          <p style={{ color: "#374151", marginBottom: 16 }}>
            The screen &quot;{tsxScreenPath.replace(/^tsx:/, "")}&quot; could not be resolved. The navigator may not have loaded yet, or the path may have been moved.
          </p>
          <a href="/dev" style={{ color: "#2563eb", fontWeight: 500 }}>Open Navigator (/dev) to pick a screen</a>
        </div>
      );
    }
    const resolvedPathForEnvelope = tsxScreenPath.replace(/^tsx:/, "").trim();
    const EnvelopeWrapped = () => (
      <TSXScreenWithEnvelope screenPath={resolvedPathForEnvelope} Component={TsxComponent} />
    );
    const syntheticTree = buildTsxEmbedTree(tsxScreenPath);
    const experienceProfile = getExperienceProfile(experience);
    const treeForRender = composeOfflineScreen({
      rootNode: syntheticTree as any,
      experienceProfile,
      layoutState: {},
    });
    setCurrentScreenTree(treeForRender);
    const tsxEmbedValue = {
      getComponent: (path: string) => (path === tsxScreenPath && TsxComponent ? EnvelopeWrapped : null),
    };
    return (
      <CapabilityProvider>
        <AppShellDirector screenPath={tsxScreenPath} appSchema={null}>
          <TsxEmbedProvider value={tsxEmbedValue}>
            <div style={{ display: "flex", flexDirection: "column", width: "100%", minHeight: "100vh", overflowY: "visible" }}>
              <ExperienceRenderer
                key={`tsx-${tsxScreenPath}`}
                node={treeForRender}
                defaultState={{}}
                profileOverride={experienceProfile}
                sectionLayoutPresetOverrides={{}}
                cardLayoutPresetOverrides={{}}
                organInternalLayoutOverrides={{}}
                screenId={tsxScreenPath}
                behaviorProfile="default"
                experience={experience}
                sectionKeys={["tsx-embed"]}
                sectionLabels={{ "tsx-embed": "TSX Screen" }}
              />
            </div>
          </TsxEmbedProvider>
        </AppShellDirector>
      </CapabilityProvider>
    );
  }

  const screenKey = json?.id ?? effectivePath.replace(/[/.]/g, "-");
  const organInternalLayoutOverrides: Record<string, string> = {};

  let renderNode = json?.root ?? json?.screen ?? json?.node ?? json;
  const rawChildren = Array.isArray(renderNode?.children) ? renderNode.children : [];
  const children = assignSectionInstanceKeys(rawChildren);
  const docForOrgans = { meta: { domain: "offline", pageId: "screen", version: 1 }, nodes: children };
  const expandedDoc = expandOrgansInDocument(docForOrgans as any, loadOrganVariant, organInternalLayoutOverrides);
  const skinData = json?.data ?? {};
  const boundDoc = applySkinBindings(expandedDoc as any, skinData);
  const finalChildren = (boundDoc as any).nodes ?? children;
  renderNode = { ...renderNode, children: finalChildren };

  const layoutStateForCompose = {
    ...layoutSnapshot,
    experience,
    templateId: effectiveTemplateId,
    mode: effectiveLayoutMode,
  };
  const composed = composeOfflineScreen({
    rootNode: renderNode as any,
    experienceProfile,
    layoutState: layoutStateForCompose,
  });
  setCurrentScreenTree(composed);

  let treeForRender = composed;
  if (hasLayoutNodeType(composed)) {
    treeForRender = collapseLayoutNodes(composed) as typeof composed;
  }

  let { sectionKeys: sectionKeysFromTree, sectionByKey } = collectSectionKeysAndNodes(treeForRender?.children ?? []);
  if (sectionKeysFromTree.length === 0 && treeForRender != null) {
    const wrapped = {
      type: "section",
      id: "auto-root",
      children: Array.isArray(treeForRender.children) ? treeForRender.children : [treeForRender],
    } as typeof treeForRender;
    treeForRender = wrapped;
    sectionKeysFromTree = ["auto-root"];
    sectionByKey = { "auto-root": wrapped };
  }
  const sectionLabels = collectSectionLabels(sectionKeysFromTree, sectionByKey);

  const sectionLayoutPresetOverrides: Record<string, string> = {};
  const cardLayoutPresetOverrides: Record<string, string> = {};
  const behaviorProfile = (stateSnapshot?.values?.behaviorProfile ?? "default") as string;
  const screenContainerKey = `screen-${screenKey}-${effectiveTemplateId || "default"}`;

  const sectionBackgroundPattern = (effectiveProfile as { sectionBackgroundPattern?: string } | null)?.sectionBackgroundPattern;

  return (
    <CapabilityProvider>
      <div
        data-section-background-pattern={sectionBackgroundPattern ?? "none"}
        className={sectionBackgroundPattern === "alternate" ? "template-section-alternate" : sectionBackgroundPattern === "dark-bands" ? "template-section-dark-bands" : undefined}
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          minHeight: "100vh",
          overflowY: "visible",
        }}
      >
        <ExperienceRenderer
        key={screenContainerKey}
        node={treeForRender}
        defaultState={json?.state}
        profileOverride={effectiveProfile}
        sectionLayoutPresetOverrides={sectionLayoutPresetOverrides}
        cardLayoutPresetOverrides={cardLayoutPresetOverrides}
        organInternalLayoutOverrides={organInternalLayoutOverrides}
        screenId={screenKey}
        behaviorProfile={behaviorProfile}
        experience={experience}
        sectionKeys={sectionKeysFromTree}
        sectionLabels={sectionLabels}
      />
      </div>
    </CapabilityProvider>
  );
}
