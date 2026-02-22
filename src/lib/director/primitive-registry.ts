/**
 * Director primitive registry — exactly 25 controlled UI primitives.
 * All values are JSON-driven; no feature names or business logic.
 * Director merges schema + mode profile into directorProps using these defaults.
 */

export type PrimitiveType = "boolean" | "enum" | "number";

export type PrimitiveDef = {
  type: PrimitiveType;
  default: unknown;
  enum?: readonly string[];
};

/** Registry of 25 primitives. Keys are the only allowed directorProps keys for primitives. */
export const PRIMITIVE_REGISTRY: Record<string, PrimitiveDef> = {
  visibility: {
    type: "boolean",
    default: true,
  },
  disabled: {
    type: "boolean",
    default: false,
  },
  variant: {
    type: "enum",
    default: "default",
    enum: ["default", "primary", "secondary", "minimal", "hero", "prompt", "alt", "dark"],
  },
  layoutDensity: {
    type: "enum",
    default: "normal",
    enum: ["tight", "normal", "airy", "none"],
  },
  buttonMode: {
    type: "enum",
    default: "primary",
    enum: ["primary", "secondary", "text"],
  },
  sliderEnable: {
    type: "boolean",
    default: false,
  },
  numericInputMode: {
    type: "boolean",
    default: false,
  },
  modalEnable: {
    type: "boolean",
    default: true,
  },
  tooltipEnable: {
    type: "boolean",
    default: true,
  },
  stepSequenceMode: {
    type: "boolean",
    default: false,
  },
  collectionMode: {
    type: "enum",
    default: "list",
    enum: ["list", "grid", "masonry"],
  },
  cardMode: {
    type: "enum",
    default: "default",
    enum: ["default", "compact", "prompt", "hero-media"],
  },
  presentationMode: {
    type: "boolean",
    default: false,
  },
  dragEnable: {
    type: "boolean",
    default: false,
  },
  inlineEditEnable: {
    type: "boolean",
    default: false,
  },
  readOnlyMode: {
    type: "boolean",
    default: false,
  },
  compactMode: {
    type: "boolean",
    default: false,
  },
  advancedToggle: {
    type: "boolean",
    default: false,
  },
  roleBasedAccess: {
    type: "boolean",
    default: true,
  },
  animationLevel: {
    type: "enum",
    default: "full",
    enum: ["none", "reduced", "full"],
  },
  feedbackLevel: {
    type: "enum",
    default: "full",
    enum: ["none", "minimal", "full"],
  },
  paletteOverride: {
    type: "enum",
    default: "default",
    enum: ["default", "premium", "dark", "kids", "playful", "elderly", "french", "spanish", "crazy"],
  },
  typographyOverride: {
    type: "enum",
    default: "default",
    enum: ["default", "large", "small"],
  },
  interactionStrictness: {
    type: "enum",
    default: "standard",
    enum: ["relaxed", "standard", "strict"],
  },
  loggingVerbosity: {
    type: "enum",
    default: "normal",
    enum: ["silent", "normal", "verbose"],
  },
};

/** Ordered list of primitive keys (exactly 25). */
export const PRIMITIVE_KEYS = Object.keys(PRIMITIVE_REGISTRY) as readonly [
  "visibility",
  "disabled",
  "variant",
  "layoutDensity",
  "buttonMode",
  "sliderEnable",
  "numericInputMode",
  "modalEnable",
  "tooltipEnable",
  "stepSequenceMode",
  "collectionMode",
  "cardMode",
  "presentationMode",
  "dragEnable",
  "inlineEditEnable",
  "readOnlyMode",
  "compactMode",
  "advancedToggle",
  "roleBasedAccess",
  "animationLevel",
  "feedbackLevel",
  "paletteOverride",
  "typographyOverride",
  "interactionStrictness",
  "loggingVerbosity",
];

/** Flattened director props type: all primitives with their default types. */
export type DirectorProps = {
  [K in (typeof PRIMITIVE_KEYS)[number]]: K extends keyof typeof PRIMITIVE_REGISTRY
    ? (typeof PRIMITIVE_REGISTRY)[K] extends { type: "boolean" }
      ? boolean
      : (typeof PRIMITIVE_REGISTRY)[K] extends { type: "number" }
        ? number
        : (typeof PRIMITIVE_REGISTRY)[K] extends { enum: readonly (infer E)[] }
          ? E
          : unknown
    : unknown;
};

/** Default directorProps from registry. */
export function getDefaultDirectorProps(): DirectorProps {
  const out = {} as DirectorProps;
  for (const key of PRIMITIVE_KEYS) {
    const def = PRIMITIVE_REGISTRY[key];
    out[key as keyof DirectorProps] = def?.default as DirectorProps[keyof DirectorProps];
  }
  return out;
}
