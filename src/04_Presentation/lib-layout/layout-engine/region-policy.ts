/**
 * Region policy (layout-first)
 *
 * Responsibilities:
 * - Map node roles → screen regions (experience-specific)
 * - Define region ordering
 * - Define default shell composition (nav placement, enabled regions)
 *
 * Non-goals:
 * - No rendering
 * - No TSX-driven layout decisions
 */

export type LayoutExperience = "website" | "app" | "learning";

export type RegionKey =
  | "header"
  | "nav"
  | "hero"
  | "content"
  | "products"
  | "sidebar"
  | "footer"
  | "primary"
  | "secondary"
  | "actions";

export type NavPlacement = "top" | "side" | "bottom" | "none";

export type RegionPolicyState = {
  regions?: Partial<Record<RegionKey, { enabled?: boolean }>>;
  nav?: { enabled?: boolean; placement?: NavPlacement };
};

/**
 * Canonical ordering per experience.
 * (This is where “screen composition” lives.)
 */
export function getRegionOrder(experience: LayoutExperience): RegionKey[] {
  switch (experience) {
    case "app":
      // App tends to be: nav + (header) + primary + sidebar + footer/actions
      return ["nav", "header", "primary", "sidebar", "actions", "footer"];
    case "learning":
      // Learning tends to be linear flow; nav hidden by default.
      return ["header", "content", "actions", "footer"];
    case "website":
    default:
      return ["header", "hero", "content", "products", "footer"];
  }
}

/**
 * Role → region mapping rules.
 *
 * This is intentionally forgiving: unknown roles fall back to `content`/`primary`.
 */
export function resolveRegionForRole(role: string | undefined, experience: LayoutExperience): RegionKey {
  const r = (role ?? "").toLowerCase();

  if (experience === "app") {
    if (r === "nav" || r === "navigation") return "nav";
    if (r === "header" || r === "topbar" || r === "toolbar") return "header";
    if (r === "sidebar" || r === "aside" || r === "engine" || r === "log" || r === "activity") return "sidebar";
    if (r === "secondary") return "secondary";
    if (r === "actions" || r === "footer") return "actions";
    // default primary content
    return "primary";
  }

  if (experience === "learning") {
    if (r === "header") return "header";
    if (r === "actions" || r === "footer") return "actions";
    if (r === "lesson" || r === "examples" || r === "content") return "content";
    return "content";
  }

  // website
  if (r === "nav" || r === "navigation") return "header";
  if (r === "header" || r === "announcement") return "header";
  if (r === "hero") return "hero";
  if (r === "products" || r === "features" || r === "grid") return "products";
  if (r === "footer") return "footer";
  return "content";
}

export function isRegionEnabled(region: RegionKey, state: RegionPolicyState, experience: LayoutExperience): boolean {
  // Default enablement policy
  const defaults: Record<RegionKey, boolean> = {
    header: true,
    nav: experience === "app",
    hero: experience === "website",
    content: true,
    products: experience === "website",
    sidebar: experience === "app",
    footer: experience === "website",
    primary: true,
    secondary: false,
    actions: experience !== "website",
  };

  const explicit = state?.regions?.[region]?.enabled;
  if (explicit !== undefined) return !!explicit;

  // Nav has its own toggle (because placement matters)
  if (region === "nav") {
    const navEnabled = state?.nav?.enabled;
    if (navEnabled !== undefined) return !!navEnabled;
  }

  return !!defaults[region];
}

export function getNavPlacement(state: RegionPolicyState, experience: LayoutExperience): NavPlacement {
  const explicit = state?.nav?.placement;
  if (explicit) return explicit;
  // defaults
  if (experience === "app") return "side";
  if (experience === "learning") return "none";
  return "top";
}

