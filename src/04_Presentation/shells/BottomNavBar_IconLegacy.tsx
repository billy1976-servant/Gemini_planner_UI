"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NAV_STRIP_HEIGHT, SCREEN_UI_BREAKPOINT_PX } from "@/app/shell-ui-constants";

const LAUNCHER_DROPDOWN_GAP_PX = 8;

const SHELL_ICON_SVG_PROPS = { width: 22, height: 22, viewBox: "0 0 24 24", "aria-hidden": true };

const HabitIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" {...SHELL_ICON_SVG_PROPS} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" {...SHELL_ICON_SVG_PROPS} fill="currentColor">
    <path d="M8 5v14l11-7L8 5z" />
  </svg>
);

const PeopleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" {...SHELL_ICON_SVG_PROPS} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" {...SHELL_ICON_SVG_PROPS} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const JourneyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" {...SHELL_ICON_SVG_PROPS} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ToolsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" {...SHELL_ICON_SVG_PROPS} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const iconRegistry: Record<string, React.ComponentType<{}>> = {
  person: HabitIcon,
  people: PeopleIcon,
  play: PlayIcon,
  build: JourneyIcon,
  tools: ToolsIcon,
};

const centerItem = "play";
const leftItems = ["person", "people"];
const rightItems = ["build", "tools"];

const NAV_TARGET_BY_ICON: Record<string, string> = {
  person: "HiClarify/me/me_home",
  people: "HiClarify/others/others_home",
  play: "HiClarify/play/play_home",
  build: "HiClarify/build/build_home",
  tools: "HiClarify/tools/tools_home",
};

const SHELL_BUTTON_STYLE: React.CSSProperties = {
  width: 48,
  height: 48,
  minWidth: 48,
  minHeight: 48,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  padding: 0,
  color: "inherit",
};

function renderNavItem(iconKey: string) {
  const Icon = iconRegistry[iconKey];
  if (!Icon) return null;
  const to = NAV_TARGET_BY_ICON[iconKey];
  return (
    <button
      key={iconKey}
      data-nav-item={iconKey}
      data-shell-icon={iconKey}
      style={SHELL_BUTTON_STYLE}
      title={iconKey}
      type="button"
      aria-label={iconKey}
      onClick={() => {
        if (to && typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("navigate", { detail: { to } }));
        }
      }}
    >
      <Icon />
    </button>
  );
}

const LAUNCHER_BUTTON_SIZE = Math.round(56 * (2 / 3));
const LAUNCHER_LINK_STYLE: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: "8px",
  textDecoration: "none",
  color: "#1a1a1a",
  background: "#f5f5f5",
  fontWeight: 500,
  fontSize: "14px",
  transition: "background 0.2s ease",
  display: "block",
};

export function BottomNavBar_IconLegacy() {
  const navRootRef = useRef<HTMLDivElement>(null);
  const launcherButtonRef = useRef<HTMLButtonElement>(null);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ left: number; bottom: number } | null>(null);
  const [isDesktopOrTablet, setIsDesktopOrTablet] = useState(
    typeof window !== "undefined" ? window.matchMedia(`(min-width: ${SCREEN_UI_BREAKPOINT_PX}px)`).matches : true
  );
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${SCREEN_UI_BREAKPOINT_PX}px)`);
    const handler = () => setIsDesktopOrTablet(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const updateDropdownPosition = () => {
    const btn = launcherButtonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const bottomPx = NAV_STRIP_HEIGHT + LAUNCHER_DROPDOWN_GAP_PX;
    setDropdownPosition({ left: centerX, bottom: bottomPx });
  };
  useLayoutEffect(() => {
    if (!launcherOpen) {
      setDropdownPosition(null);
      return;
    }
    updateDropdownPosition();
    const onResize = () => updateDropdownPosition();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [launcherOpen]);

  const SHOW_LAYOUT_DEBUG_BORDERS = process.env.NODE_ENV === "development" && false;
  const navRootStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    bottom: 0,
    width: "100%",
    height: NAV_STRIP_HEIGHT,
    minHeight: 48,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "white",
    borderTop: SHOW_LAYOUT_DEBUG_BORDERS ? "2px solid lime" : "none",
    zIndex: 9999,
    overflow: "visible",
  };

  return (
    <div
      ref={navRootRef}
      data-bottom-nav
      data-nav-root
      data-render-source="BottomNavBar_IconLegacy"
      data-shell-layer="bottom-nav"
      style={navRootStyle}
    >
      <nav
        className="w-full px-2"
        style={{
          width: "100%",
          maxWidth: "100%",
          margin: "0 auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.25rem 0",
        }}
      >
        <div
          data-molecule="ShellQuickIcons"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-evenly",
            width: "100%",
            position: "relative",
          }}
        >
          {leftItems.map(renderNavItem)}
          <div style={{ position: "relative" }}>
            {launcherOpen &&
              dropdownPosition &&
              typeof document !== "undefined" &&
              createPortal(
                <div
                  style={{
                    position: "fixed",
                    left: dropdownPosition.left,
                    transform: "translateX(-50%)",
                    bottom: dropdownPosition.bottom,
                    zIndex: 10000,
                    background: "#ffffff",
                    borderRadius: "12px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.24)",
                    padding: "16px",
                    minWidth: "200px",
                    pointerEvents: "auto",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <nav style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <a href="/?screen=journal" style={LAUNCHER_LINK_STYLE}>Journal</a>
                    <a href="/?screen=learn" style={LAUNCHER_LINK_STYLE}>Learn</a>
                    <a href="/?screen=apps" style={LAUNCHER_LINK_STYLE}>Apps</a>
                    <a href="/dev" style={LAUNCHER_LINK_STYLE}>Diagnostics</a>
                    <a href="/" style={LAUNCHER_LINK_STYLE}>Home</a>
                  </nav>
                </div>,
                document.body
              )}
            <button
              ref={launcherButtonRef}
              type="button"
              data-shell-icon="play"
              data-nav-item="play"
              data-osb-entry
              aria-label="Quick capture"
              title="Quick capture"
              onClick={() => {
                setLauncherOpen(false);
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("osb:open"));
                }
              }}
              style={{
                width: LAUNCHER_BUTTON_SIZE,
                height: LAUNCHER_BUTTON_SIZE,
                minWidth: LAUNCHER_BUTTON_SIZE,
                minHeight: LAUNCHER_BUTTON_SIZE,
                borderRadius: "50%",
                border: "none",
                background: "orange",
                boxShadow: "0 4px 24px rgba(255, 140, 0, 0.4)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
            >
              <svg width={Math.round(24 * (2 / 3))} height={Math.round(24 * (2 / 3))} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: launcherOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.3s ease" }}>
                <path d="M8 5v14l11-7L8 5z" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          {rightItems.map(renderNavItem)}
        </div>
      </nav>
    </div>
  );
}
