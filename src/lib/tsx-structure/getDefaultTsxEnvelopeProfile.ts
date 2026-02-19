/**
 * TSX Structure Layer — default profile resolver.
 * Takes screenPath, returns envelope profile by path pattern conventions only.
 * No per-screen registry; no hardcoded screen IDs.
 */

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

/**
 * Returns the default envelope profile for any TSX screen.
 * Used by TSXScreenWithEnvelope to apply layout, palette, nav, chrome, and app class.
 */
export function getDefaultTsxEnvelopeProfile(screenPath: string): TsxEnvelopeProfile {
  const path = screenPath.replace(/^tsx:/, "").trim();

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
  if (path.includes("wizard") || path.includes("flow")) {
    return {
      layout: "max-width",
      palette: "vars-only",
      nav: "minimal",
      appClass: "standard",
      chrome: { ...DEFAULT_CHROME, overlayHost: true },
    };
  }
  if (matchPath(path, "Container_Creations/*") || path.includes("Container_Creations/ContainerCreationsWebsite")) {
    return {
      layout: "full-viewport",
      palette: "vars-only",
      nav: "inherit",
      appClass: "standard",
      chrome: DEFAULT_CHROME,
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
