/**
 * Global icon system for the right sidebar.
 * Each icon is a React component with its own color — filled, soft, dimensional.
 * No monochrome, no stroke-only, no currentColor. Single source of truth.
 */

"use client";

import React from "react";
import type { DockPanelId } from "./dock-state";

const SIZE = 22;
const VB = "0 0 24 24";

/* Experience — blue */
function IconExperience() {
  return (
    <svg width={SIZE} height={SIZE} viewBox={VB} fill="none" aria-hidden>
      <defs>
        <linearGradient id="icon-globe-blue" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60a5fa" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#icon-globe-blue)" opacity={0.95} />
      <ellipse cx="12" cy="12" rx="10" ry="4.2" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
      <path d="M2 12h20" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/* Mode / Settings — indigo */
function IconMode() {
  return (
    <svg width={SIZE} height={SIZE} viewBox={VB} fill="none" aria-hidden>
      <defs>
        <linearGradient id="icon-gear-indigo" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818cf8" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
        fill="url(#icon-gear-indigo)"
      />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        fill="url(#icon-gear-indigo)"
        opacity={0.9}
      />
    </svg>
  );
}

/* Palette — multicolor */
function IconPalette() {
  return (
    <svg width={SIZE} height={SIZE} viewBox={VB} fill="none" aria-hidden>
      <defs>
        <linearGradient id="icon-palette-base" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a78bfa" />
          <stop offset="0.5" stopColor="#c084fc" />
          <stop offset="1" stopColor="#e879f9" />
        </linearGradient>
      </defs>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.9 0 1.76-.14 2.58-.4" fill="url(#icon-palette-base)" />
      <circle cx="8" cy="8" r="1.4" fill="#f59e0b" />
      <circle cx="16" cy="7" r="1.4" fill="#10b981" />
      <circle cx="14" cy="12" r="1.4" fill="#3b82f6" />
      <circle cx="6" cy="13" r="1.4" fill="#ec4899" />
    </svg>
  );
}

/* Template / Content — teal */
function IconTemplate() {
  return (
    <svg width={SIZE} height={SIZE} viewBox={VB} fill="none" aria-hidden>
      <defs>
        <linearGradient id="icon-doc-teal" x1="6" y1="2" x2="18" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2dd4bf" />
          <stop offset="1" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="url(#icon-doc-teal)" />
      <path d="M14 2v6h6" fill="rgba(255,255,255,0.25)" />
      <rect x="8" y="12" width="8" height="1.5" rx="0.75" fill="rgba(255,255,255,0.7)" />
      <rect x="8" y="16" width="6" height="1.5" rx="0.75" fill="rgba(255,255,255,0.5)" />
    </svg>
  );
}

/* Styling / Favorites — gold */
function IconStyling() {
  return (
    <svg width={SIZE} height={SIZE} viewBox={VB} fill="none" aria-hidden>
      <defs>
        <linearGradient id="icon-star-gold" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fcd34d" />
          <stop offset="0.5" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
        fill="url(#icon-star-gold)"
      />
    </svg>
  );
}

/* Behavior / Actions — orange */
function IconBehavior() {
  return (
    <svg width={SIZE} height={SIZE} viewBox={VB} fill="none" aria-hidden>
      <defs>
        <linearGradient id="icon-bolt-orange" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fb923c" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <path
        d="M13 2L3 14h9l-2 8 10-12h-9l2-8z"
        fill="url(#icon-bolt-orange)"
      />
    </svg>
  );
}

/* Layout — purple */
function IconLayout() {
  return (
    <svg width={SIZE} height={SIZE} viewBox={VB} fill="none" aria-hidden>
      <defs>
        <linearGradient id="icon-grid-purple" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c084fc" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="7" height="7" rx="1.5" fill="url(#icon-grid-purple)" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" fill="url(#icon-grid-purple)" opacity={0.85} />
      <rect x="3" y="14" width="7" height="7" rx="1.5" fill="url(#icon-grid-purple)" opacity={0.75} />
      <rect x="14" y="14" width="7" height="7" rx="1.5" fill="url(#icon-grid-purple)" opacity={0.65} />
    </svg>
  );
}

export const ICON_MAP: Record<DockPanelId, React.FC> = {
  experience: IconExperience,
  mode: IconMode,
  palette: IconPalette,
  template: IconTemplate,
  styling: IconStyling,
  behavior: IconBehavior,
  layout: IconLayout,
};

export default ICON_MAP;
