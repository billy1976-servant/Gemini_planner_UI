/**
 * SiteSkin types
 *
 * Goal:
 * - Deterministic, JSON-driven page composition using existing molecules + layout system.
 * - TSX wrappers only load data + select which JSON to render.
 * - Engines supply data/decisions; JSON controls UI structure.
 */
export type SiteSkinExperience = "website" | "app" | "learning";

/**
 * Canonical region roles (stable IDs for future drag/drop).
 * Keep this finite; prefer extending via new roles rather than freeform strings.
 */
export type SiteSkinRegionRole =
  | "header"
  | "nav"
  | "announcement"
  | "hero"
  | "content"
  | "products"
  | "footer"
  | "aside";

/**
 * Layout wrapper applied to a region's children.
 * This uses the existing layout molecules (`column`, `row`, `grid`, `stack`, `page`) from the registry.
 *
 * NOTE:
 * - `preset` is kept for compatibility/future tooling, but layout molecules primarily consume `params`.
 */
export type RegionLayoutSpec = {
  type: "column" | "row" | "grid" | "stack" | "page";
  preset?: string | null;
  params?: Record<string, any>;
};

/**
 * Minimal molecule node shape compatible with JsonRenderer.
 * (Renderer accepts arbitrary fields, but these are the supported conventions.)
 */
export type MoleculeNode = {
  id?: string;
  type: string;
  variant?: string;
  size?: string;
  role?: string;
  layout?: RegionLayoutSpec | any;
  params?: Record<string, any>;
  content?: Record<string, any>;
  behavior?: any;
  when?: { state: string; equals: any };
  children?: MoleculeNode[];
};

/**
 * Slot placeholder node (MUST be resolved before rendering).
 * The engine→skin bridge replaces `slot` nodes with real molecule nodes.
 */
export type SlotNode = {
  id?: string;
  type: "slot";
  slotKey: string; // e.g. "products.featured", "nav.items", "brand.logo"
  renderAs?: string; // e.g. "Card", "Chip", "List"
  params?: Record<string, any>;
  content?: Record<string, any>;
};

export type SiteSkinNode = MoleculeNode | SlotNode;

export type SiteSkinRegion = {
  id: string;
  role: SiteSkinRegionRole;
  /**
   * Optional explicit region layout wrapper.
   * If absent, experience profile (or global layout store) will supply defaults.
   */
  layout?: RegionLayoutSpec;
  nodes: SiteSkinNode[];
};

export type SiteSkinDocument = {
  meta: {
    domain: string;
    pageId: string;
    version: number;
    generatedAt?: string;
  };
  /**
   * Layout-first (preferred): content nodes only.
   * Layout engine composes regions/shell based on roles + experience.
   */
  nodes?: SiteSkinNode[];
  /**
   * Back-compat: regioned skins.
   * If present, runtime may flatten these into role-tagged nodes.
   */
  regions?: SiteSkinRegion[];
  /**
   * Optional declaration of expected data keys (debug/tooling only).
   * Engines provide the data; SiteSkin uses it via bindings/slots.
   */
  dataSlots?: Record<string, { description?: string }>;
};

