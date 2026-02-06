"use client";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import JsonRenderer from "@/engine/core/json-renderer";
import { recordStage } from "@/engine/debug/pipelineStageTrace";
import { PipelineDebugStore } from "@/devtools/pipeline-debug-store";
import { loadScreen } from "@/engine/core/screen-loader";
import SectionLayoutDropdown from "@/dev/section-layout-dropdown";
import { resolveLandingPage } from "@/logic/runtime/landing-page-resolver";
import { getLayout, subscribeLayout } from "@/engine/core/layout-store";
import { getPaletteName, subscribePalette } from "@/engine/core/palette-store";
import { getState, subscribeState, dispatchState } from "@/state/state-store";
import { setCurrentScreenTree } from "@/engine/core/current-screen-tree-store";
import { getExperienceProfile } from "@/lib/layout/profile-resolver";
import { getTemplateProfile } from "@/lib/layout/template-profiles";
import { composeOfflineScreen } from "@/lib/screens/compose-offline-screen";
import { expandOrgansInDocument, assignSectionInstanceKeys } from "@/organs/resolve-organs";
import { loadOrganVariant } from "@/organs/organ-registry";
import OrganPanel from "@/organs/OrganPanel";
import {
  getSectionLayoutPresetOverrides,
  getOverridesForScreen,
  getCardLayoutPresetOverrides,
  getCardOverridesForScreen,
  subscribeSectionLayoutPresetOverrides,
  subscribeCardLayoutPresetOverrides,
  setSectionLayoutPresetOverride,
  setCardLayoutPresetOverride,
} from "@/state/section-layout-preset-store";
import {
  getOrganInternalLayoutOverridesForScreen,
  subscribeOrganInternalLayoutOverrides,
  getOrganInternalLayoutOverrides,
  setOrganInternalLayoutOverride,
} from "@/state/organ-internal-layout-store";
import {
  getLayout2Ids,
  collectSectionKeysAndNodes,
  collectSectionLabels,
} from "@/layout";
import { getOrganLayoutOrganIds, getInternalLayoutIds } from "@/layout-organ";
import { hasLayoutNodeType, collapseLayoutNodes } from "@/engine/core/collapse-layout-nodes";
import { applySkinBindings } from "@/logic/bridges/skinBindings.apply";
import WebsiteShell from "@/lib/site-skin/shells/WebsiteShell";
import AppShell from "@/lib/site-skin/shells/AppShell";
import LearningShell from "@/lib/site-skin/shells/LearningShell";


/* ============================================================
   TSX SCREEN LOADER (NO JSON-RENDERER INVOLVEMENT)
   - This is the ONLY place TSX screens are handled.
   - Auto-discovers ALL files under /screens (all subfolders)
============================================================ */


/* ------------------------------------------------------------
   🔑 AUTO TSX MAP (UPDATED — SCANS ALL SCREENS FOLDERS)
------------------------------------------------------------ */
const tsxContext = (require as any).context(
  "@/screens",
  true,
  /\.tsx$/
);


const AUTO_TSX_MAP: Record<
  string,
  () => Promise<{ default: React.ComponentType<any> }>
> = {};


tsxContext.keys().forEach((key: string) => {
  const normalized = key.replace(/^.\//, "").replace(/\.tsx$/, "");
  AUTO_TSX_MAP[normalized] = () =>
    import(`@/screens/${normalized}`);
});


/* ------------------------------------------------------------
   🔧 PATH NORMALIZER (UPDATED — HANDLES ALL SUBDIRECTORIES)
------------------------------------------------------------ */
function normalizeTsxPath(path: string) {
  // Remove common prefixes (tsx:, tsx-screens/, etc.) and file extensions
  return path
    .replace(/^tsx:/, "")
    .replace(/^tsx-screens\//, "")
    .replace(/\.screen$/, "")
    .replace(/\.tsx$/, "");
}


/* ------------------------------------------------------------
   🔑 RESOLVER (UPDATED — TRIES MULTIPLE PATH FORMATS)
------------------------------------------------------------ */
function resolveTsxScreen(path: string) {
  // Try multiple path formats for backward compatibility
  const normalized = normalizeTsxPath(path);
  
  // Try exact match first
  let loader = AUTO_TSX_MAP[normalized];
  
  // If not found, try with tsx-screens prefix (for backward compatibility)
  if (!loader && !normalized.startsWith("tsx-screens/")) {
    loader = AUTO_TSX_MAP[`tsx-screens/${normalized}`];
  }
  
  // If still not found, try without any prefix
  if (!loader && normalized.includes("/")) {
    const parts = normalized.split("/");
    loader = AUTO_TSX_MAP[parts.slice(1).join("/")];
  }
  
  if (loader) {
    return dynamic(loader, { ssr: false });
  }
  return null;
}


export default function Page() {
  const searchParams = useSearchParams();
  const screen = searchParams.get("screen");

  // 🔑 TOP-LEVEL LOGGING: Track URL, screen param, and remount status
  const currentUrl = typeof window !== "undefined" ? window.location.href : "SSR";
  const [lastScreen, setLastScreen] = useState<string | null>(null);
  const [remountCount, setRemountCount] = useState(0);

  useEffect(() => {
    if (screen !== lastScreen) {
      setRemountCount(c => c + 1);
      setLastScreen(screen);
      console.log("[page] 🔄 SCREEN CHANGE DETECTED", {
        currentURL: currentUrl,
        screenParam: screen,
        previousScreen: lastScreen,
        remountCount: remountCount + 1,
        timestamp: Date.now(),
      });
    }
  }, [screen, lastScreen, currentUrl, remountCount]);

  const [json, setJson] = useState<any>(null);
  const [tsxMeta, setTsxMeta] = useState<{ path: string } | null>(null);
  const [TsxComponent, setTsxComponent] =
    useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [sectionHeights, setSectionHeights] = useState<Record<string, number>>({});
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionKeysRef = useRef<string[]>([]);

  // Measure section heights so panel rows align with each section (must run before any early return)
  useLayoutEffect(() => {
    const el = contentRef.current;
    const keys = sectionKeysRef.current;
    if (!el || keys.length === 0) return;
    const sectionEls = el.querySelectorAll("[data-section-id]");
    const heights: Record<string, number> = {};
    sectionEls.forEach((node) => {
      const id = node.getAttribute("data-section-id");
      if (id) heights[id] = (node as HTMLElement).offsetHeight;
    });
    setSectionHeights((prev) => {
      if (Object.keys(heights).length === 0) return prev;
      const same =
        Object.keys(heights).every((k) => prev[k] === heights[k]) &&
        Object.keys(prev).length === Object.keys(heights).length;
      return same ? prev : heights;
    });
  });

  // State is source of truth for layout/palette; fall back to legacy stores when state key is missing
  const stateSnapshot = useSyncExternalStore(subscribeState, getState, getState);
  if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
    console.log("STATE LAYOUT BY SCREEN", stateSnapshot?.layoutByScreen);
  }
  const layoutSnapshot = useSyncExternalStore(subscribeLayout, getLayout, getLayout);
  useSyncExternalStore(subscribePalette, getPaletteName, () => "default");
  useSyncExternalStore(subscribeSectionLayoutPresetOverrides, getSectionLayoutPresetOverrides, getSectionLayoutPresetOverrides);
  useSyncExternalStore(subscribeCardLayoutPresetOverrides, getCardLayoutPresetOverrides, getCardLayoutPresetOverrides);
  useSyncExternalStore(subscribeOrganInternalLayoutOverrides, getOrganInternalLayoutOverrides, getOrganInternalLayoutOverrides);

  const experience = (stateSnapshot?.values?.experience ?? (layoutSnapshot as { experience?: string })?.experience) ?? "website";
  const templateIdFromState = stateSnapshot?.values?.templateId;
  const layoutModeFromState = stateSnapshot?.values?.layoutMode;
  const paletteName = (stateSnapshot?.values?.paletteName ?? getPaletteName()) || "default";

  /** Section/card/organ overrides from state.layoutByScreen[screenKey]. Do not use state.values for layout presets. */
  const getLayoutOverridesFromState = (screenKey: string) => {
    const byScreen = stateSnapshot?.layoutByScreen?.[screenKey];
    if (!byScreen) return { section: {} as Record<string, string>, card: {} as Record<string, string>, organ: {} as Record<string, string> };
    return {
      section: { ...(byScreen.section ?? {}) },
      card: { ...(byScreen.card ?? {}) },
      organ: { ...(byScreen.organ ?? {}) },
    };
  };

  /* --------------------------------------------------
     DEV PANEL HOST (UNCHANGED)
  -------------------------------------------------- */
  useEffect(() => {
    const check = () => {
      const el = document.getElementById("section-layout-panel");
      if (el) setHost(el);
    };
    check();
    const id = setInterval(check, 50);
    return () => clearInterval(id);
  }, []);


  /* --------------------------------------------------
     CANONICAL SCREEN LOAD (JSON OR TSX DESCRIPTOR)
  -------------------------------------------------- */
  useEffect(() => {
    // 🔑 TOP-LEVEL: Log screen param resolution
    console.log("[page] 📍 SCREEN LOAD EFFECT TRIGGERED", {
      currentURL: typeof window !== "undefined" ? window.location.href : "SSR",
      screenParam: screen,
      searchParamsString: typeof window !== "undefined" ? window.location.search : "SSR",
      timestamp: Date.now(),
    });

    if (!screen) {
      // ✅ CHECK FOR FLOW PARAMETER - Load engine-viewer if flow is present
      const flowParam = searchParams.get("flow");
      if (flowParam) {
        // Load engine-viewer as TSX screen when flow parameter is present
        const engineViewerPath = "tsx:tsx-screens/onboarding/engine-viewer";
        loadScreen(engineViewerPath)
          .then((data) => {
            if (data?.__type === "tsx-screen" && typeof data.path === "string") {
              const C = resolveTsxScreen(data.path);
              if (C) {
                setTsxMeta({ path: data.path });
                setTsxComponent(() => C);
                setJson(null);
                setError(null);
                return;
              }
            }
            setError(`TSX screen not found: ${data.path}`);
            setTsxMeta(null);
            setTsxComponent(null);
            setJson(null);
          })
          .catch((err) => {
            setError(err?.message || "Failed to load engine-viewer");
            setJson(null);
            setTsxMeta(null);
            setTsxComponent(null);
          });
        return;
      }

      // ✅ AUTO-RESOLVE LANDING PAGE
      try {
        const { flow, content } = resolveLandingPage();

        if (content) {
          // Merge content with flow decision
          const landingPageContent = {
            ...content,
            flow,
            root: {
              type: "json-skin", // Use JsonSkinEngine
              children: content.blocks ?? [],
            },
          };
          setJson(landingPageContent);
          setTsxMeta(null);
          setTsxComponent(null);
          setError(null);
          return;
        }
      } catch (err) {
        console.warn("[page] Landing page resolution failed:", err);
      }

      setJson(null);
      setTsxMeta(null);
      setTsxComponent(null);
      setError("Select a screen from the Navigator.");
      return;
    }


    // 🔑 Force fresh load - clear previous screen state
    setJson(null);
    setTsxMeta(null);
    setTsxComponent(null);
    setError(null);

    loadScreen(screen)
      .then((data) => {
        console.log("[page] ✅ SCREEN LOADED", {
          screenPath: screen,
          dataType: data?.__type,
          hasJson: !!data && !data.__type,
          timestamp: Date.now(),
        });

        // ✅ TSX SCREEN BRANCH (UNCHANGED)
        if (data?.__type === "tsx-screen" && typeof data.path === "string") {
          const C = resolveTsxScreen(data.path);
          if (!C) {
            setError(`TSX screen not found: ${data.path}`);
            setTsxMeta(null);
            setTsxComponent(null);
            setJson(null);
            return;
          }
          setTsxMeta({ path: data.path });
          setTsxComponent(() => C);
          setJson(null);
          setError(null);
          return;
        }


        // ✅ JSON SCREEN BRANCH — FIXED
        // IMPORTANT: store the FULL descriptor, but render ONLY its root
        setJson(data);
        setTsxMeta(null);
        setTsxComponent(null);
        setError(null);
      })
      .catch((err) => {
        setError(err?.message || "Screen not found");
        setJson(null);
        setTsxMeta(null);
        setTsxComponent(null);
      });
  }, [screen, searchParams]);


  /* --------------------------------------------------
     RENDER
  -------------------------------------------------- */
  if (error) return <div style={{ color: "red" }}>{error}</div>;


  const overlay =
    host &&
    createPortal(
      <SectionLayoutDropdown
        screenJson={
          json ??
          {
            __type: "tsx-screen",
            path: tsxMeta?.path ?? "",
          }
        }
        onChange={setJson}
      />,
      host
    );


  // ✅ TSX SCREEN
  if (TsxComponent) {
    return (
      <>
        {overlay}
        <TsxComponent />
      </>
    );
  }


  if (!json) return <div>Loading…</div>;

  // Screen key for layout/organ overrides (must be stable before expand so organ overrides apply)
  const hashJson = (obj: any) => {
    if (!obj) return "empty";
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i) | 0;
    return Math.abs(hash).toString(36);
  };
  const screenKey = screen ? screen.replace(/[^a-zA-Z0-9]/g, "-") : `screen-${hashJson(json)}`;
  const layoutFromState = getLayoutOverridesFromState(screenKey);
  const sectionLayoutPresetFromState = layoutFromState.section;
  const cardLayoutPresetFromState = layoutFromState.card;
  const organInternalLayoutFromState = layoutFromState.organ;
  const organInternalLayoutOverrides =
    Object.keys(organInternalLayoutFromState).length > 0
      ? organInternalLayoutFromState
      : getOrganInternalLayoutOverridesForScreen(screenKey);

  // ✅ FIX: render the ACTUAL screen root, not the descriptor
  let renderNode =
    json?.root ??
    json?.screen ??
    json?.node ??
    json;

  // Assign stable instance keys to top-level children, then expand organs (overrides keyed by instance key)
  const rawChildren = Array.isArray(renderNode?.children) ? renderNode.children : [];
  const children = assignSectionInstanceKeys(rawChildren);
  const docForOrgans = { meta: { domain: "offline", pageId: "screen", version: 1 }, nodes: children };
  const expandedDoc = expandOrgansInDocument(docForOrgans as any, loadOrganVariant, organInternalLayoutOverrides);
  const data = json?.data ?? {};
  const boundDoc = applySkinBindings(expandedDoc as any, data);
  const finalChildren = (boundDoc as any).nodes ?? children;
  renderNode = { ...renderNode, children: finalChildren };

  // Apps-offline: compose with experience profile; template overrides sections + full visual architecture (from state with fallback to layout-store)
  const effectiveTemplateId = templateIdFromState ?? (layoutSnapshot as { templateId?: string })?.templateId ?? "";
  const effectiveLayoutMode = layoutModeFromState ?? (layoutSnapshot as { mode?: "template" | "custom" })?.mode ?? "template";
  const experienceProfile = getExperienceProfile(experience);
  const templateProfile = getTemplateProfile(effectiveTemplateId);
  const effectiveProfile = templateProfile
    ? {
        ...experienceProfile,
        id: templateProfile.id,
        sections: templateProfile.sections,
        defaultSectionLayoutId: templateProfile.defaultSectionLayoutId,
        visualPreset: templateProfile.visualPreset,
        containerWidth: templateProfile.containerWidth,
        widthByRole: templateProfile.widthByRole,
        spacingScale: templateProfile.spacingScale,
        cardPreset: templateProfile.cardPreset,
        heroMode: templateProfile.heroMode,
        sectionBackgroundPattern: templateProfile.sectionBackgroundPattern,
        mode: effectiveLayoutMode,
      }
    : { ...experienceProfile, mode: effectiveLayoutMode };
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

  // Content-only rule: no layout node types (Grid/Row/Column/Stack) in JSON. Fail-fast in dev + optional rewrite.
  let treeForRender = composed;
  if (typeof process !== "undefined" && process.env.NODE_ENV === "development" && hasLayoutNodeType(composed)) {
    console.error(
      "[page] Screen JSON must not contain layout node types (Grid/Row/Column/Stack). Use params.moleculeLayout or layout metadata. Auto-rewriting at load."
    );
    treeForRender = collapseLayoutNodes(composed) as typeof composed;
  }

  // ✅ screenKey computed earlier (before expand) for organ overrides
  const currentTemplateId = effectiveTemplateId;
  const renderKey = `${screenKey}-t-${currentTemplateId || "default"}-p-${paletteName}`;

  // Section/card layout presets: from state with fallback to legacy stores
  const sectionLayoutPresetOverrides =
    Object.keys(sectionLayoutPresetFromState).length > 0
      ? sectionLayoutPresetFromState
      : getOverridesForScreen(screenKey);
  const cardLayoutPresetOverrides =
    Object.keys(cardLayoutPresetFromState).length > 0
      ? cardLayoutPresetFromState
      : getCardOverridesForScreen(screenKey);
  if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
    const sectionFromState = sectionLayoutPresetFromState;
    const cardFromState = cardLayoutPresetFromState;
    const organFromState = organInternalLayoutFromState;
    console.log("OVERRIDE SOURCE TRACE", {
      screenKey,
      fromState: { section: sectionFromState, card: cardFromState, organ: organFromState },
      sectionLayoutPresetOverrides,
      cardLayoutPresetOverrides,
    });
    console.log("STATE LAYOUT FOR SCREEN", screenKey, {
      section: sectionFromState,
      card: cardFromState,
      organ: organFromState,
    });
    PipelineDebugStore.mark("page", "override-maps", {
      screenKey,
      sectionCount: Object.keys(sectionLayoutPresetOverrides || {}).length,
      sectionKeys: Object.keys(sectionLayoutPresetFromState).slice(0, 8),
    });
  }
  const { sectionKeys: sectionKeysFromTree, sectionByKey } = collectSectionKeysAndNodes(treeForRender?.children ?? []);
  const sectionKeysForPreset = sectionKeysFromTree;
  sectionKeysRef.current = sectionKeysForPreset;
  const sectionLabels = collectSectionLabels(sectionKeysForPreset, sectionByKey);
  const layout2Ids = getLayout2Ids();
  const sectionPresetOptions: Record<string, string[]> = {};
  sectionKeysForPreset.forEach((k) => {
    sectionPresetOptions[k] = layout2Ids;
  });
  const organIds = getOrganLayoutOrganIds();
  const roleToOrganId: Record<string, string> = { features: "features-grid", content: "content-section" };
  const organIdBySectionKey: Record<string, string> = {};
  sectionKeysForPreset.forEach((k) => {
    const role = (sectionByKey[k]?.role ?? "").toString().trim();
    const organId = roleToOrganId[role] ?? role;
    if (organId && organIds.includes(organId)) organIdBySectionKey[k] = organId;
  });
  const organInternalLayoutOverridesProp = { ...getOrganInternalLayoutOverridesForScreen(screenKey) };

  // Log once per render to confirm key changes between files
  console.log("[page] 🔑 JsonRenderer KEY RESOLVED", {
    currentURL: typeof window !== "undefined" ? window.location.href : "SSR",
    screenPath: screen,
    resolvedKey: screenKey,
    jsonId: json?.id, // For reference only - NOT used in key
    previousKey: lastScreen ? lastScreen.replace(/[^a-zA-Z0-9]/g, "-") : null,
    willRemount: lastScreen !== screen,
    note: screen ? "✅ Using screen path" : "⚠️ Using JSON hash (screen path missing)",
  });

  const sectionLayoutPresetOverridesProp = { ...sectionLayoutPresetOverrides };
  const cardLayoutPresetOverridesProp = { ...cardLayoutPresetOverrides };

  // Layout preset changes: write to state.layoutByScreen via layout.override; mirror to legacy store for fallback.
  const handleSectionLayoutPresetOverride = (sectionKey: string, presetId: string) => {
    dispatchState("layout.override", { screenKey, type: "section", sectionId: sectionKey, presetId });
    setSectionLayoutPresetOverride(screenKey, sectionKey, presetId);
  };
  const handleCardLayoutPresetOverride = (sectionKey: string, presetId: string) => {
    dispatchState("layout.override", { screenKey, type: "card", sectionId: sectionKey, presetId });
    setCardLayoutPresetOverride(screenKey, sectionKey, presetId);
  };
  const handleOrganInternalLayoutOverride = (sectionKey: string, internalLayoutId: string) => {
    dispatchState("layout.override", { screenKey, type: "organ", sectionId: sectionKey, presetId: internalLayoutId });
    setOrganInternalLayoutOverride(screenKey, sectionKey, internalLayoutId);
  };

  // Pipeline trace: page-overrides — state.layoutByScreen[screenKey] → override maps before JsonRenderer
  const byScreen = stateSnapshot?.layoutByScreen?.[screenKey];
  const stateHasSection = byScreen && Object.keys(byScreen.section ?? {}).length > 0;
  const stateHasCard = byScreen && Object.keys(byScreen.card ?? {}).length > 0;
  const stateHasOrgan = byScreen && Object.keys(byScreen.organ ?? {}).length > 0;
  const overridesEmptyWhenStateHas =
    (stateHasSection && Object.keys(sectionLayoutPresetOverrides).length === 0) ||
    (stateHasCard && Object.keys(cardLayoutPresetOverrides).length === 0) ||
    (stateHasOrgan && Object.keys(organInternalLayoutOverrides).length === 0);
  if (overridesEmptyWhenStateHas) {
    recordStage("page-overrides", "fail", {
      reason: "Overrides not built from state",
      stateSnapshot: stateSnapshot?.values,
    });
  } else {
    recordStage("page-overrides", "pass", {
      screenKey,
      source: "state",
      sectionKeys: Object.keys(sectionLayoutPresetOverrides || {}),
      sectionOverrides: sectionLayoutPresetOverrides,
      cardOverrides: cardLayoutPresetOverrides,
      organOverrides: organInternalLayoutOverrides,
    });
  }

  if (process.env.NODE_ENV === "development") {
    let lastTarget = PipelineDebugStore.getSnapshot().lastEvent?.target ?? null;
    if (lastTarget?.startsWith("section-layout-preset-")) lastTarget = lastTarget.slice("section-layout-preset-".length);
    if (lastTarget?.startsWith("card-layout-preset-")) lastTarget = lastTarget.slice("card-layout-preset-".length);
    if (lastTarget?.startsWith("organ-internal-layout-")) lastTarget = lastTarget.slice("organ-internal-layout-".length);
    const pruneOverrides = <T extends Record<string, string>>(m: T): Record<string, string> => {
      const keys = lastTarget && lastTarget in m ? [lastTarget] : Object.keys(m).slice(0, 5);
      const out: Record<string, string> = {};
      keys.forEach((k) => {
        if (m[k] != null) out[k] = m[k];
      });
      return out;
    };
    recordStage("page", "pass", {
      screenKey,
      activeTemplateId: effectiveTemplateId,
      overrides: {
        section: pruneOverrides(sectionLayoutPresetOverrides),
        card: pruneOverrides(cardLayoutPresetOverrides),
        organ: pruneOverrides(organInternalLayoutOverrides),
    },
      ts: Date.now(),
    });
  }

  console.log("OVERRIDES", {
    section: sectionLayoutPresetOverridesProp,
    card: cardLayoutPresetOverridesProp,
    organ: organInternalLayoutOverridesProp,
  });

  console.log("FLOW 4 — PAGE OVERRIDES", {
    screenKey,
    sectionOverrides: sectionLayoutPresetOverrides,
  });
  const jsonContent = (
    <JsonRenderer
      key={renderKey}
      node={treeForRender}
      defaultState={json?.state}
      profileOverride={effectiveProfile}
      sectionLayoutPresetOverrides={sectionLayoutPresetOverrides}
      cardLayoutPresetOverrides={cardLayoutPresetOverrides}
      organInternalLayoutOverrides={organInternalLayoutOverrides}
      screenId={screenKey}
    />
  );

  // Wix-style: vertical gap between sections; template-driven section background pattern
  const sectionBackgroundPattern = (effectiveProfile as { sectionBackgroundPattern?: string } | null)?.sectionBackgroundPattern;
  const wrappedContent =
    experience === "website" ? (
      <div
        data-section-background-pattern={sectionBackgroundPattern ?? "none"}
        className={sectionBackgroundPattern === "alternate" ? "template-section-alternate" : sectionBackgroundPattern === "dark-bands" ? "template-section-dark-bands" : undefined}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-8)",
          width: "100%",
          overflowX: "hidden",
        }}
      >
        {jsonContent}
      </div>
    ) : (
      jsonContent
    );

  if (experience === "app") {
    return (
      <>
        {overlay}
        <AppShell
          primary={
            <div style={{ display: "flex", width: "100%", minHeight: "100%" }}>
              <div ref={contentRef} style={{ flex: 1, minWidth: 0, overflowX: "hidden" }}>{jsonContent}</div>
            <OrganPanel
              sectionKeysForPreset={sectionKeysForPreset}
              sectionLabels={sectionLabels}
              sectionLayoutPresetOverrides={sectionLayoutPresetOverrides}
              onSectionLayoutPresetOverride={handleSectionLayoutPresetOverride}
              cardLayoutPresetOverrides={cardLayoutPresetOverrides}
              onCardLayoutPresetOverride={handleCardLayoutPresetOverride}
              sectionPresetOptions={sectionPresetOptions}
              sectionHeights={sectionHeights}
              organIdBySectionKey={organIdBySectionKey}
              organInternalLayoutOverrides={organInternalLayoutOverridesProp}
              onOrganInternalLayoutOverride={handleOrganInternalLayoutOverride}
              sectionNodesByKey={sectionByKey}
            />
          </div>
        }
      />
    </>
  );
}
  if (experience === "learning") {
    return (
      <>
        {overlay}
        <LearningShell content={jsonContent} />
      </>
    );
  }
  return (
    <>
      {overlay}
      <WebsiteShell
        content={
          <div style={{ display: "flex", width: "100%", minHeight: "100vh" }}>
            <div ref={contentRef} style={{ flex: 1, minWidth: 0, overflowX: "hidden" }}>{wrappedContent}</div>
            <OrganPanel
              sectionKeysForPreset={sectionKeysForPreset}
              sectionLabels={sectionLabels}
              sectionLayoutPresetOverrides={sectionLayoutPresetOverrides}
              onSectionLayoutPresetOverride={handleSectionLayoutPresetOverride}
              cardLayoutPresetOverrides={cardLayoutPresetOverrides}
              onCardLayoutPresetOverride={handleCardLayoutPresetOverride}
              sectionPresetOptions={sectionPresetOptions}
              sectionHeights={sectionHeights}
              organIdBySectionKey={organIdBySectionKey}
              organInternalLayoutOverrides={organInternalLayoutOverridesProp}
              onOrganInternalLayoutOverride={handleOrganInternalLayoutOverride}
              sectionNodesByKey={sectionByKey}
            />
          </div>
        }
      />
    </>
  );
}


