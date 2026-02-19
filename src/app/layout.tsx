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
import DevicePreviewToggle from "@/dev/DevicePreviewToggle";
import VerticalSpacingReport from "@/diagnostics/VerticalSpacingReport";
import PipelineDiagnosticsRail from "@/app/ui/control-dock/PipelineDiagnosticsRail";
import { getPhoneFrameEnabled, subscribePhoneFrameEnabled } from "@/dev/phone-frame-store";
import { getDevicePreviewMode, subscribeDevicePreviewMode } from "@/dev/device-preview-store";

/** Stage max-width by device mode (Desktop / Tablet / Phone buttons). Locked dimensions. */
const STAGE_MAX_WIDTH_PHONE = 420;
const STAGE_MAX_WIDTH_TABLET = 768;
const STAGE_MAX_WIDTH_DESKTOP = 1100;

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
import { installBehaviorListener } from "@/engine/core/behavior-listener";

/* ============================================================
   🪪 IDENTITY–AUTH BRIDGE (System7.identity when auth capability on)
============================================================ */
import { installIdentityAuthBridge } from "@/engine/system7/identity-auth-bridge";
import { installCapabilityDebug } from "@/03_Runtime/capability/capability-debug";


/* ============================================================
   📐 EXPERIENCE PROFILES (single JSON authority)
============================================================ */
import presentationProfiles from "@/lib/layout/presentation-profiles.json";
import CascadingScreenMenu, { type ScreensIndex } from "@/app/components/CascadingScreenMenu";
import OSBCaptureModal from "@/app/components/OSBCaptureModal";
import { BottomNavOnly } from "@/04_Presentation/shells/GlobalAppSkin";
import BottomNavBar_Text from "@/04_Presentation/shells/BottomNavBar_Text";
import { NAV_STRIP_HEIGHT } from "@/app/shell-ui-constants";
import MobileShell from "@/mobile/MobileShell";
import MobileLayout from "@/mobile/MobileLayout";
import OsbMinimalTopBar from "@/04_Presentation/shells/OsbMinimalTopBar";
import { useDevMobileMode } from "@/app/dev/useDevMobileMode";
import DevHome from "@/app/dev/DevHome";

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


function RootLayoutBody({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentScreen = searchParams.get("screen") ?? "";
  const devMobileMode = useDevMobileMode();

  const [index, setIndex] = useState<ScreensIndex[]>([]);


  const stateSnapshot = useSyncExternalStore(subscribeState, getState, getState);
  const layoutSnapshot = useSyncExternalStore(subscribeLayout, getLayout, getLayout);
  const phoneFrameEnabled = useSyncExternalStore(subscribePhoneFrameEnabled, getPhoneFrameEnabled, getPhoneFrameEnabled);
  const devicePreviewMode = useSyncExternalStore(subscribeDevicePreviewMode, getDevicePreviewMode, getDevicePreviewMode);
  const templateList = getTemplateList();

  const stageMaxWidth =
    devicePreviewMode === "phone"
      ? STAGE_MAX_WIDTH_PHONE
      : devicePreviewMode === "tablet"
        ? STAGE_MAX_WIDTH_TABLET
        : STAGE_MAX_WIDTH_DESKTOP;

  // Do not auto-attach bottom nav for onboarding / Google-style / OsbHomeV2; clean stage rules (no play button + icons strip, neutral bg, no extra maxWidth)
  const isOnboardingTsx = /HiClarifyOnboarding|onboarding|HiClarify\/HiClarifyOnboarding|OsbHomeV2/i.test(currentScreen || "");

  // State is source of truth; fall back to layout-store / palette-store when key is missing
  const experience = (stateSnapshot?.values?.experience ?? (layoutSnapshot as { experience?: string })?.experience) ?? "website";
  const templateId = (stateSnapshot?.values?.templateId ?? (layoutSnapshot as { templateId?: string })?.templateId) ?? "";
  const layoutMode = (stateSnapshot?.values?.layoutMode ?? (layoutSnapshot as { mode?: LayoutMode })?.mode) ?? "template";
  const paletteName = (stateSnapshot?.values?.paletteName ?? getPaletteName()) || "default";

  const [showSections, setShowSections] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

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

  /* Apply palette to document root so app-chrome + content both inherit */
  usePaletteCSS();

  /* ============================================================
     🔗 DEMO: INITIAL EXPERIENCE FROM URL (seed state so dropdown reflects it)
  ============================================================ */
  useEffect(() => {
    const exp = searchParams.get("experience");
    if ((exp === "website" || exp === "app" || exp === "learning") && stateSnapshot?.values?.experience !== exp) {
      dispatchState("state:update", { key: "experience", value: exp });
    }
  }, [searchParams, stateSnapshot?.values?.experience]);

  /* ============================================================
     🔁 INSTALL BEHAVIOR ROUTER (ONCE)
     Developer workspace: screen nav goes to /dev?screen=...
  ============================================================ */
  useEffect(() => {
    installBehaviorListener((to: string) => {
      if (typeof to === "string" && to.startsWith("|")) {
        dispatchState("state:currentView", { value: to });
        return;
      }
      router.replace(`/dev?screen=${encodeURIComponent(to)}`);
    });
  }, [router]);

  /* OSB V5: center FAB opens capture modal */
  useEffect(() => {
    const openOSB = () => dispatchState("state.update", { key: "osb_modalOpen", value: true });
    window.addEventListener("osb:open", openOSB);
    return () => window.removeEventListener("osb:open", openOSB);
  }, []);


  /* ============================================================
     📂 LOAD AVAILABLE SCREENS
  ============================================================ */
  useEffect(() => {
    fetch("/api/screens")
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load /api/screens (${res.status})`);
        }
        return res.json();
      })
      .then(data => {
        setIndex(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error(err);
        setIndex([]);
      });
  }, []);

  return (
    <>
        <DevHome />
        {/* Navigator: no key — identity stable; palette changes only update CSS, never remount. */}
        <div className={navCompactDesktop ? "nav-compact-desktop" : undefined}>
        <div className="app-chrome">
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
              color: "inherit",
              textAlign: "left",
            }}
          >
            <b>HIclarify Navigator</b>
          </button>

          <CascadingScreenMenu index={index} currentScreen={currentScreen} />

          <span className="app-chrome-spacer" aria-hidden="true" />

          <button
            type="button"
            className="app-chrome-save"
            onClick={() => {
              const tree = getCurrentScreenTree();
              if (!tree) return;
              const profile = buildTemplateFromTree(tree);
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

          <DevicePreviewToggle />

          <span className="app-chrome-hint" title="Experience, Palette, Template: right sidebar pills." aria-hidden="true">
            Right sidebar: Experience, Palette, Template
          </span>

          <button type="button" onClick={() => setShowSections(v => !v)}>
            Sections ▾
          </button>
        </div>
        </div>


        {showSections && (
          <div id="section-layout-panel" className="app-section-layout-panel">
            <VerticalSpacingReport />
          </div>
        )}

        <div
          ref={contentRef}
          className="app-content"
          style={{
            padding: 0,
            overflow: "visible",
            ...(isOnboardingTsx ? { background: "linear-gradient(135deg, #2d3436 0%, #1e272e 100%)" } : {}),
          }}
        >
          {phoneFrameEnabled ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
                background: "#111",
                overflow: "visible",
              }}
            >
              <div
                data-phone-frame
                style={{
                  width: "390px",
                  height: "844px",
                  borderRadius: "38px",
                  background: "#000",
                  boxShadow: "0 40px 120px rgba(0,0,0,0.6)",
                  padding: "0 12px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <div
                  data-phone-frame-inner
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    borderRadius: "28px",
                    background: "#fff",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    boxSizing: "border-box",
                    maxWidth: "100%",
                  }}
                >
                  <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", padding: 0, margin: 0 }}>
                    {children}
                  </div>
                  {!isOnboardingTsx && (
                    <div
                      id="screen-ui-layer"
                      data-screen-ui-layer
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        width: "100%",
                        height: NAV_STRIP_HEIGHT,
                        zIndex: 50,
                        overflow: "visible",
                      }}
                    >
                      <BottomNavBar_Text />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div
              className="app-shell"
              style={{
                position: "relative",
                width: "100%",
                minHeight: "100vh",
                overflow: "visible",
                ...(isOnboardingTsx ? { background: "linear-gradient(135deg, #2d3436 0%, #1e272e 100%)" } : {}),
              }}
            >
              <div
                className="stage-center"
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "stretch",
                  pointerEvents: "none",
                }}
              >
                <div
                  className="json-stage"
                  data-json-stage
                  style={{
                    pointerEvents: "auto",
                    width: "100%",
                    maxWidth: isOnboardingTsx ? "none" : `min(100%, ${stageMaxWidth}px)`,
                    height: "100%",
                    minHeight: "100vh",
                    position: "relative",
                    boxSizing: "border-box",
                    overflow: "visible",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      minHeight: 0,
                      overflowY: "auto",
                      overflowX: "hidden",
                      padding: 0,
                      margin: 0,
                    }}
                  >
                    {children}
                  </div>
                  {!isOnboardingTsx && (
                    <div
                      id="screen-ui-layer"
                      data-screen-ui-layer
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        width: "100%",
                        height: NAV_STRIP_HEIGHT,
                        zIndex: 50,
                        overflow: "visible",
                      }}
                    >
                      <BottomNavBar_Text />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        {process.env.NODE_ENV === "development" && <PipelineDiagnosticsRail />}
        <OSBCaptureModal />
        <MobileShell />
    </>
  );
}

const HOME_VIEW = "HiClarify/home/home_screen";

/** User/mobile mode (/) — minimal top bar; bottom nav hidden on home (OSB V2). */
function UserLayoutChrome({ children }: { children: React.ReactNode }) {
  usePaletteCSS();
  const stateSnapshot = useSyncExternalStore(subscribeState, getState, getState);
  const currentView = (stateSnapshot?.values?.currentView as string) ?? "";
  const isHomeScreen = currentView === HOME_VIEW;

  useEffect(() => {
    installBehaviorListener((to: string) => {
      if (typeof to !== "string") return;
      dispatchState("state:currentView", { value: to });
    });
  }, []);
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
  const isUserMode = pathname === "/" || !pathname?.startsWith("/dev");

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
        <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>}>
          {isUserMode ? (
            <UserLayoutChrome>{children}</UserLayoutChrome>
          ) : (
            <RootLayoutBody>{children}</RootLayoutBody>
          )}
        </Suspense>
      </body>
    </html>
  );
}

