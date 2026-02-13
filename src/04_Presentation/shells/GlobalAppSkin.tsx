"use client";

import React, { useEffect, useState } from "react";
import { SCREEN_GUTTER_X, NAV_STRIP_HEIGHT, SCREEN_UI_BREAKPOINT_PX } from "@/app/shell-ui-constants";

/**
 * GlobalAppSkin - PURE VISUAL WRAPPER
 *
 * Extracted from HIClarify's existing BottomNavBar
 * NO BEHAVIOR - NO LOGIC - NO HANDLERS
 *
 * This component only provides the visual structure of the bottom navigation.
 * All functionality is removed - this is purely presentational.
 *
 * Shell quick icons: every icon renders as button > svg only (no img, no container).
 * Strip has data-molecule="ShellQuickIcons"; each button has data-shell-icon for diagnostics.
 * Strip parent is #app-viewport. Gutter from shell-ui-constants.
 */

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

const iconRegistry: Record<string, React.ComponentType> = {
  Habit: HabitIcon,
  Calendar: CalendarIcon,
  People: PeopleIcon,
  Journey: JourneyIcon,
  Overview: PlayIcon,
};

const centerItem = "Overview";
const leftItems = ["Habit", "People"];
const rightItems = ["Journey", "Calendar"];

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
  if (!Icon) {
    if (process.env.NODE_ENV === "development") {
      console.warn("ICON MISS:", iconKey);
    }
    return null;
  }
  return (
    <button
      key={iconKey}
      data-nav-item={iconKey}
      data-shell-icon={iconKey}
      style={SHELL_BUTTON_STYLE}
      title={iconKey}
      type="button"
      aria-label={iconKey}
    >
      <Icon />
    </button>
  );
}

/** Bottom nav: anchored to AppViewport (persistent in both phone frame and desktop). */
export function BottomNavOnly() {
  const navRootRef = React.useRef<HTMLDivElement>(null);
  const [isDesktopOrTablet, setIsDesktopOrTablet] = useState(
    typeof window !== "undefined" ? window.matchMedia(`(min-width: ${SCREEN_UI_BREAKPOINT_PX}px)`).matches : true
  );
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${SCREEN_UI_BREAKPOINT_PX}px)`);
    const handler = () => setIsDesktopOrTablet(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const el = navRootRef.current;
    if (!el) return;
    const parent = el.parentElement;
    const rect = el.getBoundingClientRect();
    const vis = window.getComputedStyle(el).visibility;
    console.log("[NAV ROOT MOUNTED]", {
      parentNodeType: parent?.tagName ?? "none",
      boundingRect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height, bottom: rect.bottom },
      visibility: vis,
    });
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const cleanups: (() => void)[] = [];
    const run = () => {
      const container = document.querySelector("[data-nav-root], [data-bottom-nav]");
      if (!container || !(container instanceof HTMLElement)) return;

      const logRect = (el: Element) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, top: r.top, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
      };
      const s = window.getComputedStyle(container);
      console.group("[Step A] Nav root");
      console.log("rect", logRect(container), "position", s.position, "display", s.display, "overflow", s.overflow, "zIndex", s.zIndex);
      console.groupEnd();

      const overviewItem = document.querySelector('[data-shell-icon="Overview"]');
      if (overviewItem) {
        console.group("[Step A] Play nav item (Overview)");
        console.log("button rect", logRect(overviewItem));
        const svg = overviewItem.querySelector("svg");
        if (svg) console.log("svg rect", logRect(svg));
        console.groupEnd();
      }

      const habitItem = document.querySelector('[data-shell-icon="Habit"]');
      if (habitItem) {
        console.group("[Step A] Other nav item (Habit)");
        console.log("button rect", logRect(habitItem));
        const svg = habitItem.querySelector("svg");
        if (svg) console.log("svg rect", logRect(svg));
        console.groupEnd();
      }

      const peopleItem = document.querySelector('[data-shell-icon="People"]');
      if (peopleItem) {
        console.group("[Step A] Other nav item (People)");
        console.log("button rect", logRect(peopleItem));
        const svg = peopleItem.querySelector("svg");
        if (svg) console.log("svg rect", logRect(svg));
        console.groupEnd();
      }

      const iconButtons = container.querySelectorAll("[data-shell-icon]");
      iconButtons.forEach((el, i) => {
        const key = el.getAttribute("data-shell-icon") ?? i;
        const rect = el.getBoundingClientRect();
        const cs = window.getComputedStyle(el);
        const svg = el.querySelector("svg");
        console.log(`[Step B] shell icon ${key}`, {
          tagName: el.tagName,
          getBoundingClientRect: { width: rect.width, height: rect.height },
          computedWidth: cs.width,
          computedHeight: cs.height,
          display: cs.display,
          hasSvg: !!svg,
        });
      });
    };
    const t = setTimeout(run, 100);
    return () => {
      clearTimeout(t);
      cleanups.forEach((c) => c());
    };
  }, []);

  const navItems = [...leftItems, ...(centerItem ? [centerItem] : []), ...rightItems];
  if (process.env.NODE_ENV === "development") {
    console.log("NAV ITEMS:", navItems.length);
  }

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
      data-render-source="shell"
      data-shell-layer="bottom-nav"
      style={navRootStyle}
    >
      <nav
        className="w-full px-2"
        style={{
          width: "100%",
          maxWidth: isDesktopOrTablet ? "none" : 420,
          margin: isDesktopOrTablet ? 0 : "0 auto",
          marginLeft: isDesktopOrTablet ? SCREEN_GUTTER_X : undefined,
          display: "flex",
          justifyContent: isDesktopOrTablet ? "flex-start" : "space-around",
          gap: "0.5rem",
          padding: "0.25rem 0",
        }}
      >
        <div
          data-molecule="ShellQuickIcons"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: isDesktopOrTablet ? "flex-start" : "space-around",
            width: "100%",
          }}
        >
          {leftItems.map(renderNavItem)}
          {centerItem && renderNavItem(centerItem)}
          {rightItems.map(renderNavItem)}
        </div>
      </nav>
    </div>
  );
}

interface GlobalAppSkinProps {
  children: React.ReactNode;
}

function GlobalAppSkin({ children }: GlobalAppSkinProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const rootEl = rootRef.current;
    const contentEl = contentRef.current;
    if (rootEl && contentEl) {
      fetch("http://127.0.0.1:7243/ingest/24224569-7f6c-4cce-b36c-15950dc8c06a", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "GlobalAppSkin.tsx",
          message: "Shell dimensions",
          data: {
            rootHeight: rootEl.offsetHeight,
            contentHeight: contentEl.offsetHeight,
            viewportHeight: window.innerHeight,
          },
          timestamp: Date.now(),
          hypothesisId: "H1,H2,H3",
        }),
      }).catch(() => {});
    }
  }, [children]);

  return (
    <div
      ref={rootRef}
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxSizing: "border-box",
        width: "100%",
        maxWidth: "none",
        padding: 0,
        margin: 0,
        border: "none",
      }}
      data-shell="global-app-skin"
      data-render-source="shell"
      data-shell-layer="chrome"
      data-tsx-source="GlobalAppSkin"
      data-tsx-layer="shell"
    >
      <div
        ref={contentRef}
        style={{
          flex: 1,
          overflow: "auto",
          minHeight: 0,
          boxSizing: "border-box",
          width: "100%",
          maxWidth: "none",
          overflowX: "hidden",
          padding: 0,
          margin: 0,
          paddingBottom: "72px",
          border: "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}

const GlobalAppSkinExport = Object.assign(GlobalAppSkin, { BottomNavOnly });
export default GlobalAppSkinExport;
