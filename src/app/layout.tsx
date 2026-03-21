"use client";
// CONTRACT:
// Palette = visual only
// Layout = structural only
// Palette must never mutate layout config, dropdowns, or layout persistence.
// / = user app only (no navigator/chrome). /dev = full builder with navigator and tools.
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";

import "@/styles/site-theme.css";
import "@/styles/dev-mobile.css";
import "@/styles/navigator-density.css";
import { getBaseUrl } from "@/lib/app-base-url";
import { getDomainSegmentForHost } from "@/lib/domain-config";
import { getCanonicalScreenKey } from "@/07_Dev_Tools/navigation/getDevScreenKey";
import DevicePreviewToggle from "@/dev/DevicePreviewToggle";
import EditorPreviewToggle from "@/07_Dev_Tools/editor/EditorPreviewToggle";
import VerticalSpacingReport from "@/diagnostics/VerticalSpacingReport";
import PipelineDiagnosticsRail from "@/app/ui/control-dock/PipelineDiagnosticsRail";
import RightFloatingSidebar from "@/app/ui/control-dock/RightFloatingSidebar";
import { getPhoneFrameEnabled, subscribePhoneFrameEnabled } from "@/dev/phone-frame-store";
import { getDevicePreviewMode, subscribeDevicePreviewMode } from "@/dev/device-preview-store";
import { getDevMode, setDevMode, subscribeDevMode } from "@/dev/dev-mode-store";

/** Stage is always full viewport width; device icons do not resize container (breakpoint simulation only). */

/* ============================================================
   🎨 PALETTE ENGINE (state is source of truth; palette-store used only as fallback)
============================================================ */
import { getPaletteName } from "@/engine/core/palette-store";
import { usePaletteCSS } from "@/lib/site-renderer/palette-bridge";


/* ============================================================
   🧱 LAYOUT ENGINE (state is source of truth; layout-store used only as fallback)
============================================================ */
import { getLayout, subscribeLayout, type LayoutMode } from "@/engine/core/layout-store";
import { getCurrentScreenTree } from "@/engine/core/current-screen-tree-store";
import { buildTemplateFromTree, serializeTemplateProfile } from "@/lib/layout/save-current-as-template";


/* ============================================================
   📐 TEMPLATE PROFILES (layout + preset override)
============================================================ */
import { getTemplateList } from "@/lib/layout/template-profiles";

/* ============================================================
   🧠 STATE (PHASE B: INTERNAL VIEW NAV)
============================================================ */
import { dispatchState, getState, subscribeState } from "@/state/state-store";


/* ============================================================
   🧠 BEHAVIOR LISTENER
============================================================ */
import { installBehaviorListener, type NavigatePayload } from "@/engine/core/behavior-listener";
import { goToScreen } from "@/07_Dev_Tools/nav/navigate-to-screen";
import { setScreenPaths, flattenIndexToPaths, getScreenIdByPath } from "@/07_Dev_Tools/nav/screen-registry";

/* ============================================================
   🪪 IDENTITY–AUTH BRIDGE (System7.identity when auth capability on)
============================================================ */
import { installIdentityAuthBridge } from "@/engine/system7/identity-auth-bridge";
import { installCapabilityDebug } from "@/03_Runtime/capability/capability-debug";
import { SessionProvider } from "next-auth/react";


/* ============================================================
   📐 EXPERIENCE PROFILES (single JSON authority)
============================================================ */
import presentationProfiles from "@/lib/layout/presentation-profiles.json";
import CascadingScreenMenu, { type ScreensIndex, type FlowIndexEntry } from "@/app/components/CascadingScreenMenu";
import GoogleLoginButton from "@/app/components/GoogleLoginButton";
import OSBCaptureModal from "@/app/components/OSBCaptureModal";
import { BottomNavOnly } from "@/04_Presentation/shells/GlobalAppSkin";
import BottomNavBar_Text from "@/04_Presentation/shells/BottomNavBar_Text";
import { NAV_STRIP_HEIGHT } from "@/app/shell-ui-constants";
import dynamic from "next/dynamic";
import MobileLayout from "@/mobile/MobileLayout";

/** Load only on client to avoid pulling @capacitor into server bundle (vendor-chunks resolution fails in SSR). */
const MobileShell = dynamic(() => import("@/mobile/MobileShell"), { ssr: false });
import OsbMinimalTopBar from "@/04_Presentation/shells/OsbMinimalTopBar";
import { useDevMobileMode } from "@/app/dev/useDevMobileMode";
import DevHome from "@/app/dev/DevHome";

/**
 * Middleware rewrites custom domains to /{hostname}/... where a segment looks like a FQDN (contains ".").
 * Any such segment must bypass UserLayoutChrome — do not rely only on the *first* segment (locale/basePath
 * prefixes can push the host to segment 2+).
 */
function pathnameHasHostStyleSegment(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname.split("/").some((seg) => seg.length > 0 && seg.includes("."));
}

/** Legacy: first segment only + allowlist via getDomainSegmentForHost (stricter; used for diagnostics). */
function isDomainRoutePathname(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const first = pathname.split("/").filter(Boolean)[0] ?? "";
  if (!first.includes(".")) return false;
  return getDomainSegmentForHost(first) !== null;
}

/* ============================================================
   🔒 STATIC REGISTRIES
============================================================ */
const PALETTES = [
  "default",
  "premium",
  "crazy",
  "dark",
  "kids",
  "playful",
  "elderly",
  "french",
  "spanish",
];


const EXPERIENCES: Record<string, any> = {
  website: (presentationProfiles as Record<string, any>).website,
  app: (presentationProfiles as Record<string, any>).app,
  learning: (presentationProfiles as Record<string, any>).learning,
};

const FALLBACK_SCREENS_INDEX: ScreensIndex[] = [];

function RootLayoutBody({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [index, setIndex] = useState<ScreensIndex[]>([]);
  const [flowsIndex, setFlowsIndex] = useState<FlowIndexEntry[]>([]);
  const [urlReady, setUrlReady] = useState(false);
  useEffect(() => {
    setUrlReady(true);
  }, []);

  const currentScreen = urlReady ? (getCanonicalScreenKey(searchParams) ?? "") : "";
  const devMobileMode = useDevMobileMode();

  const stateSnapshot = useSyncExternalStore(subscribeState, getState, getState);
  const layoutSnapshot = useSyncExternalStore(subscribeLayout, getLayout, getLayout);
  const phoneFrameEnabled = useSyncExternalStore(subscribePhoneFrameEnabled, getPhoneFrameEnabled, getPhoneFrameEnabled);
  const devicePreviewMode = useSyncExternalStore(subscribeDevicePreviewMode, getDevicePreviewMode, getDevicePreviewMode);
  const devMode = useSyncExternalStore(subscribeDevMode, getDevMode, getDevMode);
  const templateList = getTemplateList();

  // Do not auto-attach bottom nav for onboarding / Google-style / OsbHomeV2; clean stage rules (no play button + icons strip, neutral bg, no extra maxWidth)
  const isOnboardingTsx = /HiClarifyOnboarding|onboarding|HiClarify\/HiClarifyOnboarding|OsbHomeV2|ContainerCreationsLanding/i.test(currentScreen || "");
  const isFlowRuntimeScreen = (currentScreen ?? "").includes("FlowRuntimeScreen");

  // State is source of truth; fall back to layout-store / palette-store when key is missing
  const experience = (stateSnapshot?.values?.experience ?? (layoutSnapshot as { experience?: string })?.experience) ?? "website";
  const templateId = (stateSnapshot?.values?.templateId ?? (layoutSnapshot as { templateId?: string })?.templateId) ?? "";
  const layoutMode = (stateSnapshot?.values?.layoutMode ?? (layoutSnapshot as { mode?: LayoutMode })?.mode) ?? "template";
  const paletteName = (stateSnapshot?.values?.paletteName ?? getPaletteName()) || "default";

  const [showSections, setShowSections] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const canvasPaletteScopeRef = useRef<HTMLDivElement>(null);
  const hasHydratedDevMode = useRef(false);
  const searchParamsRef = useRef("");
  searchParamsRef.current = searchParams?.toString() ?? "";

  useEffect(() => {
    console.log("[MOUNT]", "RootLayout");
    installIdentityAuthBridge();
    installCapabilityDebug();
    return () => console.log("[UNMOUNT]", "RootLayout");
  }, []);

  /* DEV_MOBILE_MODE: apply mobile dev layout when viewport < 768px (layout/CSS only) */
  useEffect(() => {
    if (devMobileMode) {
      document.body.classList.add("dev-mobile-mode");
    } else {
      document.body.classList.remove("dev-mobile-mode");
    }
    return () => document.body.classList.remove("dev-mobile-mode");
  }, [devMobileMode]);

  /* Nav compact desktop: apply when viewport > 1024px (density only, no logic change) */
  const [navCompactDesktop, setNavCompactDesktop] = useState(false);
  useEffect(() => {
    const mq = typeof window !== "undefined" ? window.matchMedia("(min-width: 1025px)") : null;
    if (!mq) return;
    const apply = () => setNavCompactDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    console.log("[layout.tsx] phoneFrameEnabled changed to:", phoneFrameEnabled);
  }, [phoneFrameEnabled]);

  /*
   * ACCEPTANCE TESTS (manual):
   * 1. User->Dev click: In User mode click floating "Dev"; chrome stays visible, no revert to User.
   * 2. Dev->User click: In Dev mode click "User"; chrome disappears, floating Dev appears, no revert to Dev.
   * 3. Screen change preserves mode: In Dev mode pick another screen from menu; URL has mode=dev, chrome stays.
   * 4. Behavior navigation preserves mode: Navigate via behavior listener to a screen; URL includes current mode.
   * 5. Refresh preserves mode: Load /dev?mode=user then refresh; still User. Load /dev?mode=dev then refresh; still Dev.
   * 6. Phone/Frame toggles: Toggle Device or Phone Frame in Dev mode; chrome does not disappear (no devMode flip).
   */
  /* ONE-TIME hydration: URL or localStorage -> store. Store is single source of truth after this. */
  useEffect(() => {
    if (hasHydratedDevMode.current) return;
    if (typeof window === "undefined") return;
    hasHydratedDevMode.current = true;
    const q = searchParams?.get("mode");
    if (q === "user" || q === "dev") {
      setDevMode(q);
    } else {
      try {
        const ls = window.localStorage.getItem("devMode");
        if (ls === "user" || ls === "dev") setDevMode(ls);
      } catch {
        /* keep default store value */
      }
    }
  }, [searchParams]);

  /* Preview content: when Dev + device mode, constrain width (tablet 834px, phone 390px, phoneGrid 2-col grid) */
  const previewContent =
    devMode === "dev" && devicePreviewMode === "tablet" ? (
      <div className="preview-tablet">{children}</div>
    ) : devMode === "dev" && devicePreviewMode === "phone" ? (
      <div className="preview-mobile">{children}</div>
    ) : devMode === "dev" && devicePreviewMode === "phoneGrid" ? (
      <div className="preview-phone-grid">{children}</div>
    ) : (
      children
    );

  /* In dev mode, apply palette only to canvas content (palette-scope); editor shell uses --editor-* vars */
  usePaletteCSS(devMode === "dev" ? canvasPaletteScopeRef : undefined);

  /* ============================================================
     🔗 DEMO: INITIAL EXPERIENCE FROM URL (seed state so dropdown reflects it)
  ============================================================ */
  useEffect(() => {
    const exp = searchParams.get("experience");
    if ((exp === "website" || exp === "app" || exp === "learning") && stateSnapshot?.values?.experience !== exp) {
      dispatchState("state.update", { key: "experience", value: exp });
    }
  }, [searchParams, stateSnapshot?.values?.experience]);

  /* ============================================================
     🔁 INSTALL BEHAVIOR ROUTER (ONCE)
     Developer workspace: screen nav goes to /dev?screen=...; preserve mode and other params.
     Screen-ID: goToScreen(router, toScreenId) for dev/user mode URLs.
  ============================================================ */
  useEffect(() => {
    installBehaviorListener((payload: NavigatePayload) => {
      const isObj = typeof payload === "object" && payload !== null && "toScreenId" in payload;
      if (isObj && payload.toScreenId) {
        goToScreen(router, payload.toScreenId, {
          anchor: payload.toAnchor,
          devMode: getDevMode(),
          currentSearch: searchParamsRef.current ?? "",
          replace: true,
        });
        return;
      }
      const to = typeof payload === "string" ? payload : (payload as { to?: string })?.to;
      if (typeof to !== "string") return;
      if (to.startsWith("|")) {
        dispatchState("state:currentView", { value: to });
        return;
      }
      if (to.startsWith("/")) {
        router.replace(to);
        return;
      }
      goToScreen(router, to, {
        devMode: getDevMode(),
        currentSearch: searchParamsRef.current ?? "",
        replace: true,
      });
    });
  }, [router]);

  /* OSB V5: center FAB opens capture modal */
  useEffect(() => {
    const openOSB = () => dispatchState("state.update", { key: "osb_modalOpen", value: true });
    window.addEventListener("osb:open", openOSB);
    return () => window.removeEventListener("osb:open", openOSB);
  }, []);


  /* ============================================================
     📂 LOAD AVAILABLE SCREENS — never throw; empty index on failure so sidebar still renders
  ============================================================ */
  useEffect(() => {
    fetch("/api/screens", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.resolve([])))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setIndex(list);
        setScreenPaths(flattenIndexToPaths(list));
      })
      .catch(() => {
        setIndex([]);
        setScreenPaths([]);
      });
  }, []);

  useEffect(() => {
    fetch("/api/flows/index", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { flows: [] }))
      .then((data) => setFlowsIndex(Array.isArray(data?.flows) ? data.flows : []))
      .catch(() => setFlowsIndex([]));
  }, []);

  return (
    <>
        <DevHome />
        {devMode === "user" && (
          <button
            type="button"
            onClick={() => {
              setDevMode("dev");
              const params = new URLSearchParams(searchParams?.toString() ?? "");
              params.set("mode", "dev"); /* always persist store value; no reliance on URL for mode */
              router.replace(`/dev?${params.toString()}`, { scroll: false });
            }}
            style={{
              position: "fixed",
              top: 12,
              right: 12,
              zIndex: 9999,
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: 600,
              color: "#fff",
              background: "#1976d2",
              border: "1px solid #1565c0",
              borderRadius: "6px",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            Dev
          </button>
        )}
        {/* Navigator: stable editor layout (TopBar + EditorBody with Rail | Canvas | Sidebar) */}
        {devMode === "dev" && (
          <div className="editor-root" style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
            <div className="app-chrome" style={{ flexShrink: 0, position: "relative", zIndex: 10000 }} role="banner">
              <div className="app-chrome-left" style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <button
                  type="button"
                  className="app-chrome-home"
                  onClick={() => router.push("/dev")}
                  title="Go to dev home"
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    font: "inherit",
                    color: "var(--editor-text)",
                    textAlign: "left",
                  }}
                >
                  <b>HIclarify Navigator</b>
                </button>
                <CascadingScreenMenu index={index} flowsIndex={flowsIndex} currentScreen={currentScreen} />
              </div>
              <div className="app-chrome-center" style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, minWidth: 0 }}>
                <DevicePreviewToggle />
              </div>
              <div className="app-chrome-right" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <EditorPreviewToggle screenPath={currentScreen || ""} />
                <button
                  type="button"
                  className="app-chrome-save"
                  onClick={() => {
                    const tree = getCurrentScreenTree();
                    if (!tree) return;
                    const screenKey = currentScreen ? currentScreen.replace(/[^a-zA-Z0-9]/g, "-") : "";
                    const navTargets = screenKey ? getState()?.layoutByScreen?.[screenKey]?.navTargets : undefined;
                    const profile = buildTemplateFromTree(tree, { navTargets });
                    const payload = { ...profile } as Record<string, unknown>;
                    delete payload.palette;
                    delete payload.paletteName;
                    const json = serializeTemplateProfile(payload as ReturnType<typeof buildTemplateFromTree>);
                    const blob = new Blob([json], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${profile.id}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  title="Download current section layouts as a template JSON file."
                >
                  Save Layout
                </button>
                <button type="button" onClick={() => setShowSections(v => !v)} title="Toggle sections report">
                  Sections ▾
                </button>
                <GoogleLoginButton />
              </div>
            </div>

            {showSections && (
              <div id="section-layout-panel" className="app-section-layout-panel" style={{ flexShrink: 0 }}>
                <VerticalSpacingReport />
              </div>
            )}

            <div className="editor-body">
              <div className="editor-left-sidebar">
                <PipelineDiagnosticsRail embedded />
              </div>
              <div
                ref={contentRef}
                className="editor-canvas-area"
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: "auto",
                  padding: 0,
                  maxWidth: "100%",
                  ...(isOnboardingTsx ? { background: "linear-gradient(135deg, #2d3436 0%, #1e272e 100%)" } : {}),
                }}
              >
                <div
                  ref={canvasPaletteScopeRef}
                  className="palette-scope"
                  style={{ minHeight: "100%", width: "100%" }}
                >
                <div
              className="app-shell"
              style={{
                width: "100%",
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                flex: 1,
                ...(isOnboardingTsx ? { background: "linear-gradient(135deg, #2d3436 0%, #1e272e 100%)" } : {}),
              }}
            >
              <div
                className="stage-center"
                style={{
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "stretch",
                  overflow: "hidden",
                }}
              >
                <div
                  className="json-stage"
                  data-json-stage
                  data-device-mode={devicePreviewMode}
                  data-current-screen={currentScreen ?? undefined}
                  style={{
                    width: "100%",
                    maxWidth: "none",
                    flex: 1,
                    minHeight: 0,
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 0, margin: 0 }}>
                    {previewContent}
                  </div>
                  {!isOnboardingTsx && !isFlowRuntimeScreen && (
                    <div
                      id="screen-ui-layer"
                      data-screen-ui-layer
                      style={{
                        flexShrink: 0,
                        width: "100%",
                        height: NAV_STRIP_HEIGHT,
                        zIndex: 50,
                      }}
                    >
                      <BottomNavBar_Text />
                    </div>
                  )}
                </div>
              </div>
            </div>
                </div>
              </div>
              <div className="editor-right-sidebar">
                <RightFloatingSidebar embedded />
              </div>
            </div>
          </div>
        )}
        {devMode === "user" && (
          <div
            ref={contentRef}
            className="app-content"
            style={{
              padding: 0,
              overflow: "visible",
              overflowX: "hidden",
              maxWidth: "100%",
            }}
          >
            <div style={{ width: "100%", minHeight: "100vh", position: "relative" }}>
              {children}
            </div>
          </div>
        )}
        <OSBCaptureModal />
        <MobileShell />
    </>
  );
}

const HOME_VIEW = "HiClarify/home/home_screen";

/** User/mobile mode (/) — minimal top bar; bottom nav hidden on home (OSB V2). */
function UserLayoutChrome({ children }: { children: React.ReactNode }) {
  usePaletteCSS();
  const router = useRouter();
  const stateSnapshot = useSyncExternalStore(subscribeState, getState, getState);
  const currentView = (stateSnapshot?.values?.currentView as string) ?? "";
  const isHomeScreen = currentView === HOME_VIEW;

  useEffect(() => {
    installBehaviorListener((payload: NavigatePayload) => {
      const isObj = typeof payload === "object" && payload !== null && "toScreenId" in payload;
      if (isObj && payload.toScreenId) {
        goToScreen(router, payload.toScreenId, { devMode: "user", anchor: payload.toAnchor, replace: true });
        return;
      }
      const to = typeof payload === "string" ? payload : (payload as { to?: string })?.to;
      if (typeof to !== "string") return;
      if (to.startsWith("|")) {
        dispatchState("state:currentView", { value: to });
        return;
      }
      if (to.startsWith("/")) {
        router.replace(to);
        return;
      }
      goToScreen(router, to, { devMode: "user", replace: true });
    });
  }, [router]);
  useEffect(() => {
    const openOSB = () => dispatchState("state.update", { key: "osb_modalOpen", value: true });
    window.addEventListener("osb:open", openOSB);
    return () => window.removeEventListener("osb:open", openOSB);
  }, []);

  return (
    <>
      <OsbMinimalTopBar />
      <MobileLayout showBottomNav={!isHomeScreen}>{children}</MobileLayout>
      <OSBCaptureModal />
    </>
  );
}

export default function RootLayout({ children }: any) {
  const pathname = usePathname();
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const first = pathname?.split("/").filter(Boolean)[0] ?? "";
    console.log("[RootLayout] chrome bypass probe", {
      pathname,
      firstSegment: first,
      getDomainSegmentForHost_firstSegment: getDomainSegmentForHost(first),
      isDomainRoutePathname: isDomainRoutePathname(pathname),
      pathnameHasHostStyleSegment: pathnameHasHostStyleSegment(pathname),
    });
  }, [pathname]);

  // If pathname is briefly undefined (client hydration), !pathname?.startsWith("/dev") is true and wrongly forced UserLayoutChrome.
  const isUserMode =
    pathname === "/" || (typeof pathname === "string" && pathname.length > 0 && !pathname.startsWith("/dev"));

  return (
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" href={`${getBaseUrl()}/icons/icon-192.png`} type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href={`${getBaseUrl()}/icons/icon-192.png`} />
        <link rel="manifest" href="/manifest" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&family=Poppins:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="app-body">
        <SessionProvider refetchInterval={0}>
          <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>}>
            {!hasMounted ? (
              children
            ) : pathname === "/landing" || pathname === "/flow" || pathname === "/onboarding" || pathname === "/container-creations" || pathname?.startsWith("/prayer") || pathname?.startsWith("/_domain") || pathname?.match(/^\/(christian|business|plan|protect|research|learn)(\/|$)/) || pathnameHasHostStyleSegment(pathname) ? (
              children
            ) : isUserMode ? (
              <UserLayoutChrome>{children}</UserLayoutChrome>
            ) : (
              <RootLayoutBody>{children}</RootLayoutBody>
            )}
          </Suspense>
        </SessionProvider>
      </body>
    </html>
  );
}

