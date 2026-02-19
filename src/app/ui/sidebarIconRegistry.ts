/**
 * Single source of truth for sidebar icons.
 * All icons live in /public/ui-icons/ — no inline SVG, no currentColor, no placeholders.
 */

import type { DockPanelId } from "@/app/ui/control-dock/dock-state";

const BASE = "/ui-icons";

export const SIDEBAR_ICON_REGISTRY: Record<DockPanelId, string> = {
  experience: `${BASE}/experience.svg`,
  mode: `${BASE}/components.svg`,
  palette: `${BASE}/palette.svg`,
  template: `${BASE}/content.svg`,
  styling: `${BASE}/star.svg`,
  behavior: `${BASE}/lightning.svg`,
  layout: `${BASE}/layout.svg`,
  newInterface: `${BASE}/content.svg`,
  tsx: `${BASE}/components.svg`,
  expand: `${BASE}/layout.svg`,
};

export function getSidebarIconPath(id: DockPanelId): string | undefined {
  return SIDEBAR_ICON_REGISTRY[id];
}

const _warnedMissing = new Set<string>();

export function getSidebarIconPathOrWarn(id: DockPanelId): string | undefined {
  const path = getSidebarIconPath(id);
  if (!path && typeof process !== "undefined" && process.env?.NODE_ENV === "development") {
    if (!_warnedMissing.has(id)) {
      _warnedMissing.add(id);
      console.warn("[sidebarIconRegistry] Missing icon for panel id:", id);
    }
  }
  return path;
}
