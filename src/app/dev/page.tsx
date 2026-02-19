// Hook order stabilized — no conditional hooks allowed
"use client";
export const dynamic = "force-dynamic";
import React, { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import nextDynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import ExperienceRenderer from "@/engine/core/ExperienceRenderer";
import JsonRenderer from "@/engine/core/json-renderer";
import PreviewStage from "@/components/stage/PreviewStage";
import { recordStage } from "@/engine/debug/pipelineStageTrace";
import { PipelineDebugStore } from "@/devtools/pipeline-debug-store";
import { loadScreen } from "@/engine/core/screen-loader";
import { resolveLandingPage } from "@/logic/runtime/landing-page-resolver";
import { getLayout, subscribeLayout } from "@/engine/core/layout-store";
import { getPaletteName, subscribePalette } from "@/engine/core/palette-store";
import { getState, subscribeState, dispatchState } from "@/state/state-store";
import { getPhoneFrameEnabled, subscribePhoneFrameEnabled } from "@/dev/phone-frame-store";
import { getDevicePreviewMode, subscribeDevicePreviewMode } from "@/dev/device-preview-store";
import { setCurrentScreenTree } from "@/engine/core/current-screen-tree-store";
import { getExperienceProfile } from "@/lib/layout/profile-resolver";
import { getTemplateProfile } from "@/lib/layout/template-profiles";
import { composeOfflineScreen } from "@/lib/screens/compose-offline-screen";
import {
  expandOrgansInDocument,
  assignSectionInstanceKeys,
  loadOrganVariant,
} from "@/components/organs";
import OrganPanel from "@/components/organs/OrganPanel";
import { setDevSidebarProps } from "@/app/ui/control-dock/dev-right-sidebar-store";
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
  getSectionLayoutIds,
  collectSectionKeysAndNodes,
  collectSectionLabels,
  getAllowedCardPresetsForSectionPreset,
} from "@/layout";
import { getOrganLayoutOrganIds } from "@/layout-organ";
import { hasLayoutNodeType, collapseLayoutNodes } from "@/engine/core/collapse-layout-nodes";
import { applySkinBindings } from "@/logic/bridges/skinBindings.apply";
import { validateScreenJson, logScreenJsonValidation } from "@/debug/validateScreenJsonLayouts";
import WebsiteShell from "@/lib/site-skin/shells/WebsiteShell";
import LearningShell from "@/lib/site-skin/shells/LearningShell";
import GoogleLoginButton from "@/app/components/GoogleLoginButton";
import { TSXScreenWithEnvelope } from "@/lib/tsx-structure/TSXScreenWithEnvelope";


/* ============================================================
   TSX SCREEN LOADER (NO JSON-RENDERER INVOLVEMENT)
   - This is the ONLY place TSX screens are handled.
   - Auto-discovers ALL files under /apps-tsx (all subfolders)
============================================================ */


/* ------------------------------------------------------------
   🔑 AUTO TSX MAP — SCANS src/apps-tsx (TSX screens live here)
------------------------------------------------------------ */
const tsxContext = (require as any).context(
  "../../01_App/(dead) Tsx",
  true,
  /\.tsx$/
);

const businessContext = (require as any).context(
  "../../01_App/(live) Business",
  true,
  /\.tsx$/
);

// Normalize context keys (Windows + Unix safe)
function normalizeContextKey(key: string) {
  return key
    .replace(/^\.\//, "")
    .replace(/^\.\\/, "")
    .replace(/\\/g, "/")
    .replace(/\.tsx$/, "");
}

const AUTO_TSX_MAP: Record<string, () => Promise<any>> = {};

tsxContext.keys().forEach((key) => {
  const normalized = normalizeContextKey(key);
  AUTO_TSX_MAP[normalized] = () => Promise.resolve(tsxContext(key));
});

businessContext.keys().forEach((key) => {
  const normalized = normalizeContextKey(key);
  AUTO_TSX_MAP[`(live) Business/${normalized}`] = () => Promise.resolve(businessContext(key));
});


/* ------------------------------------------------------------
   🔑 RESOLVER — exact match + (live) Business fallback for short paths
------------------------------------------------------------ */
const EXPLICIT_TSX_MAP: Record<string, () => Promise<any>> = {
  "(live) Business/Container_Creations/ContainerCreationsWebsite": () =>
    import("@/business/Container_Creations/ContainerCreationsWebsite"),
};

function resolveTsxScreen(path: string) {
  const normalized = path
    .replace(/^tsx:/, "")
    .replace(/\\/g, "/")
    .trim();

  if (EXPLICIT_TSX_MAP[normalized]) {
    return nextDynamic(EXPLICIT_TSX_MAP[normalized], { ssr: false });
  }

  if (AUTO_TSX_MAP[normalized]) {
    return nextDynamic(AUTO_TSX_MAP[normalized], { ssr: false });
  }

  const businessPath = `(live) Business/${normalized}`;
  if (AUTO_TSX_MAP[businessPath]) {
    return nextDynamic(AUTO_TSX_MAP[businessPath], { ssr: false });
  }

  if (EXPLICIT_TSX_MAP[businessPath]) {
    return nextDynamic(EXPLICIT_TSX_MAP[businessPath], { ssr: false });
  }

  return null;
}


export default function DevPage() {
  const searchParams = useSearchParams();
  const screen = searchParams.get("screen");

  useEffect(() => {
    console.log("[MOUNT]", "DevPage");
    return () => console.log("[UNMOUNT]", "DevPage");
  }, []);

  // 🔑 TOP-LEVEL LOGGING: Track URL, screen param, and remount status
  const currentUrl = typeof window !== "undefined" ? window.location.href : "SSR";
  const [lastScreen, setLastScreen] = useState<string | null>(null);
  const [remountCount, setRemountCount] = useState(0);

  useEffect(() => {
    if (screen && typeof window !== "undefined") {
      sessionStorage.setItem("dev_last_screen", screen);
    }
  }, [screen]);

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
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

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
  const phoneFrameEnabled = useSyncExternalStore(subscribePhoneFrameEnabled, getPhoneFrameEnabled, getPhoneFrameEnabled);
  const devicePreviewMode = useSyncExternalStore(subscribeDevicePreviewMode, getDevicePreviewMode, getDevicePreviewMode);

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

  // ——— All hooks below run unconditionally on every render (no early returns above). ———
  const hashJson = (obj: any) => {
    if (!obj) return "empty";
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i) | 0;
    return Math.abs(hash).toString(36);
  };
  const screenKey = screen ? screen.replace(/[^a-zA-Z0-9]/g, "-") : (json ? `screen-${hashJson(json)}` : "screen-loading");
  const layoutFromState = useMemo(
    () => getLayoutOverridesFromState(screenKey),
    [screenKey, stateSnapshot?.layoutByScreen?.[screenKey]]
  );
  const sectionLayoutPresetFromState = layoutFromState.section;
  const cardLayoutPresetFromState = layoutFromState.card;
  const organInternalLayoutFromState = layoutFromState.organ;
  const organInternalLayoutOverrides =
    Object.keys(organInternalLayoutFromState).length > 0
      ? organInternalLayoutFromState
      : getOrganInternalLayoutOverridesForScreen(screenKey);

  const effectiveTemplateId =
    stateSnapshot?.values?.templateId ??
    (layoutSnapshot as { templateId?: string })?.templateId ??
    null;
  const effectiveLayoutMode = layoutModeFromState ?? (layoutSnapshot as { mode?: "template" | "custom" })?.mode ?? "template";
  const experienceProfile = getExperienceProfile(experience);
  const templateProfile = getTemplateProfile(effectiveTemplateId);

  // LAYOUT INVESTIGATION: Log template profile data and validate defaultSectionLayoutId
  if (process.env.NODE_ENV === "development" && templateProfile) {
    const hasDefaultLayout = !!templateProfile.defaultSectionLayoutId;
    const defaultLayout = templateProfile.defaultSectionLayoutId ?? "(MISSING - will fallback to undefined)";
    const sectionRoles = Object.keys(templateProfile.sections ?? {});
    
    console.log("[LAYOUT INVESTIGATION] Template Profile", {
      templateId: effectiveTemplateId,
      templateLabel: templateProfile.label,
      defaultSectionLayoutId: defaultLayout,
      hasDefaultLayout,
      validation: hasDefaultLayout ? "✓ HAS default" : "✗ MISSING default",
      containerWidth: templateProfile.containerWidth ?? "(none)",
      sectionRoles: sectionRoles.length > 0 ? sectionRoles : "(none)",
      totalSectionRoles: sectionRoles.length,
      note: hasDefaultLayout 
        ? "Template provides default layout for sections without explicit layout"
        : "WARNING: Template has no default - sections without layout will be undefined",
    });
    
    // Warn if template forces all sections to same layout via default
    if (hasDefaultLayout && defaultLayout !== "(MISSING - will fallback to undefined)") {
      console.log("[LAYOUT INVESTIGATION] Template Default Layout Impact", {
        templateId: effectiveTemplateId,
        defaultLayout,
        impact: "Sections without explicit 'layout' field will use this default",
        note: "This is expected behavior - JSON can override with explicit layout field",
      });
    }
  } else if (process.env.NODE_ENV === "development") {
    console.log("[LAYOUT INVESTIGATION] Template Profile", {
      templateId: effectiveTemplateId,
      status: "NOT FOUND",
      impact: "No template default available - sections must have explicit layout or will be undefined",
    });
  }

  const stylingOverride = stateSnapshot?.values?.stylingPreset as string | undefined;
  const effectiveProfile = useMemo(
    () => {
      if (!templateProfile) return { ...experienceProfile, mode: effectiveLayoutMode };
      const base = {
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
      base.visualPreset = stylingOverride ?? templateProfile.visualPreset;
      return base;
    },
    [experience, effectiveTemplateId, effectiveLayoutMode, experienceProfile, templateProfile, stylingOverride]
  );

  console.log("PROFILE_FINAL", {
    behavior: stateSnapshot?.values?.behaviorProfile,
    palette: paletteName,
    template: effectiveProfile?.id,
    widthByRole: effectiveProfile?.widthByRole,
  });

  const sectionLayoutPresetOverrides = useMemo(
    () =>
      Object.keys(sectionLayoutPresetFromState).length > 0
        ? sectionLayoutPresetFromState
        : getOverridesForScreen(screenKey),
    [screenKey, sectionLayoutPresetFromState]
  );
  const cardLayoutPresetOverrides = useMemo(
    () =>
      Object.keys(cardLayoutPresetFromState).length > 0
        ? cardLayoutPresetFromState
        : getCardOverridesForScreen(screenKey),
    [screenKey, cardLayoutPresetFromState]
  );

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
    console.log("[page] 📍 SCREEN LOAD EFFECT TRIGGERED", {
      currentURL: typeof window !== "undefined" ? window.location.href : "SSR",
      screenParam: screen,
      searchParamsString: typeof window !== "undefined" ? window.location.search : "SSR",
      timestamp: Date.now(),
    });

    if (!screen) {
      const flowParam = searchParams.get("flow");
      if (flowParam) {
        const engineViewerPath = "tsx:(live) Business/onboarding/FlowViewer";
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
            setError(err?.message || "Failed to load FlowViewer");
            setJson(null);
            setTsxMeta(null);
            setTsxComponent(null);
          });
        return;
      }

      try {
        const { flow, content } = resolveLandingPage();

        if (content) {
          const landingPageContent = {
            ...content,
            flow,
            root: {
              type: "json-skin",
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


    setJson(null);
    setTsxMeta(null);
    setTsxComponent(null);
    setError(null);

    // Short paths → treat as TSX so loadScreen returns tsx-screen descriptor
    const pathToLoad = (() => {
      if (!screen) return screen;
      if (screen.startsWith("tsx:")) return screen;
      if (screen.startsWith("onboarding/")) return `tsx:${screen}`;
      // Container Creations website: URL often has Container_Creations/ContainerCreationsWebsite without tsx: prefix
      if (screen === "Container_Creations/ContainerCreationsWebsite" || screen.replace(/\\/g, "/") === "Container_Creations/ContainerCreationsWebsite") {
        return "tsx:(live) Business/Container_Creations/ContainerCreationsWebsite";
      }
      return screen;
    })();

    loadScreen(pathToLoad)
      .then((data) => {
        console.log("[page] ✅ SCREEN LOADED", {
          screenPath: screen,
          pathToLoad,
          dataType: data?.__type,
          hasJson: !!data && !data.__type,
          timestamp: Date.now(),
        });

        const tsxPath = typeof data?.path === "string" ? data.path : data?.screen;
        if (data?.__type === "tsx-screen" && typeof tsxPath === "string") {
          const C = resolveTsxScreen(tsxPath);
          if (!C) {
            setError(`TSX screen not found: ${tsxPath}`);
            setTsxMeta(null);
            setTsxComponent(null);
            setJson(null);
            return;
          }
          setTsxMeta({ path: tsxPath });
          setTsxComponent(() => C);
          setJson(null);
          setError(null);
          return;
        }

        const isContainerCreations = (s: string | null) =>
          s != null && s.replace(/\\/g, "/") === "Container_Creations/ContainerCreationsWebsite";
        if (isContainerCreations(screen) && data?.title === "Screen unavailable") {
          const forcedPath = "(live) Business/Container_Creations/ContainerCreationsWebsite";
          const C = resolveTsxScreen(forcedPath);
          if (C) {
            setTsxMeta({ path: forcedPath });
            setTsxComponent(() => C);
            setJson(null);
            setError(null);
            return;
          }
        }

        setJson(data);
        
        if (process.env.NODE_ENV === "development" && data) {
          const validation = validateScreenJson(screen, data);
          logScreenJsonValidation(validation);
        }
        
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


  if (error) {
    setDevSidebarProps(null);
    return <div style={{ color: "red" }}>{error}</div>;
  }

  if (!mounted) {
    setDevSidebarProps(null);
    return <div style={{ padding: 40, color: "var(--color-text-secondary)" }}>Loading…</div>;
  }

  const overlay = null;


  if (TsxComponent) {
    // Do not clear the store here: TSX screens (e.g. ContainerCreationsWebsite) set
    // websiteScreenPath/websiteNodeOrder for the Nodes panel. Clearing on every render
    // caused the Nodes panel to lose recognition after opening another sidebar view.
    const screenPath = tsxMeta?.path ? (tsxMeta.path.startsWith("tsx:") ? tsxMeta.path : `tsx:${tsxMeta.path}`) : "tsx:HiClarify/HiClarifyOnboarding";
    return (
      <>
        {overlay}
        <PreviewStage>
          <Suspense fallback={<div style={{ padding: 40 }}>Loading screen…</div>}>
            <TSXScreenWithEnvelope screenPath={screenPath} Component={TsxComponent} />
          </Suspense>
        </PreviewStage>
      </>
    );
  }


  if (!json) {
    setDevSidebarProps(null);
    return <div>Loading…</div>;
  }

  let renderNode =
    json?.root ??
    json?.screen ??
    json?.node ??
    json;

  const rawChildren = Array.isArray(renderNode?.children) ? renderNode.children : [];
  const children = assignSectionInstanceKeys(rawChildren);
  const docForOrgans = { meta: { domain: "offline", pageId: "screen", version: 1 }, nodes: children };
  const expandedDoc = expandOrgansInDocument(docForOrgans as any, loadOrganVariant, organInternalLayoutOverrides);
  if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
    const slotKeysAfterExpand: string[] = [];
    function collectSlotKeys(nodes: any[]): void {
      if (!Array.isArray(nodes)) return;
      for (const n of nodes) {
        if (n && typeof n === "object" && (n as any).type === "slot" && typeof (n as any).slotKey === "string") slotKeysAfterExpand.push((n as any).slotKey);
        if (Array.isArray((n as any)?.children)) collectSlotKeys((n as any).children);
      }
    }
    if (Array.isArray((expandedDoc as any)?.nodes)) collectSlotKeys((expandedDoc as any).nodes);
    if (Array.isArray((expandedDoc as any)?.regions)) (expandedDoc as any).regions.forEach((r: any) => collectSlotKeys(r?.nodes ?? []));
    console.log("[page] DEV after expandOrgansInDocument — slotKeys present", slotKeysAfterExpand);
  }
  const data = json?.data ?? {};
  if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
    console.log("[page] DEV before applySkinBindings — keys of json.data", Object.keys(data));
  }
  const boundDoc = applySkinBindings(expandedDoc as any, data);
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
  if (typeof process !== "undefined" && process.env.NODE_ENV === "development" && hasLayoutNodeType(composed)) {
    console.error(
      "[page] Screen JSON must not contain layout node types (Grid/Row/Column/Stack). Use params.moleculeLayout or layout metadata. Auto-rewriting at load."
    );
    treeForRender = collapseLayoutNodes(composed) as typeof composed;
  }

  const currentTemplateId = effectiveTemplateId;
  const screenContainerKey = `screen-${screenKey}-${currentTemplateId || "default"}`;

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
  let { sectionKeys: sectionKeysFromTree, sectionByKey } = collectSectionKeysAndNodes(treeForRender?.children ?? []);
  if (sectionKeysFromTree.length === 0 && treeForRender != null) {
    console.warn("AUTO_SECTION_WRAP_TRIGGERED");
    const wrapped = {
      type: "section",
      id: "auto-root",
      children: Array.isArray(treeForRender.children) ? treeForRender.children : [treeForRender],
    } as typeof treeForRender;
    treeForRender = wrapped;
    sectionKeysFromTree = ["auto-root"];
    sectionByKey = { "auto-root": wrapped };
  }
  const sectionKeysForPreset = sectionKeysFromTree;
  sectionKeysRef.current = sectionKeysForPreset;
  const sectionLabels = collectSectionLabels(sectionKeysForPreset, sectionByKey);
  const sectionLayoutIds = getSectionLayoutIds();
  const sectionPresetOptions: Record<string, string[]> = {};
  sectionKeysForPreset.forEach((k) => {
    sectionPresetOptions[k] = sectionLayoutIds;
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

  console.log("[page] 🔑 JsonRenderer KEY RESOLVED", {
    currentURL: typeof window !== "undefined" ? window.location.href : "SSR",
    screenPath: screen,
    resolvedKey: screenKey,
    jsonId: json?.id,
    previousKey: lastScreen ? lastScreen.replace(/[^a-zA-Z0-9]/g, "-") : null,
    willRemount: lastScreen !== screen,
    note: screen ? "✅ Using screen path" : "⚠️ Using JSON hash (screen path missing)",
  });

  const sectionLayoutPresetOverridesProp = { ...sectionLayoutPresetOverrides };
  const cardLayoutPresetOverridesProp = { ...cardLayoutPresetOverrides };

  const handleSectionLayoutPresetOverride = (sectionKey: string, presetId: string) => {
    dispatchState("layout.override", { screenKey, type: "section", sectionId: sectionKey, presetId });
    setSectionLayoutPresetOverride(screenKey, sectionKey, presetId);
    const allowedCards = getAllowedCardPresetsForSectionPreset(presetId || null);
    if (allowedCards.length > 0) {
      const currentCard = getCardOverridesForScreen(screenKey)[sectionKey] ?? "";
      if (!currentCard || !allowedCards.includes(currentCard)) {
        setCardLayoutPresetOverride(screenKey, sectionKey, allowedCards[0]);
        dispatchState("layout.override", { screenKey, type: "card", sectionId: sectionKey, presetId: allowedCards[0] });
      }
    }
  };
  const handleCardLayoutPresetOverride = (sectionKey: string, presetId: string) => {
    if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
      console.log("[page] handleCardLayoutPresetOverride", { screenKey, sectionKey, presetId });
    }
    dispatchState("layout.override", { screenKey, type: "card", sectionId: sectionKey, presetId });
    setCardLayoutPresetOverride(screenKey, sectionKey, presetId);
  };
  const handleOrganInternalLayoutOverride = (sectionKey: string, internalLayoutId: string) => {
    dispatchState("layout.override", { screenKey, type: "organ", sectionId: sectionKey, presetId: internalLayoutId });
    setOrganInternalLayoutOverride(screenKey, sectionKey, internalLayoutId);
  };

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
  
  if (process.env.NODE_ENV === "development") {
    const validation = json ? validateScreenJson(screen ?? "unknown", json) : null;
    console.log("[LAYOUT INVESTIGATION] ===== RENDER SUMMARY =====", {
      screenPath: screen ?? "(none)",
      screenKey,
      templateId: effectiveTemplateId,
      templateDefaultLayout: templateProfile?.defaultSectionLayoutId ?? "(none)",
      engineKillSwitchActive: true,
      jsonValidation: validation ? {
        totalSections: validation.sections.length,
        sectionsWithLayout: validation.sections.filter(s => s.hasLayout).length,
        sectionsWithoutLayout: validation.sections.filter(s => !s.hasLayout).length,
        uniqueLayoutsInJson: validation.uniqueLayouts,
        allSectionsHaveLayout: validation.allSectionsHaveLayout,
      } : "(no JSON)",
      overrideCounts: {
        section: Object.keys(sectionLayoutPresetOverrides).length,
        card: Object.keys(cardLayoutPresetOverrides).length,
        organ: Object.keys(organInternalLayoutOverrides).length,
      },
      note: "With DISABLE_ENGINE_LAYOUT=true, engine overrides are bypassed. Layouts come from JSON or template default only.",
    });
    console.log("[LAYOUT INVESTIGATION] ===== END SUMMARY =====");
  }
  
  const behaviorProfile = (stateSnapshot?.values?.behaviorProfile ?? "default") as string;
  const jsonContent = (
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
  );

  const sectionBackgroundPattern = (effectiveProfile as { sectionBackgroundPattern?: string } | null)?.sectionBackgroundPattern;
  const wrappedContent =
    experience === "website" ? (
      <div
        data-section-background-pattern={sectionBackgroundPattern ?? "none"}
        className={sectionBackgroundPattern === "alternate" ? "template-section-alternate" : sectionBackgroundPattern === "dark-bands" ? "template-section-dark-bands" : undefined}
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          overflowY: "visible",
        }}
      >
        {jsonContent}
      </div>
    ) : (
      jsonContent
    );

  if (experience === "app") {
    setDevSidebarProps({
      layoutPanelContent: (
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
          screenModel={treeForRender}
          defaultState={json?.state}
          profileOverride={effectiveProfile}
          screenKey={screenKey}
        />
      ),
      palettePreviewScreen: treeForRender,
      palettePreviewProps: {
        defaultState: json?.state,
        profileOverride: effectiveProfile,
        sectionLayoutPresetOverrides,
        cardLayoutPresetOverrides,
        organInternalLayoutOverrides: organInternalLayoutOverridesProp,
        screenKey,
        behaviorProfile,
        experience,
        sectionKeys: sectionKeysFromTree,
        sectionLabels,
      },
    });
    return (
      <PreviewStage>
        {overlay}
        <div
          data-proof="pure-json-app"
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "#fff",
          }}
        >
          <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
            <JsonRenderer
              node={treeForRender}
              experience="website"
              defaultState={json?.state}
              profileOverride={effectiveProfile}
              screenId={screenKey}
              behaviorProfile={behaviorProfile}
            />
          </div>
        </div>
      </PreviewStage>
    );
  }
  if (experience === "learning") {
    setDevSidebarProps({});
    return (
      <PreviewStage>
        {overlay}
        <LearningShell content={<div>{jsonContent}</div>} />
      </PreviewStage>
    );
  }
  setDevSidebarProps({
    layoutPanelContent: (
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
        screenModel={treeForRender}
        defaultState={json?.state}
        profileOverride={effectiveProfile}
        screenKey={screenKey}
      />
    ),
    palettePreviewScreen: treeForRender,
    palettePreviewProps: {
      defaultState: json?.state,
      profileOverride: effectiveProfile,
      sectionLayoutPresetOverrides,
      cardLayoutPresetOverrides,
      organInternalLayoutOverrides: organInternalLayoutOverridesProp,
      screenKey,
      behaviorProfile,
      experience,
      sectionKeys: sectionKeysFromTree,
      sectionLabels,
    },
  });
  return (
    <PreviewStage>
      {overlay}
      <WebsiteShell
        content={
          <>
            <GoogleLoginButton />
            <div ref={contentRef} style={{ width: "100%", minHeight: "100vh", overflowY: "visible" }}>
              {wrappedContent}
            </div>
          </>
        }
      />
    </PreviewStage>
  );
}
