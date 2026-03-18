/**
 * TSX Structure Layer — default profile resolver.
 * When profileName is provided, resolves envelope from config (mode-profiles.json).
 * Otherwise uses path pattern conventions only. No per-screen registry; no hardcoded screen IDs.
 */

import modeProfilesConfig from "../../config/mode-profiles.json";

export type LayoutMode = "full-viewport" | "contained" | "max-width" | "scroll-region";
export type NavMode = "inherit" | "none" | "app-default" | "minimal" | "custom-slot";
export type PaletteMode = "vars-only" | "full-scope" | "inherit";
export type AppClass = "standard" | "kid" | "focus" | "learning" | "admin";

export type ChromeSlots = {
  topBar: boolean;
  bottomBar: boolean;
  sidePanel: boolean;
  overlayHost: boolean;
};

export type TsxEnvelopeProfile = {
  layout: LayoutMode;
  palette: PaletteMode;
  nav: NavMode;
  appClass: AppClass;
  chrome: ChromeSlots;
};

const DEFAULT_CHROME: ChromeSlots = {
  topBar: true,
  bottomBar: false,
  sidePanel: false,
  overlayHost: true,
};

/**
 * Path pattern conventions (order matters: first match wins).
 * Use forward slashes; paths are normalized (e.g. "HiClarify/..." or "tsx:HiClarify/...").
 */
function matchPath(screenPath: string, pattern: string): boolean {
  const normalized = screenPath.replace(/^tsx:/, "").trim();
  if (pattern.endsWith("/*")) {
    const prefix = pattern.slice(0, -2);
    return normalized === prefix || normalized.startsWith(prefix + "/");
  }
  return normalized === pattern || normalized.startsWith(pattern + "/");
}

type ModeProfileWithEnvelope = {
  envelope?: {
    layout?: string;
    nav?: string;
    palette?: string;
    appClass?: string;
    chrome?: { topBar?: boolean; bottomBar?: boolean; sidePanel?: boolean; overlayHost?: boolean };
  };
};

/**
 * Returns the default envelope profile for any TSX screen.
 * When profileName is provided, uses config (mode-profiles.json) first; else path-based conventions.
 * Used by TSXScreenWithEnvelope to apply layout, palette, nav, chrome, and app class.
 */
export function getDefaultTsxEnvelopeProfile(
  screenPath: string,
  experience?: string,
  profileName?: string
): TsxEnvelopeProfile {
  const path = screenPath.replace(/^tsx:/, "").trim();
  const exp = (experience ?? "").toLowerCase();

  if (profileName && typeof profileName === "string") {
    const config = (modeProfilesConfig as Record<string, ModeProfileWithEnvelope>)[profileName];
    const env = config?.envelope;
    if (env && typeof env === "object") {
      return {
        layout: (env.layout as LayoutMode) ?? "full-viewport",
        nav: (env.nav as NavMode) ?? "inherit",
        palette: (env.palette as PaletteMode) ?? "vars-only",
        appClass: (env.appClass as AppClass) ?? "standard",
        chrome: {
          topBar: env.chrome?.topBar ?? true,
          bottomBar: env.chrome?.bottomBar ?? false,
          sidePanel: env.chrome?.sidePanel ?? false,
          overlayHost: env.chrome?.overlayHost ?? true,
        },
      };
    }
  }

  // Container Creations (and TSX website screens): respect web/app/learning console
  if (matchPath(path, "ContainerCreations/*") || matchPath(path, "Container_Creations/*") || path.includes("ContainerCreations/Learn/landing/ContainerCreationsWebsite") || path.includes("Container_Creations/ContainerCreationsWebsite")) {
    if (exp === "app") {
      return {
        layout: "contained",
        palette: "vars-only",
        nav: "app-default",
        appClass: "standard",
        chrome: { ...DEFAULT_CHROME, topBar: true, sidePanel: false },
      };
    }
    if (exp === "learning") {
      return {
        layout: "max-width",
        palette: "vars-only",
        nav: "minimal",
        appClass: "learning",
        chrome: { ...DEFAULT_CHROME, sidePanel: true },
      };
    }
    // website (default): marketing/content-first
    return {
      layout: "full-viewport",
      palette: "vars-only",
      nav: "inherit",
      appClass: "standard",
      chrome: DEFAULT_CHROME,
    };
  }

  // Path pattern conventions only — no per-screen logic
  if (matchPath(path, "learning/*")) {
    return {
      layout: "scroll-region",
      palette: "full-scope",
      nav: "app-default",
      appClass: "learning",
      chrome: { ...DEFAULT_CHROME, sidePanel: true },
    };
  }
  if (matchPath(path, "admin/*") || path.includes("/system/") || path.includes("diagnostics")) {
    return {
      layout: "full-viewport",
      palette: "vars-only",
      nav: "minimal",
      appClass: "admin",
      chrome: { ...DEFAULT_CHROME, topBar: true, sidePanel: true },
    };
  }
  if (matchPath(path, "kid/*") || path.includes("kid-emotion")) {
    return {
      layout: "full-viewport",
      palette: "full-scope",
      nav: "minimal",
      appClass: "kid",
      chrome: { ...DEFAULT_CHROME, bottomBar: true },
    };
  }
  if (matchPath(path, "focus/*") || path.includes("/planner/") || path.includes("timeline")) {
    return {
      layout: "full-viewport",
      palette: "vars-only",
      nav: "app-default",
      appClass: "focus",
      chrome: { ...DEFAULT_CHROME, overlayHost: true },
    };
  }
  // Onboarding before HiClarify/* so HiClarify/HiClarifyOnboarding gets no chrome (no white bar / legacy template)
  if (path.includes("onboarding") || path.includes("Onboarding")) {
    return {
      layout: "full-viewport",
      palette: "vars-only",
      nav: "none",
      appClass: "standard",
      chrome: { topBar: false, bottomBar: false, sidePanel: false, overlayHost: true },
    };
  }
  if (matchPath(path, "HiClarify/*")) {
    return {
      layout: "full-viewport",
      palette: "vars-only",
      nav: "app-default",
      appClass: "standard",
      chrome: DEFAULT_CHROME,
    };
  }
  // Prayer app: full-viewport, minimal chrome, so room/player layout is unchanged
  if (matchPath(path, "Christian/Prayer/*") || path.includes("Christian/Prayer/PrayerApp")) {
    return {
      layout: "full-viewport",
      palette: "vars-only",
      nav: "none",
      appClass: "standard",
      chrome: { topBar: false, bottomBar: false, sidePanel: false, overlayHost: true },
    };
  }
  if (path.includes("wizard") || path.includes("flow")) {
    return {
      layout: "max-width",
      palette: "vars-only",
      nav: "minimal",
      appClass: "standard",
      chrome: { ...DEFAULT_CHROME, overlayHost: true },
    };
  }

  // Default fallback
  return {
    layout: "full-viewport",
    palette: "vars-only",
    nav: "inherit",
    appClass: "standard",
    chrome: DEFAULT_CHROME,
  };
}
