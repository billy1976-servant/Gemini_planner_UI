"use client";

import React, { useEffect } from "react";
import peopleSvg from "./assets/people_svg.svg";
import journeySvg from "./assets/journey_svg.svg";
import playSvg from "./assets/play_svg.svg";
import calendarSvg from "./assets/calendar_svg.svg";

/**
 * GlobalAppSkin - PURE VISUAL WRAPPER
 * 
 * Extracted from HIClarify's existing BottomNavBar
 * NO BEHAVIOR - NO LOGIC - NO HANDLERS
 * 
 * This component only provides the visual structure of the bottom navigation.
 * All functionality is removed - this is purely presentational.
 */

// Icon components - EXACT COPIES from original App.jsx

const HabitIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 21v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const MaskIcon = ({ src, className, color }: { src: string; className?: string; color?: string }) => (
  <span
    className={className}
    style={{
      display: "inline-block",
      minWidth: "1.5rem",
      minHeight: "1.5rem",
      backgroundColor: color || "currentColor",
      maskImage: `url(${src})`,
      WebkitMaskImage: `url(${src})`,
      maskSize: "contain",
      WebkitMaskSize: "contain",
      maskRepeat: "no-repeat",
      WebkitMaskRepeat: "no-repeat",
      maskPosition: "center",
      WebkitMaskPosition: "center",
    }}
    aria-hidden
  />
);

const CalendarIcon = ({ className, color }: { className?: string; color?: string }) => (
  <MaskIcon src={calendarSvg} className={className} color={color} />
);

const PeopleIcon = ({ className, color }: { className?: string; color?: string }) => (
  <MaskIcon src={peopleSvg} className={className} color={color} />
);

const JourneyIcon = ({ className, color }: { className?: string; color?: string }) => (
  <MaskIcon src={journeySvg} className={className} color={color} />
);

const playSvgResolved = typeof playSvg === "string" ? playSvg : (playSvg as { default?: string })?.default ?? String(playSvg);
const PlayIcon = ({ className }: { className?: string }) => {
  if (process.env.NODE_ENV === "development") {
    console.log("[PlayIcon] playSvg resolved src:", playSvgResolved);
  }
  return (
    <span data-nav-image-wrapper>
      <img src={playSvgResolved} alt="Play" className={className} style={{ width: "24px", height: "24px" }} />
    </span>
  );
};

// Icon registry: real asset keys → components (no placeholders)
const iconRegistry: Record<string, React.ComponentType<{ className?: string; color?: string }>> = {
  Habit: HabitIcon,
  Calendar: CalendarIcon,
  People: PeopleIcon,
  Journey: JourneyIcon,
  Overview: PlayIcon,
};
const centerItem = "Overview";
const leftItems = ["Habit", "People"];
const rightItems = ["Journey", "Calendar"];

function renderNavItem(iconKey: string) {
  const Icon = iconRegistry[iconKey];
  if (!Icon) {
    if (process.env.NODE_ENV === "development") {
      console.warn("ICON MISS:", iconKey);
    }
    return null;
  }
  const isOverview = iconKey === "Overview";
  const isImageIcon = iconKey === "People" || iconKey === "Journey" || iconKey === "Calendar";
  const maskedColor = "#64748b";
  const desiredClass = isOverview
    ? "h-12 w-12 sm:h-14 sm:w-14"
    : iconKey === "Journey" || iconKey === "Calendar"
      ? "h-11 w-11 sm:h-[52px] sm:w-[52px]"
      : iconKey === "Habit" || iconKey === "People"
        ? "h-10 w-10 sm:h-12 sm:w-12"
        : isImageIcon
          ? "h-9 w-9 sm:h-10 sm:w-10"
          : "h-8 w-8 sm:h-9 sm:w-9";
  const textClasses = isOverview ? "text-slate-600" : "text-slate-500";
  return (
    <button
      key={iconKey}
      data-nav-item={iconKey}
      className={`flex flex-col items-center flex-1 min-w-0 sm:flex-none px-1 sm:px-4 pt-2 max-[400px]:pt-1 pb-1 ${textClasses}`}
      title={iconKey}
      type="button"
      aria-label={iconKey}
      style={{ pointerEvents: "none" }}
    >
      <span data-nav-icon={iconKey} className="flex items-center justify-center shrink-0">
        {isImageIcon ? (
          <Icon className={desiredClass} color={maskedColor} />
        ) : (
          <Icon className={desiredClass} />
        )}
      </span>
    </button>
  );
}

function getFrameRect(): { left: number; width: number } {
  if (typeof document === "undefined") return { left: 0, width: typeof window !== "undefined" ? window.innerWidth : 0 };
  const frame = document.querySelector("[data-phone-frame]");
  const rect = frame?.getBoundingClientRect();
  return {
    left: rect?.left ?? 0,
    width: rect?.width ?? (typeof window !== "undefined" ? window.innerWidth : 0),
  };
}

/** Bottom nav at viewport level — locked to phone frame bounds when present. */
export function BottomNavOnly() {
  const [frameRect, setFrameRect] = React.useState(getFrameRect);

  useEffect(() => {
    const update = () => setFrameRect(getFrameRect());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
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

      const overviewItem = document.querySelector('[data-nav-item="Overview"]');
      const overviewIcon = document.querySelector('[data-nav-icon="Overview"]');
      if (overviewItem) {
        console.group("[Step A] Play nav item (Overview)");
        console.log("item rect", logRect(overviewItem));
        if (overviewIcon) console.log("icon rect", logRect(overviewIcon));
        let p: HTMLElement | null = overviewItem.parentElement;
        const chain: Array<{ tag: string; rect: ReturnType<typeof logRect> }> = [];
        while (p && p !== document.body) {
          chain.push({ tag: p.tagName + (p.id ? "#" + p.id : ""), rect: logRect(p) });
          p = p.parentElement;
        }
        console.log("parent chain to body", chain);
        console.groupEnd();
      }

      const habitItem = document.querySelector('[data-nav-item="Habit"]');
      const habitIcon = document.querySelector('[data-nav-icon="Habit"]');
      if (habitItem) {
        console.group("[Step A] Other nav item (Habit)");
        console.log("item rect", logRect(habitItem));
        if (habitIcon) console.log("icon rect", logRect(habitIcon));
        console.groupEnd();
      }

      const peopleItem = document.querySelector('[data-nav-item="People"]');
      const peopleIcon = document.querySelector('[data-nav-icon="People"]');
      if (peopleItem) {
        console.group("[Step A] Other nav item (People)");
        console.log("item rect", logRect(peopleItem));
        if (peopleIcon) console.log("icon rect", logRect(peopleIcon));
        console.groupEnd();
      }

      const imgs = container.querySelectorAll("img");
      const logComputedStyle = (img: HTMLImageElement) => {
        const s = window.getComputedStyle(img);
        return { display: s.display, visibility: s.visibility, opacity: s.opacity, zIndex: s.zIndex };
      };
      imgs.forEach((img, i) => {
        const rect = img.getBoundingClientRect();
        console.log(`[Step B] bottom-nav img ${i}`, {
          src: img.src,
          currentSrc: img.currentSrc,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          getBoundingClientRect: logRect(img),
          computedStyle: logComputedStyle(img),
        });
        const onload = () => {
          console.log(`[Step B] bottom-nav img ${i} LOADED`, { src: img.src, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
        };
        const onerror = () => {
          console.log(`[Step B] bottom-nav img ${i} FAILED (404?)`, { src: img.src });
        };
        img.addEventListener("load", onload);
        img.addEventListener("error", onerror);
        cleanups.push(() => {
          img.removeEventListener("load", onload);
          img.removeEventListener("error", onerror);
        });
        if (img.complete && img.naturalWidth > 0) onload();
      });

      const iconEls = container.querySelectorAll("[data-nav-icon]");
      iconEls.forEach((el, i) => {
        const key = el.getAttribute("data-nav-icon") ?? i;
        const rect = el.getBoundingClientRect();
        const cs = window.getComputedStyle(el);
        console.log(`[Step B] nav icon ${key}`, {
          tagName: el.tagName,
          getBoundingClientRect: { width: rect.width, height: rect.height },
          computedWidth: cs.width,
          computedHeight: cs.height,
          display: cs.display,
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

  return (
    <div
      data-bottom-nav
      data-nav-root
      style={{
        position: "fixed",
        left: frameRect.left,
        width: frameRect.width,
        bottom: 0,
        height: 64,
        minHeight: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        background: "white",
        borderTop: "2px solid lime",
        zIndex: 9999,
      }}
    >
      <nav
        className="w-full px-2"
        style={{
          maxWidth: frameRect.width,
          margin: "0 auto",
        }}
      >
        <div className="flex items-center justify-between gap-2.5 sm:gap-3 py-1">
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
