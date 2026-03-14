"use client";
// Hook order stabilized — no conditional hooks allowed
export const dynamic = "force-dynamic";
import React, { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import nextDynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import ExperienceRenderer from "@/engine/core/ExperienceRenderer";
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
import DevNavigationPanel, { SAME_PAGE_SCREEN_ID } from "@/07_Dev_Tools/nav/DevNavigationPanel";
import { getCanonicalNavScreenKey } from "@/07_Dev_Tools/nav/nav-screen-key";
import { setNavDebug } from "@/07_Dev_Tools/nav/nav-debug-store";
import { logNavClick, logNavRender, logNavExecution, installMutationObserverForNodeIds } from "@/07_Dev_Tools/nav/nav-instrumentation";
import { getDevSidebarProps, setDevSidebarProps } from "@/app/ui/control-dock/dev-right-sidebar-store";

const DEBUG_NAV = typeof process !== "undefined" && process.env.NODE_ENV === "development" && !!(typeof window !== "undefined" && (window as any).__DEBUG_NAV__);

/** Wrapper: use screenKey from dev page when provided so panel and TsxNavCapture always share the same key. */
function DevLayoutPanelContentForTsx({ screenKey: propScreenKey }: { screenKey?: string }) {
  const searchParams = useSearchParams();
  const screen = searchParams.get("screen");
  const screenKey = propScreenKey ?? getCanonicalNavScreenKey(screen, {});
  return (
    <>
      <DevNavigationPanel screenTree={null} screenKey={screenKey} />
      <OrganPanel sectionKeysForPreset={[]} screenKey={screenKey} />
    </>
  );
}
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
import { TsxEmbedProvider } from "@/lib/tsx-embed-context";
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
  "../../01_App/Business",
  true,
  /\.tsx$/
);

const organismsContext = (require as any).context(
  "../../04_Presentation/components/organisms/tsx-organisms",
  false,
  /\.tsx$/
);
const organsContext = (require as any).context(
  "../../04_Presentation/components/organs/tsx-organs",
  false,
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

/** Resolve module to component: support both default and named exports (organisms/organs use named). */
function resolveTsxModule(mod: any, normalizedKey: string): React.ComponentType<any> {
  const name = normalizedKey.split("/").pop() ?? normalizedKey;
  return mod?.default ?? mod?.[name] ?? mod;
}

const AUTO_TSX_MAP: Record<string, () => Promise<any>> = {};

tsxContext.keys().forEach((key) => {
  const normalized = normalizeContextKey(key);
  AUTO_TSX_MAP[normalized] = () =>
    Promise.resolve(tsxContext(key)).then((m) => resolveTsxModule(m, normalized));
});

businessContext.keys().forEach((key) => {
  const normalized = normalizeContextKey(key);
  AUTO_TSX_MAP[`Business/${normalized}`] = () =>
    Promise.resolve(businessContext(key)).then((m) => resolveTsxModule(m, normalized));
});

organismsContext.keys().forEach((key: string) => {
  const normalized = normalizeContextKey(key);
  AUTO_TSX_MAP[`tsx-organisms/organisms/${normalized}`] = () =>
    Promise.resolve(organismsContext(key)).then((m) => resolveTsxModule(m, normalized));
});
organsContext.keys().forEach((key: string) => {
  const normalized = normalizeContextKey(key);
  AUTO_TSX_MAP[`tsx-organs/organs/${normalized}`] = () =>
    Promise.resolve(organsContext(key)).then((m) => resolveTsxModule(m, normalized));
});

/* 01_App *App.tsx — Christian/Prayer/PrayerApp, Learn/LearnApp, etc. */
const appContext = (require as any).context(
  "../../01_App",
  true,
  /.*\/[^/]+App\.tsx$/
);
appContext
  .keys()
  .filter((k: string) => !k.includes("/(dead)") && !k.startsWith("./_"))
  .forEach((key: string) => {
    const normalized = normalizeContextKey(key);
    AUTO_TSX_MAP[normalized] = () =>
      Promise.resolve(appContext(key)).then((m) => resolveTsxModule(m, normalized));
  });

/* ------------------------------------------------------------
   🔑 RESOLVER — exact match + Business/Christian fallback for short paths
------------------------------------------------------------ */
const EXPLICIT_TSX_MAP: Record<string, () => Promise<any>> = {
  "Business/Container_Creations/ContainerCreationsWebsite": () =>
    import("@/01_App/Business/Container_Creations/ContainerCreationsWebsite"),
  "Business/Container_Creations/ContainerCreationsLanding": () =>
    import("@/01_App/Business/Container_Creations/ContainerCreationsLanding"),
  "Christian/Discipleship/GospelDiscipleship": () =>
    import("@/01_App/Christian/Discipleship/GospelDiscipleship"),
  "Christian/Prayer/PrayerApp": () => import("@/01_App/Christian/Prayer/PrayerApp"),
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

  const businessPath = `Business/${normalized}`;
  if (AUTO_TSX_MAP[businessPath]) {
    return nextDynamic(AUTO_TSX_MAP[businessPath], { ssr: false });
  }

  if (EXPLICIT_TSX_MAP[businessPath]) {
    return nextDynamic(EXPLICIT_TSX_MAP[businessPath], { ssr: false });
  }

  const christianPath = `Christian/${normalized}`;
  if (AUTO_TSX_MAP[christianPath]) {
    return nextDynamic(AUTO_TSX_MAP[christianPath], { ssr: false });
  }
  if (EXPLICIT_TSX_MAP[christianPath]) {
    return nextDynamic(EXPLICIT_TSX_MAP[christianPath], { ssr: false });
  }

  if (typeof console !== "undefined" && console.warn) {
    console.warn("[dev resolveTsxScreen] TSX screen not found. Path:", normalized, "| Expected file: src/01_App/**/<App>App.tsx");
  }
  return null;
}

/** Wraps TSX preview and intercepts clicks on [data-node-id] when a nav target is set; dispatches "navigate" or scrolls to anchor for same-page flow. Only prevents default when a valid action (scroll or navigate) will occur. */
function TsxNavCapture({ screenKey, children }: { screenKey: string; children: React.ReactNode }) {
  const stateSnapshot = useSyncExternalStore(subscribeState, getState, getState);
  const navTargetsMap = stateSnapshot?.layoutByScreen?.[screenKey]?.navTargets;
  useLayoutEffect(() => {
    logNavRender({ screenKey, navTargetsMap, source: "tsx-capture" });
  }, [screenKey, navTargetsMap]);

  const handleClickCapture = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as Element;
      const el = target.closest?.("[data-node-id]");
      if (!el) return;
      const id = el.getAttribute("data-node-id");
      if (!id) return;
      const navTargetsMapAtClick = getState()?.layoutByScreen?.[screenKey]?.navTargets;
      const nav = navTargetsMapAtClick?.[id];
      const resolvedNavTarget = nav ? { toScreenId: nav.toScreenId, toAnchor: nav.toAnchor } : undefined;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7e15e045-3112-419f-8116-3226c0884ac1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'22d4f7'},body:JSON.stringify({sessionId:'22d4f7',hypothesisId:'H1,H2,H5',location:'dev/page.tsx:TsxNavCapture',message:'CLICK breakpoint line ~208',data:{stage:'CLICK_CAPTURE',screenKey,id,dataNodeId:id,navTargetsMapKeys:navTargetsMapAtClick?Object.keys(navTargetsMapAtClick):[],resolvedNavTarget},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      logNavClick({
        screenKey,
        elementId: id,
        navTargetsMap: navTargetsMapAtClick ?? undefined,
        resolvedNavTarget: resolvedNavTarget ?? undefined,
        navTargetsMapEntryUsed: resolvedNavTarget ?? undefined,
        eventPath: {
          targetTag: target?.tagName ?? "",
          targetId: (target as HTMLElement)?.id ?? "",
          closestNodeId: id,
        },
      });
      if (DEBUG_NAV && typeof console !== "undefined" && console.log) {
        console.log("[NavDebug] TsxNavCapture read on click", { screenKey, elementId: id, resolvedNavTarget });
      }
      const clickData = { id, screenKey, navFound: !!nav, toScreenId: nav?.toScreenId, toAnchor: nav?.toAnchor, allKeys: navTargetsMap ? Object.keys(navTargetsMap) : [] };
      setNavDebug({ type: "click", id, screenKey, navFound: !!nav, toScreenId: nav?.toScreenId, toAnchor: nav?.toAnchor, allKeys: navTargetsMap ? Object.keys(navTargetsMap) : [] });
      fetch('http://127.0.0.1:7242/ingest/7e15e045-3112-419f-8116-3226c0884ac1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ea7e9f'},body:JSON.stringify({sessionId:'ea7e9f',hypothesisId:'H2,H5',location:'dev/page.tsx:TsxNavCapture',message:'click on data-node-id',data:clickData,timestamp:Date.now()})}).catch(()=>{});
      if (typeof console !== "undefined" && console.log) console.log("[NavDebug] CLICK", clickData);
      if (!nav) return;

      logNavExecution(screenKey, id, { toScreenId: nav.toScreenId, toAnchor: nav.toAnchor });

      if (nav.toScreenId === SAME_PAGE_SCREEN_ID && nav.toAnchor) {
        const target = document.querySelector(nav.toAnchor);
        if (target) {
          e.preventDefault();
          e.stopPropagation();
          target.scrollIntoView({ behavior: "smooth" });
        }
        return;
      }

      if (nav.toScreenId) {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(
          new CustomEvent("navigate", {
            detail: { toScreenId: nav.toScreenId, toAnchor: nav.toAnchor },
          })
        );
        return;
      }
    },
    [screenKey]
  );
  return (
    <div onClickCapture={handleClickCapture} style={{ display: "contents" }}>
      {children}
    </div>
  );
}

export default function DevPage() {
  const router = useRouter();
  const pathname = usePathname();
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
  const [screenError, setScreenError] = useState<
    { code: "FILE_NOT_FOUND"; resolvedPath: string } | { code: "JSON_PARSE"; message: string } | null
  >(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [sectionHeights, setSectionHeights] = useState<Record<string, number>>({});
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionKeysRef = useRef<string[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Set Layout panel content for TSX screens; pass screenKey from dev page so panel and TsxNavCapture use the exact same key (no drift).
  // Preserve existing sidebar state (landingScreenPath, landingConfig, websiteNodeOrder, etc.) when updating layoutPanelContent.
  useEffect(() => {
    if (!TsxComponent) return;
    const navScreenKey = getCanonicalNavScreenKey(screen, {});
    const current = getDevSidebarProps() ?? {};
    setDevSidebarProps({
      ...current,
      layoutPanelContent: <DevLayoutPanelContentForTsx screenKey={navScreenKey} />,
    });
  }, [TsxComponent, screen]);

  // Runtime trace: watch DOM for [data-node-id] add/remove/duplicate when TSX is shown
  useEffect(() => {
    if (TsxComponent && typeof document !== "undefined") {
      installMutationObserverForNodeIds(document.body);
    }
  }, [TsxComponent]);

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
  const screenKey = screen ? getCanonicalNavScreenKey(screen, {}) : (json ? getCanonicalNavScreenKey(null, { json }) : "screen-loading");
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
        const engineViewerPath = "tsx:Business/onboarding/FlowViewer";
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
            setScreenError(null);
          })
          .catch((err) => {
            setError(err?.message || "Failed to load FlowViewer");
            setJson(null);
            setTsxMeta(null);
            setTsxComponent(null);
            setScreenError(null);
          });
        return;
      }

      try {
        const { flow, content } = resolveLandingPage();

        if (content) {
          setScreenError(null);
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
      setScreenError(null);
      return;
    }


    setJson(null);
    setTsxMeta(null);
    setTsxComponent(null);
    setError(null);
    setScreenError(null);

    const screenParamDecoded = (() => {
      try {
        return screen ? decodeURIComponent(screen) : "";
      } catch {
        return screen ?? "";
      }
    })();

    // Short paths → treat as TSX so loadScreen returns tsx-screen descriptor
    const pathToLoad = (() => {
      if (!screenParamDecoded) return screenParamDecoded;
      if (screenParamDecoded.startsWith("tsx:")) return screenParamDecoded;
      if (screenParamDecoded.startsWith("onboarding/")) return `tsx:${screenParamDecoded}`;
      // Container Creations: short path without tsx: prefix
      const ccPath = screenParamDecoded.replace(/\\/g, "/");
      if (ccPath === "Container_Creations/ContainerCreationsWebsite") {
        return "tsx:Business/Container_Creations/ContainerCreationsWebsite";
      }
      if (ccPath === "Container_Creations/ContainerCreationsLanding") {
        return "tsx:Business/Container_Creations/ContainerCreationsLanding";
      }
      if (ccPath === "Gospel/Discipleship/GospelDiscipleship") {
        return "tsx:Christian/Discipleship/GospelDiscipleship";
      }
      if (ccPath === "Prayer_Stream/PrayerStreamOnboarding") {
        return "tsx:Business/Prayer_Stream/PrayerStreamOnboarding";
      }
      return screenParamDecoded;
    })();

    // Sync URL when we rewrite to a tsx: path so the navigator pill and address bar show .tsx
    if (pathToLoad && pathToLoad !== screenParamDecoded) {
      const next = new URLSearchParams(searchParams);
      next.set("screen", pathToLoad);
      router.replace(`${pathname ?? "/dev"}?${next.toString()}`);
      return;
    }

    loadScreen(pathToLoad)
      .then((data) => {
        console.log("[page] ✅ SCREEN LOADED", {
          screenPath: screen,
          pathToLoad,
          dataType: data?.__type,
          hasJson: !!data && !data.__type,
          timestamp: Date.now(),
        });

        if (data?.__type === "screen-error") {
          if (data.code === "FILE_NOT_FOUND") {
            setScreenError({ code: "FILE_NOT_FOUND", resolvedPath: data.resolvedPath ?? pathToLoad });
          } else if (data.code === "JSON_PARSE") {
            setScreenError({ code: "JSON_PARSE", message: data.message ?? "Invalid JSON" });
          }
          setJson(null);
          setTsxMeta(null);
          setTsxComponent(null);
          setError(null);
          return;
        }

        const tsxPath = typeof data?.path === "string" ? data.path : data?.screen;
        if (data?.__type === "tsx-screen" && typeof tsxPath === "string") {
          const C = resolveTsxScreen(tsxPath);
          if (!C) {
            setError(`TSX screen not found: ${tsxPath}`);
            setTsxMeta(null);
            setTsxComponent(null);
            setJson(null);
            setScreenError(null);
            return;
          }
          setTsxMeta({ path: tsxPath });
          setTsxComponent(() => C);
          setJson(null);
          setError(null);
          setScreenError(null);
          return;
        }

        const isContainerCreations = (s: string | null) =>
          s != null && s.replace(/\\/g, "/") === "Container_Creations/ContainerCreationsWebsite";
        if (isContainerCreations(screenParamDecoded) && data?.title === "Screen unavailable") {
          const forcedPath = "Business/Container_Creations/ContainerCreationsWebsite";
          const C = resolveTsxScreen(forcedPath);
          if (C) {
            setTsxMeta({ path: forcedPath });
            setTsxComponent(() => C);
            setJson(null);
            setError(null);
            setScreenError(null);
            return;
          }
        }

        setJson(data);
        setScreenError(null);

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
        setScreenError(null);
      });
  }, [screen, searchParams]);


  if (screenError) {
    setDevSidebarProps(null);
    if (screenError.code === "FILE_NOT_FOUND") {
      return <div style={{ color: "red" }}>SCREEN FILE NOT FOUND: {screenError.resolvedPath}</div>;
    }
    if (screenError.code === "JSON_PARSE") {
      return (
        <div style={{ padding: 16 }}>
          <pre>{JSON.stringify(screenError.message)}</pre>
        </div>
      );
    }
  }

  if (error) {
    setDevSidebarProps(null);
    return <div style={{ color: "red" }}>{error}</div>;
  }

  if (!mounted) return <div style={{ minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--editor-text-muted, #64748b)" }} aria-hidden>Loading…</div>;

  const overlay = null;
  const behaviorProfile = (stateSnapshot?.values?.behaviorProfile ?? "default") as string;

  if (TsxComponent) {
    const screenPath = tsxMeta?.path ? (tsxMeta.path.startsWith("tsx:") ? tsxMeta.path : `tsx:${tsxMeta.path}`) : "tsx:HiClarify/HiClarifyOnboarding";
    const resolvedPathForEnvelope = screenPath.replace(/^tsx:/, "").trim();
    const EnvelopeWrapped = () => (
      <TSXScreenWithEnvelope screenPath={resolvedPathForEnvelope} Component={TsxComponent} />
    );
    const screenKey = getCanonicalNavScreenKey(screen, {});
    const syntheticTree = { type: "json-skin", id: "tsx-wrapper", children: [{ type: "tsx-embed", params: { path: screenPath }, children: [] }] };
    const treeForRenderTsx = composeOfflineScreen({
      rootNode: syntheticTree as any,
      experienceProfile: effectiveProfile,
      layoutState: { ...layoutSnapshot, experience, templateId: effectiveTemplateId, mode: effectiveLayoutMode },
    });
    setCurrentScreenTree(treeForRenderTsx);
    const tsxEmbedValue = { getComponent: (path: string) => (path === screenPath ? EnvelopeWrapped : null) };
    const jsonContentTsx = (
      <ExperienceRenderer
        key={`tsx-${screenPath}`}
        node={treeForRenderTsx}
        defaultState={{}}
        profileOverride={effectiveProfile}
        sectionLayoutPresetOverrides={sectionLayoutPresetOverrides}
        cardLayoutPresetOverrides={cardLayoutPresetOverrides}
        organInternalLayoutOverrides={organInternalLayoutOverrides}
        screenId={screenKey}
        behaviorProfile={behaviorProfile}
        experience={experience}
        sectionKeys={["tsx-embed"]}
        sectionLabels={{ "tsx-embed": "TSX Screen" }}
      />
    );
    return (
      <>
        {overlay}
        <PreviewStage>
          <TsxNavCapture screenKey={screenKey}>
            <TsxEmbedProvider value={tsxEmbedValue}>
              {jsonContentTsx}
            </TsxEmbedProvider>
          </TsxNavCapture>
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
  const globalPalette = stateSnapshot?.values?.paletteName as string | undefined;
  if (treeForRender != null && (globalPalette != null || (json as { palette?: string })?.palette != null)) {
    treeForRender = { ...treeForRender, palette: globalPalette ?? (json as { palette?: string })?.palette };
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
        <>
          <DevNavigationPanel screenTree={treeForRender} screenKey={screenKey} />
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
        </>
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
            width: "100%",
            maxWidth: "none",
            padding: 0,
            minHeight: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
            {jsonContent}
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
      <>
        <DevNavigationPanel screenTree={treeForRender} screenKey={screenKey} />
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
      </>
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
