"use client";
// CONTRACT:
// Palette = visual only
// Layout = structural only
// Palette must never mutate layout config, dropdowns, or layout persistence.
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";

import "@/styles/site-theme.css";
import InteractionTracerPanel from "@/devtools/InteractionTracerPanel";
import DevicePreviewToggle from "@/dev/DevicePreviewToggle";
import { getPhoneFrameEnabled, subscribePhoneFrameEnabled } from "@/dev/phone-frame-store";
import { getDevicePreviewMode, subscribeDevicePreviewMode } from "@/dev/device-preview-store";

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
   📐 EXPERIENCE PROFILES (single JSON authority)
============================================================ */
import presentationProfiles from "@/lib/layout/presentation-profiles.json";
import CascadingScreenMenu from "@/app/components/CascadingScreenMenu";
import PersistentLauncher from "@/components/global/PersistentLauncher";
import { BottomNavOnly } from "@/04_Presentation/shells/GlobalAppSkin";
import { NAV_STRIP_HEIGHT } from "@/app/shell-ui-constants";

/** Stage max-width by device mode (centered; does not include sidebar area). */
const STAGE_MAX_WIDTH_PHONE = 420;
const STAGE_MAX_WIDTH_TABLET = 768;
const STAGE_MAX_WIDTH_DESKTOP = 1100;


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


type ScreensIndex = {
  category: string;
  directFiles?: string[];
  folders: Record<string, string[]>;
};


export default function RootLayout({ children }: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentScreen = searchParams.get("screen") ?? "";

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

  // State is source of truth; fall back to layout-store / palette-store when key is missing
  const experience = (stateSnapshot?.values?.experience ?? (layoutSnapshot as { experience?: string })?.experience) ?? "website";
  const templateId = (stateSnapshot?.values?.templateId ?? (layoutSnapshot as { templateId?: string })?.templateId) ?? "";
  const layoutMode = (stateSnapshot?.values?.layoutMode ?? (layoutSnapshot as { mode?: LayoutMode })?.mode) ?? "template";
  const paletteName = (stateSnapshot?.values?.paletteName ?? getPaletteName()) || "default";

  const [showSections, setShowSections] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("[MOUNT]", "RootLayout");
    return () => console.log("[UNMOUNT]", "RootLayout");
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
     ❗ NO STATE REPLAY HERE
  ============================================================ */
  useEffect(() => {
    installBehaviorListener((to: string) => {
      if (typeof to === "string" && to.startsWith("|")) {
        dispatchState("state:currentView", { value: to });
        return;
      }
      router.replace(`/?screen=${encodeURIComponent(to)}`);
    });
  }, [router]);


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
    <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&family=Poppins:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="app-body">
        {/* Navigator: no key — identity stable; palette changes only update CSS, never remount. */}
        <div className="app-chrome">
          <b>HIclarify Navigator</b>

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


        {showSections && (
          <div id="section-layout-panel" className="app-section-layout-panel" />
        )}

        <div ref={contentRef} className="app-content" style={{ padding: 0, overflow: "visible" }}>
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
                  padding: "12px",
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
                    overflow: "visible",
                    display: "flex",
                    flexDirection: "column",
                    boxSizing: "border-box",
                    maxWidth: "100%",
                  }}
                >
                  <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", paddingBottom: 80 }}>
                    {children}
                  </div>
                  <div
                    id="screen-ui-layer"
                    data-screen-ui-layer
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: NAV_STRIP_HEIGHT,
                      overflow: "visible",
                    }}
                  >
                    <BottomNavOnly />
                  </div>
                  <PersistentLauncher />
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
                    maxWidth: stageMaxWidth,
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
                      paddingBottom: 80,
                    }}
                  >
                    {children}
                  </div>
                  <div
                    id="screen-ui-layer"
                    data-screen-ui-layer
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: NAV_STRIP_HEIGHT,
                      overflow: "visible",
                    }}
                  >
                    <BottomNavOnly />
                  </div>
                  <PersistentLauncher />
                </div>
              </div>
            </div>
          )}
        </div>
        {process.env.NODE_ENV === "development" && <InteractionTracerPanel defaultCollapsed={phoneFrameEnabled} />}
      </body>
    </html>
  );
}

