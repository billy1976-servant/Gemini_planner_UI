/**
 * Slide builder recipes: pure defaults for slide "types" and style presets.
 * Runtime landing renderers ignore unknown keys; optional builderMeta is UX-only.
 */

/** Minimal screen shape for recipe helpers (keeps this module free of UI imports). */
export type SlideRecipeNode = {
  layout?: string;
  lightTheme?: boolean;
  visualTone?: string;
  density?: string;
  content?: Array<Record<string, unknown>>;
  media?: unknown[];
  buttons?: unknown[];
  builderMeta?: SlideBuilderMeta;
};

export const SLIDE_TYPES = [
  "hook",
  "teaching",
  "proof",
  "comparison",
  "inputDecision",
  "summary",
  "action",
  "custom",
] as const;

export type SlideTypeId = (typeof SLIDE_TYPES)[number];

export const STYLE_PRESETS = [
  "cleanLight",
  "boldProof",
  "darkImmersive",
  "compactInfo",
  "actionCta",
  "custom",
] as const;

export type StylePresetId = (typeof STYLE_PRESETS)[number];

export type SlideBuilderMeta = {
  slideType?: SlideTypeId;
  stylePreset?: StylePresetId;
};

export const SLIDE_TYPE_LABELS: Record<SlideTypeId, string> = {
  hook: "Hook",
  teaching: "Teaching",
  proof: "Proof",
  comparison: "Comparison",
  inputDecision: "Input / decision",
  summary: "Summary",
  action: "Action / CTA",
  custom: "Custom",
};

export const STYLE_PRESET_LABELS: Record<StylePresetId, string> = {
  cleanLight: "Clean / light",
  boldProof: "Bold / proof",
  darkImmersive: "Dark / immersive",
  compactInfo: "Compact / info",
  actionCta: "Action / CTA",
  custom: "Custom",
};

const DEFAULT_STUB_TEXT = "Edit this slide.";

function isDefaultStubContent(content: SlideRecipeNode["content"]): boolean {
  if (!Array.isArray(content) || content.length !== 1) return false;
  const b = content[0];
  return (
    b?.type === "paragraph" &&
    typeof b.text === "string" &&
    b.text.trim() === DEFAULT_STUB_TEXT
  );
}

function emptyOrStubContent(content: SlideRecipeNode["content"]): boolean {
  if (!Array.isArray(content) || content.length === 0) return true;
  return isDefaultStubContent(content);
}

type RecipeDefaults = Required<
  Pick<SlideRecipeNode, "layout" | "lightTheme" | "visualTone" | "density" | "content" | "media" | "buttons">
>;

const RECIPE_DEFAULTS: Record<Exclude<SlideTypeId, "custom">, RecipeDefaults> = {
  hook: {
    layout: "hero",
    lightTheme: true,
    visualTone: "soft",
    density: "comfortable",
    content: [
      { type: "badge", text: "New" },
      { type: "heading", level: 1, text: "Headline" },
      { type: "paragraph", text: "One sentence value proposition." },
    ],
    media: [],
    buttons: [],
  },
  teaching: {
    layout: "twoCol",
    lightTheme: true,
    visualTone: "default",
    density: "comfortable",
    content: [
      { type: "heading", level: 2, text: "Lesson title" },
      { type: "paragraph", text: "Explain the idea in one or two short paragraphs." },
      {
        type: "checklist",
        heading: "Key points",
        items: ["First point", "Second point"],
      },
    ],
    media: [],
    buttons: [],
  },
  proof: {
    layout: "proofPanel",
    lightTheme: false,
    visualTone: "bold",
    density: "comfortable",
    content: [
      { type: "heading", level: 2, text: "Proof" },
      {
        type: "testimonial",
        quote: "Short customer quote.",
        author: "Name",
        role: "Role",
      },
    ],
    media: [],
    buttons: [],
  },
  comparison: {
    layout: "twoCol",
    lightTheme: true,
    visualTone: "default",
    density: "comfortable",
    content: [
      { type: "heading", level: 2, text: "Compare" },
      {
        type: "comparison",
        heading: "Us vs typical",
        columnLabels: { left: "Us", right: "Typical" },
        rows: [
          { left: "Our approach", right: "The alternative", highlight: "left" },
          { left: "Quality", right: "Varies", highlight: "left" },
        ],
      },
    ],
    media: [],
    buttons: [],
  },
  inputDecision: {
    layout: "textOnly",
    lightTheme: true,
    visualTone: "default",
    density: "comfortable",
    content: [
      { type: "heading", level: 2, text: "Your choice" },
      { type: "paragraph", text: "Pick an option below or confirm." },
      {
        type: "checklist",
        heading: "Options",
        items: ["Option A", "Option B"],
      },
    ],
    media: [],
    buttons: [{ type: "next", label: "Continue" }],
  },
  summary: {
    layout: "textOnly",
    lightTheme: true,
    visualTone: "soft",
    density: "comfortable",
    content: [
      { type: "heading", level: 2, text: "Recap" },
      { type: "paragraph", text: "Summarize what they learned or what happens next." },
    ],
    media: [],
    buttons: [],
  },
  action: {
    layout: "hero",
    lightTheme: true,
    visualTone: "bold",
    density: "comfortable",
    content: [
      { type: "heading", level: 1, text: "Take action" },
      {
        type: "ctaBand",
        headline: "Ready to move forward?",
        sub: "Tap below to continue.",
        emphasis: true,
      },
    ],
    media: [],
    buttons: [{ type: "next", label: "Get started" }],
  },
};

export type ApplySlideRecipeOptions = {
  /** When true, replace content/media/buttons with the template (only use when intentional). Default false. */
  replaceBody?: boolean;
};

/**
 * Patch for slide type: layout + presentation + optional builderMeta.
 * Does not wipe user copy unless replaceBody or slide is empty/stub (then seeds template body).
 */
export function applySlideRecipe(
  type: SlideTypeId,
  node: Pick<SlideRecipeNode, "content" | "builderMeta">,
  options: ApplySlideRecipeOptions = {}
): Partial<SlideRecipeNode> {
  const prevMeta = node.builderMeta ?? {};

  if (type === "custom") {
    return {
      builderMeta: { ...prevMeta, slideType: "custom" },
    };
  }

  const defaults = RECIPE_DEFAULTS[type];
  const replaceBody =
    options.replaceBody === true || emptyOrStubContent(node.content);

  const patch: Partial<SlideRecipeNode> = {
    layout: defaults.layout,
    lightTheme: defaults.lightTheme,
    visualTone: defaults.visualTone,
    density: defaults.density,
    builderMeta: { ...prevMeta, slideType: type },
  };

  if (replaceBody) {
    patch.content = JSON.parse(JSON.stringify(defaults.content)) as SlideRecipeNode["content"];
    patch.media = JSON.parse(JSON.stringify(defaults.media)) as SlideRecipeNode["media"];
    patch.buttons = JSON.parse(JSON.stringify(defaults.buttons)) as SlideRecipeNode["buttons"];
  }

  return patch;
}

export function applyStylePreset(
  preset: StylePresetId,
  existingMeta?: SlideBuilderMeta
): Partial<SlideRecipeNode> {
  const prevMeta = existingMeta ?? {};

  if (preset === "custom") {
    return { builderMeta: { ...prevMeta, stylePreset: "custom" } };
  }

  const meta: SlideBuilderMeta = { ...prevMeta, stylePreset: preset };

  switch (preset) {
    case "cleanLight":
      return {
        lightTheme: true,
        visualTone: "soft",
        density: "comfortable",
        builderMeta: meta,
      };
    case "boldProof":
      return {
        lightTheme: false,
        visualTone: "bold",
        density: "comfortable",
        builderMeta: meta,
      };
    case "darkImmersive":
      return {
        lightTheme: false,
        visualTone: "bold",
        density: "comfortable",
        builderMeta: meta,
      };
    case "compactInfo":
      return {
        lightTheme: true,
        visualTone: "default",
        density: "compact",
        builderMeta: meta,
      };
    case "actionCta":
      return {
        lightTheme: true,
        visualTone: "bold",
        density: "comfortable",
        builderMeta: meta,
      };
    default:
      return { builderMeta: meta };
  }
}

function getBlocks(node: SlideRecipeNode): Array<{ type?: string }> {
  return Array.isArray(node.content) ? node.content : [];
}

export function inferSlideTypeFromNode(node: SlideRecipeNode): SlideTypeId {
  const saved = node.builderMeta?.slideType;
  if (saved) return saved;

  const blocks = getBlocks(node);
  const types = new Set(blocks.map((b) => b.type).filter(Boolean) as string[]);

  if (types.has("ctaBand")) return "action";
  if (types.has("comparison")) return "comparison";
  if (types.has("testimonial") || types.has("stats") || types.has("trustStrip") || types.has("rating")) {
    return "proof";
  }
  if (types.has("checklist") && node.layout === "textOnly") return "inputDecision";

  const layout = node.layout ?? "";
  if (layout === "proofPanel" || layout === "splitProof") return "proof";
  if (layout === "hero") return "hook";
  if (layout === "twoCol" || layout === "twoColImageLeft") return "teaching";
  if (layout === "textOnly") return "summary";

  return "custom";
}

export function inferStylePresetFromNode(node: SlideRecipeNode): StylePresetId {
  const saved = node.builderMeta?.stylePreset;
  if (saved) return saved;

  const lt = node.lightTheme === true;
  const tone = node.visualTone ?? "default";
  const density = node.density ?? "comfortable";

  if (density === "compact" && tone === "default") return "compactInfo";
  if (!lt && tone === "bold") return "boldProof";
  if (lt && tone === "bold") return "actionCta";
  if (lt && tone === "soft") return "cleanLight";
  if (!lt && tone === "default") return "darkImmersive";

  return "custom";
}
