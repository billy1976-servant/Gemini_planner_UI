"use client";

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from "react";
import { useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getCanonicalScreenKey } from "@/07_Dev_Tools/navigation/getDevScreenKey";
import { logContainerNodeIdsAfterRender } from "@/07_Dev_Tools/nav/nav-instrumentation";
import BeforeAfterSlider from "@/04_Presentation/components/molecules/BeforeAfterSlider";
import {
  getEditorMode,
  subscribeEditorMode,
} from "@/07_Dev_Tools/editor/editor-mode-store";
import { getDevicePreviewMode, subscribeDevicePreviewMode } from "@/07_Dev_Tools/dev/device-preview-store";
import { getCardDevice } from "@/07_Dev_Tools/dev/preview-derivations";
import {
  getDevSidebarProps,
  setSelectedLandingNodeId,
  subscribeDevSidebarProps,
} from "@/app/ui/control-dock/dev-right-sidebar-store";
import { registerJsonScreen } from "@/app/ui/control-dock/editor/registerJsonScreen";
import InlineEditableText from "@/app/ui/control-dock/editor/InlineEditableText";
import { getOverride, setOverride, subscribe } from "@/04_Presentation/components/organs/tsx/website/node-order-override-store";
import {
  addScreenAtEnd,
  deleteScreenById,
  duplicateScreenById,
  downloadLandingJson,
  mergeScreenOrderIntoScreens,
  moveIdInOrder,
} from "@/lib/landing-deck-mutations";
import { patchLandingScreen } from "@/lib/landing-screen-patch";
import {
  inferSlideTypeFromNode,
  SLIDE_TYPE_LABELS,
  type SlideBuilderMeta,
} from "@/lib/slide-builder-recipes";
import { getPaletteName } from "@/engine/core/palette-store";
import { applyPaletteToElement } from "@/lib/site-renderer/palette-bridge";
import { palettes } from "@/palettes";
import type { EditableNode } from "@/app/ui/control-dock/editor/NodeInspector";
import LandingSlideBuilderPanel from "@/business/Container_Creations/LandingSlideBuilderPanel";
import LandingSlideBuilderInspector from "@/business/Container_Creations/LandingSlideBuilderInspector";
import fallbackLandingConfig from "@/business/Container_Creations/landing-2.json";
import { useWizardConfig } from "@/lib/tsx-structure/engines/wizard";
import {
  renderContentBlocks,
  type LandingContentBlock,
  type LandingContentBlocksOptions,
  type MediaBlock,
} from "@/lib/landing-content-blocks";
import {
  landingScreenPresentationAttrs,
  type LandingScreenDensity,
  type LandingVisualTone,
} from "@/lib/landing-screen-presentation";
import {
  buildSummaryFromConfig,
  getScreenTrackerResponse,
  type DynamicSummaryConfig,
  type StepTrackerResponseConfig,
  type TrackerResponseConfig,
} from "@/lib/landing-tracker-responses";
import "@/app/landing/landing-theme.css";
import { isKeyboardEventFromEditableField } from "@/lib/editable-keyboard";
import {
  type LandingRuntimeMode,
  runtimeModeFromUrlParam,
  slideBuilderFromUrlParam,
} from "@/lib/slide-builder-query";
import {
  getSlideBuilderCanvasMaxWidthPx,
  getSlideBuilderLayoutPreviewLogicalWidthPx,
} from "@/lib/slide-builder-viewport";
import {
  canAdvanceWalkthroughScreen,
  mergeLandingWalkthroughValues,
  type WalkthroughScreenConfig,
} from "@/lib/landing-walkthrough";
import { normalizeDeckAppKey } from "@/lib/deck-platform/legacy-app-keys";
import { learnDeckVersionDisplayLabel, stripLearnVersionStemInput } from "@/lib/deck-platform/learn-launcher-utils";

/** Compatibility-only fallback for old non-learn pages. `/learn/*` never uses this endpoint. */
const LEGACY_CC_CONFIG_URL = "/api/container-creations-landing-config";

const EMPTY_VERSION_LIST: string[] = [];

export type LearnDeckRef = {
  appKey: string;
  flowKey: string;
};

export type LearnFlowCatalogItem = {
  appKey: string;
  flowKey: string;
  title: string;
  availableVersions: string[];
  defaultVersion: string;
};

/** Webpack/TS JSON imports may be the object or `{ default: object }`. */
function getBundledLandingFallback(): Record<string, unknown> | null {
  const raw = fallbackLandingConfig as unknown;
  const data =
    raw != null &&
    typeof raw === "object" &&
    "default" in raw &&
    (raw as { default: unknown }).default != null &&
    typeof (raw as { default: unknown }).default === "object"
      ? ((raw as { default: Record<string, unknown> }).default as Record<string, unknown>)
      : (raw as Record<string, unknown>);
  const screens = data?.screens;
  if (!data || !Array.isArray(screens) || screens.length === 0) return null;
  return data;
}

const BUILDER_VARIANT_OPTIONS = [
  { value: "", label: "None (use version)" },
  { value: "default", label: "default" },
  { value: "v1", label: "v1" },
  { value: "v2", label: "v2" },
  { value: "v3", label: "v3" },
];

/**
 * `<input>` inside `<button>` / `<a>` is invalid HTML; Space activates the parent instead of typing.
 * Use this div[role=button] when the label is InlineEditableText (editor mode).
 */
function EditableNavButton({
  className,
  style,
  dataNodeId,
  onActivate,
  disabled,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  dataNodeId?: string;
  onActivate: () => void;
  /** When true, does not activate (e.g. walkthrough gate while label is still editable). */
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const mergedStyle: React.CSSProperties = {
    ...style,
    ...(disabled ? { opacity: 0.45, cursor: "not-allowed" } : {}),
  };
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled ? true : undefined}
      className={className}
      style={mergedStyle}
      data-node-id={dataNodeId}
      onClick={(e) => {
        if (disabled) return;
        const t = e.target as HTMLElement;
        if (t.closest("input, textarea, [aria-label='Click to edit']")) return;
        e.stopPropagation();
        onActivate();
      }}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key !== "Enter" && e.key !== " ") return;
        if (isKeyboardEventFromEditableField(e)) return;
        e.preventDefault();
        onActivate();
      }}
    >
      {children}
    </div>
  );
}

/** Same as EditableNavButton but opens a URL (replaces `<a>` when label contains an editor field). */
function EditableExternalLink({
  href,
  className,
  style,
  dataNodeId,
  children,
}: {
  href: string;
  className?: string;
  style?: React.CSSProperties;
  dataNodeId?: string;
  children: React.ReactNode;
}) {
  const open = () => window.open(href, "_blank", "noopener,noreferrer");
  return (
    <span
      role="link"
      tabIndex={0}
      className={className}
      style={style}
      data-node-id={dataNodeId}
      onClick={(e) => {
        const t = e.target as HTMLElement;
        if (t.closest("input, textarea, [aria-label='Click to edit']")) return;
        e.stopPropagation();
        open();
      }}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        if (isKeyboardEventFromEditableField(e)) return;
        e.preventDefault();
        open();
      }}
    >
      {children}
    </span>
  );
}

export type LandingDeckRendererProps = {
  /** Dev instrumentation id (e.g. `landing-2`). Defaults to `landing-2`. */
  componentName?: string;
  /** Learn SSOT identity; use with `deckFlowKey` (or legacy `learnDeck`). */
  deckAppKey?: string;
  deckFlowKey?: string;
  /** Manifest version key (e.g. `v1`). */
  initialDeckVersion?: string;
  /** Manifest `availableVersions` for the version dropdown before resolve returns. */
  availableDeckVersions?: string[];
  /**
   * When set, deck JSON is loaded from `/api/learn/resolve` (folder SSOT). Omit for legacy dev imports.
   */
  learnDeck?: LearnDeckRef | null;
  /** Optional learn flow catalog for in-editor "Deck file" selection. */
  learnFlowCatalog?: LearnFlowCatalogItem[];
  /** @deprecated use `initialDeckVersion` */
  initialLearnVersion?: string;
  /** @deprecated use `availableDeckVersions` */
  initialAvailableVersions?: string[];
  /**
   * Default JSON version when the URL has no `variant` query (legacy API only).
   * Sent as `version` to the config API (e.g. `"2"` → `landing-2.json`).
   * Defaults to `"2"` for `/landing-2` parity; omit props only when using those defaults.
   */
  configVersion?: string;
  /**
   * When set by a Server Component page, avoids relying on `useSearchParams()` for `slideBuilder`
   * during SSR/hydration.
   */
  slideBuilderFlag?: boolean;
  /** Optional mode override from server search params. */
  runtimeModeParam?: LandingRuntimeMode | null;
  /**
   * When set by a Server Component page, overrides `getCanonicalScreenKey(useSearchParams())`.
   * Use `null` when `?screen=` is absent.
   */
  screenParam?: string | null;
};

export type ContainerCreationsLandingRendererProps = LandingDeckRendererProps;

/**
 * CONTENT RENDERING RULE (global — do not remove)
 * -----------------------------------------------
 * Layouts must NEVER filter content blocks by type. Every layout (hero, stamped, twoCol,
 * twoColImageLeft, textOnly, and any future layout) must render content through the single
 * universal renderer: renderContentBlocks(screen.content, options).
 * - Layouts control structure only: image placement, stacking, columns, etc.
 * - renderContentBlocks() controls which block types (paragraph, checklist, badge, heading,
 *   and future types) are rendered. Add new block types only there.
 * - Do NOT use screen.content.map(...) or filter by block.type in any layout.
 * Result: Any JSON screen can include checklist, paragraph, video, images, future blocks
 * and they will always render in both editor and preview.
 */

type ButtonBlock =
  | { type: "link"; label: string; hrefKey: string; nodeId?: string }
  | { type: "goto"; label: string; target: string; nodeId?: string }
  | { type: "next"; label: string; nodeId?: string }
  | { type: "back"; label: string; nodeId?: string };

type InlineControlId =
  | "containerLength"
  | "roofRibHeight"
  | "ventFitVerified"
  | "ventCount"
  | "orderSizeConfirmed";

type Screen = {
  id: string;
  stepLabel: string;
  layout: string;
  title: string;
  subtitle?: string;
  content: LandingContentBlock[];
  media: MediaBlock[];
  buttons: ButtonBlock[];
  nextScreenId?: string;
  inlineControls?: InlineControlId[];
  /** When true, textOnly layout shows getFinalRecommendationSummary() instead of content. */
  dynamicSummary?: boolean;
  /** Optional JSON-driven summary behavior for dynamicSummary screens. */
  dynamicSummaryConfig?: DynamicSummaryConfig;
  /** Optional tracker response rule for this step. */
  trackerResponse?: TrackerResponseConfig;
  /** When true, header and step use light theme (e.g. white background). */
  lightTheme?: boolean;
  /** Optional position for node graph editor. */
  nodePosition?: { x: number; y: number };
  /** Optional: softer or stronger visual weight for cards/headlines (CSS only). */
  visualTone?: LandingVisualTone;
  /** Optional: tighter vertical rhythm (CSS only). */
  density?: LandingScreenDensity;
  /** Slide builder only; ignored at render time. */
  builderMeta?: SlideBuilderMeta;
  /** Optional presenter behavior. */
  presentation?: {
    reveal?: "none" | "byBlock" | "custom";
    revealSequence?: string[];
  };
  /** Walkthrough: JSON-driven inputs, gates, and resume (runtimeMode=walkthrough). */
  walkthrough?: WalkthroughScreenConfig;
};

type LandingConfig = {
  shopUrl: string;
  header: { logoSrc: string; logoAlt: string; shopNowLabel: string };
  stepTracker: StepTrackerResponseConfig;
  screens: Screen[];
  /**
   * Deck-wide HiSense palette (`@/palettes` keys). When set, variables are applied to this landing root so the
   * whole deck preview matches export. Omitted = inherit app/document CSS variables.
   */
  deckPalette?: string;
};

/** Step verification inputs. roofRibHeight = roof rib height in inches (vertical corrugation). */
type StepInputs = {
  containerLength: "20ft" | "40ft" | null;
  roofRibHeight: number | null;
  ventFitVerified: boolean;
  ventCount: number | null;
  orderSizeConfirmed: boolean;
};

const INITIAL_STEP_INPUTS: StepInputs = {
  containerLength: null,
  roofRibHeight: null,
  ventFitVerified: false,
  ventCount: null,
  orderSizeConfirmed: false,
};

/** Roof rib height typical range (inches). Validation: within range = valid. */
const ROOF_RIB_HEIGHT_MIN = 1.5;
const ROOF_RIB_HEIGHT_MAX = 2.5;

/** Inline select: compact, matches landing theme. */
function InlineSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  isLight,
  ariaLabel,
}: {
  label: string;
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  isLight?: boolean;
  ariaLabel?: string;
}) {
  const border = isLight ? "#e2e8f0" : "var(--landing-steel-border)";
  const fg = isLight ? "#1a1d23" : "var(--landing-steel-fg)";
  return (
    <div className="cc-inline-verify" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
      <label style={{ fontSize: "0.9375rem", color: fg }}>{label}</label>
      <select
        aria-label={ariaLabel ?? label}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value as T)}
        style={{
          padding: "6px 10px",
          borderRadius: "var(--landing-radius, 8px)",
          border: `1px solid ${border}`,
          background: isLight ? "#fff" : "var(--landing-steel-bg-alt)",
          color: fg,
          fontSize: "0.9375rem",
          minWidth: 72,
        }}
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

/** Inline number input with optional validate() returning { valid, message }. */
function InlineNumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
  validate,
  isLight,
  ariaLabel,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  validate?: (v: number | null) => { valid: boolean; message?: string };
  isLight?: boolean;
  ariaLabel?: string;
}) {
  const border = isLight ? "#e2e8f0" : "var(--landing-steel-border)";
  const fg = isLight ? "#1a1d23" : "var(--landing-steel-fg)";
  const result = validate?.(value) ?? { valid: true };
  return (
    <div className="cc-inline-verify" style={{ marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <label style={{ fontSize: "0.9375rem", color: fg }}>{label}</label>
        <input
          type="number"
          aria-label={ariaLabel ?? label}
          value={value ?? ""}
          onChange={(e) => {
            const raw = e.target.value.trim();
            if (raw === "") onChange(null);
            else {
              const n = Number(raw);
              if (!Number.isNaN(n)) onChange(n);
            }
          }}
          min={min}
          max={max}
          step={step ?? 0.1}
          placeholder={placeholder}
          style={{
            width: 64,
            padding: "6px 8px",
            borderRadius: "var(--landing-radius, 8px)",
            border: `1px solid ${border}`,
            background: isLight ? "#fff" : "var(--landing-steel-bg-alt)",
            color: fg,
            fontSize: "0.9375rem",
          }}
        />
      </div>
      {result.message != null && (
        <span
          style={{
            fontSize: "0.875rem",
            marginTop: 4,
            display: "block",
            color: result.valid ? "#16a34a" : "#b45309",
          }}
        >
          {result.valid ? "✓ " : "⚠ "}{result.message}
        </span>
      )}
    </div>
  );
}

/** Inline checkbox: compact, matches landing theme. */
function InlineCheckbox({
  label,
  checked,
  onChange,
  id,
  isLight,
  ariaLabel,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
  isLight?: boolean;
  ariaLabel?: string;
}) {
  const fg = isLight ? "#1a1d23" : "var(--landing-steel-fg)";
  return (
    <div className="cc-inline-verify" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
      <input
        type="checkbox"
        id={id}
        aria-label={ariaLabel ?? label}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 18, height: 18, accentColor: "#2563eb" }}
      />
      <label htmlFor={id} style={{ fontSize: "0.9375rem", color: fg, cursor: "pointer" }}>{label}</label>
    </div>
  );
}

function InlineTextInput({
  label,
  value,
  onChange,
  placeholder,
  isLight,
  ariaLabel,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  isLight?: boolean;
  ariaLabel?: string;
}) {
  const border = isLight ? "#e2e8f0" : "var(--landing-steel-border)";
  const fg = isLight ? "#1a1d23" : "var(--landing-steel-fg)";
  return (
    <div className="cc-inline-verify" style={{ marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <label style={{ fontSize: "0.9375rem", color: fg }}>{label}</label>
        <input
          type="text"
          aria-label={ariaLabel ?? label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            minWidth: 140,
            padding: "6px 8px",
            borderRadius: "var(--landing-radius, 8px)",
            border: `1px solid ${border}`,
            background: isLight ? "#fff" : "var(--landing-steel-bg-alt)",
            color: fg,
            fontSize: "0.9375rem",
          }}
        />
      </div>
    </div>
  );
}

function resolveHref(btn: ButtonBlock, cfg: LandingConfig): string {
  if (btn.type === "link" && "hrefKey" in btn && btn.hrefKey === "shopUrl") {
    return cfg.shopUrl;
  }
  return cfg.shopUrl;
}

/** Renders a visible placeholder and logs a warning when media src is missing or fails to load. */
function MediaPlaceholder({ label, className }: { label: string; className?: string }) {
  if (typeof console !== "undefined") {
    console.warn("[ContainerCreations] Missing or failed media:", label);
  }
  return (
    <div
      className={className}
      style={{
        width: "100%",
        aspectRatio: "16/9",
        background: "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#94a3b8",
        fontSize: "0.875rem",
      }}
    >
      {label}
    </div>
  );
}

const stepNavButtonStyle: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: 8,
  border: "1px solid #2d3239",
  background: "transparent",
  color: "#1a1d23",
  fontWeight: 600,
  cursor: "pointer",
};

const stepNavButtonStyleSteel: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: 8,
  border: "1px solid var(--landing-steel-border)",
  background: "transparent",
  color: "var(--landing-steel-fg)",
  fontWeight: 600,
  cursor: "pointer",
};

export default function LandingDeckRenderer({
  componentName = "landing-2",
  learnDeck: learnDeckFromProp = null,
  learnFlowCatalog = [],
  deckAppKey,
  deckFlowKey,
  initialDeckVersion,
  availableDeckVersions,
  initialLearnVersion,
  initialAvailableVersions,
  configVersion = "2",
  slideBuilderFlag,
  runtimeModeParam,
  screenParam,
}: LandingDeckRendererProps = {}) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  /** When the app router passes learn props correctly, prefer them; if they are missing on the client, recover from `/learn/{app}/{flow}/{version}` (same tab URL). */
  const learnPathIdentity = useMemo((): { appKey: string; flowKey: string; versionKey: string } | null => {
    const m = /^\/learn\/([^/]+)\/([^/]+)\/([^/]+)/.exec(pathname);
    if (!m) return null;
    const appKey = normalizeDeckAppKey(decodeURIComponent(m[1]));
    const flowKey = decodeURIComponent(m[2]).trim();
    const versionKey = decodeURIComponent(m[3]).trim();
    if (!appKey || !flowKey || !versionKey) return null;
    return { appKey, flowKey, versionKey };
  }, [pathname]);

  const learnDeck = useMemo((): LearnDeckRef | null => {
    const appRaw = deckAppKey ?? learnDeckFromProp?.appKey ?? learnPathIdentity?.appKey;
    const flowRaw = deckFlowKey ?? learnDeckFromProp?.flowKey ?? learnPathIdentity?.flowKey;
    if (typeof appRaw !== "string" || typeof flowRaw !== "string") return null;
    const app = normalizeDeckAppKey(appRaw);
    const flow = flowRaw.trim();
    if (!app || !flow) return null;
    return { appKey: app, flowKey: flow };
  }, [deckAppKey, deckFlowKey, learnDeckFromProp, learnPathIdentity]);

  const resolvedInitialVersion =
    initialDeckVersion ?? initialLearnVersion ?? learnPathIdentity?.versionKey;
  const resolvedAvailableSeed = useMemo(
    () => availableDeckVersions ?? initialAvailableVersions ?? EMPTY_VERSION_LIST,
    [availableDeckVersions, initialAvailableVersions]
  );

  const wizardConfig = useWizardConfig();
  const containerRef = useRef<HTMLDivElement>(null);
  const editorMode = useSyncExternalStore(subscribeEditorMode, getEditorMode, getEditorMode);
  const isEditor = editorMode === "editor";
  const searchParams = useSearchParams();
  const initialSelectedDeckVersion = (() => {
    const appRaw = deckAppKey ?? learnDeckFromProp?.appKey ?? learnPathIdentity?.appKey;
    const flowRaw = deckFlowKey ?? learnDeckFromProp?.flowKey ?? learnPathIdentity?.flowKey;
    const hasLearnProps =
      typeof appRaw === "string" &&
      typeof flowRaw === "string" &&
      normalizeDeckAppKey(appRaw) !== "" &&
      flowRaw.trim() !== "";
    if (hasLearnProps) {
      const v = resolvedInitialVersion;
      if (v != null && String(v).trim() !== "") return String(v).trim();
      if (resolvedAvailableSeed.length > 0) return resolvedAvailableSeed[0];
      return "v1";
    }
    return searchParams.get("version") ?? configVersion;
  })();
  const deckInstanceKey = useMemo(
    () => (learnDeck ? `${learnDeck.appKey}-${learnDeck.flowKey}` : componentName),
    [learnDeck, componentName]
  );
  const runtimeModeToken = (() => {
    const fromSearchParams = searchParams.get("runtimeMode");
    if (fromSearchParams != null) return fromSearchParams;
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("runtimeMode");
  })();
  const clientRuntimeMode = runtimeModeFromUrlParam(runtimeModeToken);
  const runtimeMode: LandingRuntimeMode | null = clientRuntimeMode ?? runtimeModeParam ?? null;
  const hasExplicitRuntimeMode = runtimeMode != null;
  const legacySlideBuilder =
    slideBuilderFlag !== undefined
      ? slideBuilderFlag
      : slideBuilderFromUrlParam(searchParams.get("slideBuilder"));
  const isBuilderMode = runtimeMode === "builder";
  const isPresenterMode = runtimeMode === "presenter";
  const isWalkthroughMode = runtimeMode === "walkthrough";
  const slideBuilder = isBuilderMode || (!hasExplicitRuntimeMode && legacySlideBuilder);
  const canEdit = slideBuilder || (!hasExplicitRuntimeMode && isEditor);
  /** Require inputs before Next on consumer checklist and walkthrough; off in presenter and slide builder. */
  const isInteractiveGatedFlow =
    isWalkthroughMode || (!slideBuilder && !isPresenterMode);
  const shellDevice = useSyncExternalStore(
    subscribeDevicePreviewMode,
    getDevicePreviewMode,
    getDevicePreviewMode
  );
  /** Slide builder: follow shell device for card layout (parity with viewport selector / layout tiles). */
  const cardDevice = getCardDevice(shellDevice, slideBuilder ? "preview" : editorMode);

  const [config, setConfig] = useState<LandingConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);
  const [selectedDeckVersion, setSelectedDeckVersion] = useState(initialSelectedDeckVersion);
  const [selectedDeckVariant, setSelectedDeckVariant] = useState(
    searchParams.get("variant") ?? ""
  );
  const [learnAvailableVersions, setLearnAvailableVersions] = useState<string[]>(
    () => resolvedAvailableSeed
  );
  const [learnAllowedSchemas, setLearnAllowedSchemas] = useState<string[] | null>(null);
  const [learnManualSchema, setLearnManualSchema] = useState("");
  const [diskPersistBusy, setDiskPersistBusy] = useState(false);

  const cfg = config;
  const screens = cfg?.screens ?? [];
  const canonicalKey =
    screenParam !== undefined ? screenParam : getCanonicalScreenKey(searchParams);
  /** Stable key for registerJsonScreen + node-order overrides when `?screen=` is absent but slide builder is on. */
  const registrationKey = canonicalKey ?? (slideBuilder ? `__slideBuilder__${deckInstanceKey}` : null);
  const orderStorageKey = registrationKey ?? "";
  const orderOverride = useSyncExternalStore(
    subscribe,
    () => getOverride(orderStorageKey),
    () => getOverride(orderStorageKey)
  );
  let orderedScreens =
    orderOverride?.length && screens.length > 0
      ? orderOverride
          .map((id) => screens.find((s) => s.id === id))
          .filter((s): s is Screen => s != null)
      : screens;
  if (screens.length > 0 && orderedScreens.length === 0) {
    orderedScreens = screens;
  }
  const orderedScreenIdsStr = orderedScreens.map((s) => s.id).join("|");
  const [currentScreenId, setCurrentScreenId] = useState<string | null>(null);
  const [failedMedia, setFailedMedia] = useState<Set<string>>(new Set());
  const [stepInputs, setStepInputs] = useState<StepInputs>(INITIAL_STEP_INPUTS);
  const [walkthroughExtraValues, setWalkthroughExtraValues] = useState<Record<string, unknown>>({});
  const [walkthroughGateMessage, setWalkthroughGateMessage] = useState<string | null>(null);
  const [presenterRevealStep, setPresenterRevealStep] = useState(0);
  const [slideBuilderCanvasFullWidth, setSlideBuilderCanvasFullWidth] = useState(false);
  const walkthroughHydratedKeyRef = useRef<string | null>(null);

  const walkthroughStorageKey = useMemo(
    () =>
      `hisense-walkthrough:${deckInstanceKey}:${learnManualSchema || selectedDeckVariant || `ver:${selectedDeckVersion}`}`,
    [deckInstanceKey, learnManualSchema, selectedDeckVariant, selectedDeckVersion]
  );

  const mergedWalkthroughFormValues = useMemo(
    () => mergeLandingWalkthroughValues(stepInputs, walkthroughExtraValues),
    [stepInputs, walkthroughExtraValues]
  );

  function applyFallbackConfig() {
    const fallback = getBundledLandingFallback() as LandingConfig | null;
    if (!fallback || !Array.isArray(fallback.screens) || fallback.screens.length === 0) {
      return false;
    }
    setConfig(fallback);
    setCurrentScreenId(fallback.screens[0]?.id ?? null);
    setPresenterRevealStep(0);
    setFailedMedia(new Set());
    setLogoLoadFailed(false);
    setConfigError(null);
    if (typeof console !== "undefined") {
      console.warn("[ContainerCreations] Falling back to bundled landing-2.json");
    }
    return true;
  }

  useEffect(() => {
    let cancelled = false;
    setConfigError(null);

    if (learnDeck) {
      const qp = new URLSearchParams();
      qp.set("app", learnDeck.appKey);
      qp.set("flow", learnDeck.flowKey);
      qp.set("version", selectedDeckVersion);
      if (learnManualSchema) qp.set("schema", learnManualSchema);
      qp.set("includeBody", "1");
      qp.set("t", String(Date.now()));
      const rel = `/api/learn/resolve?${qp.toString()}`;
      const url =
        typeof window !== "undefined" ? new URL(rel, window.location.origin).href : rel;
      fetch(url, { cache: "no-store", headers: { Pragma: "no-cache" } })
        .then((res) => {
          if (cancelled) return null;
          if (!res.ok) throw new Error(res.statusText || `HTTP ${res.status}`);
          return res.json() as Promise<{
            deck?: unknown;
            availableVersions?: string[];
            allowedSchemas?: string[];
            deckRef?: { schemaKey?: string };
          }>;
        })
        .then((data) => {
          if (cancelled || data == null) return;
          if (Array.isArray(data.availableVersions) && data.availableVersions.length > 0) {
            setLearnAvailableVersions(data.availableVersions);
          }
          if (Array.isArray(data.allowedSchemas) && data.allowedSchemas.length > 0) {
            setLearnAllowedSchemas(data.allowedSchemas);
          } else {
            setLearnAllowedSchemas(null);
          }
          const allowed = data.allowedSchemas;
          if (Array.isArray(allowed) && allowed.length > 1 && data.deckRef?.schemaKey) {
            setLearnManualSchema((prev) => prev || data.deckRef!.schemaKey!);
          }
          const deck = data.deck;
          if (deck != null && typeof deck === "object") {
            setConfig(deck as LandingConfig);
            setPresenterRevealStep(0);
            setFailedMedia(new Set());
            setLogoLoadFailed(false);
            const screens = (deck as LandingConfig).screens;
            if (Array.isArray(screens) && screens.length > 0) {
              setCurrentScreenId(screens[0].id);
            }
          }
        })
        .catch((err) => {
          if (cancelled) return;
          setConfigError(err?.message ?? "Failed to load learn deck");
        });
      return () => {
        cancelled = true;
      };
    }

    const qp = new URLSearchParams();
    if (selectedDeckVariant) {
      qp.set("variant", selectedDeckVariant);
    } else {
      const v = selectedDeckVersion ?? configVersion;
      if (v) qp.set("version", v);
    }
    qp.set("t", String(Date.now()));
    const rel = `${LEGACY_CC_CONFIG_URL}?${qp.toString()}`;
    const url =
      typeof window !== "undefined" ? new URL(rel, window.location.origin).href : rel;
    fetch(url, { cache: "no-store", headers: { Pragma: "no-cache" } })
      .then((res) => {
        if (cancelled) return null;
        if (!res.ok) throw new Error(res.statusText || `HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled || data == null) return;
        setConfig(data as LandingConfig);
        setPresenterRevealStep(0);
        setFailedMedia(new Set());
        setLogoLoadFailed(false);
        if (Array.isArray(data?.screens) && data.screens.length > 0) {
          setCurrentScreenId(data.screens[0].id);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const appliedFallback = applyFallbackConfig();
        if (!appliedFallback) {
          setConfigError(err?.message ?? "Failed to load config");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [
    learnDeck,
    learnDeck?.appKey,
    learnDeck?.flowKey,
    learnManualSchema,
    configVersion,
    selectedDeckVersion,
    selectedDeckVariant,
  ]);

  useEffect(() => {
    logContainerNodeIdsAfterRender(containerRef, deckInstanceKey);
  }, [deckInstanceKey, orderedScreenIdsStr, currentScreenId]);

  useEffect(() => {
    if (!learnDeck) return;
    if (resolvedInitialVersion == null || String(resolvedInitialVersion).trim() === "") return;
    setSelectedDeckVersion(String(resolvedInitialVersion).trim());
    setLearnManualSchema("");
  }, [learnDeck?.appKey, learnDeck?.flowKey, resolvedInitialVersion]);

  useEffect(() => {
    if (resolvedAvailableSeed.length > 0) {
      setLearnAvailableVersions(resolvedAvailableSeed);
    }
  }, [resolvedAvailableSeed]);

  /** Phase A: deck palette on landing root; omit deckPalette to inherit active app palette. */
  useEffect(() => {
    if (!cfg || !containerRef.current) return;
    const name = cfg.deckPalette;
    if (name == null || name === "") {
      applyPaletteToElement(containerRef.current, getPaletteName());
      return;
    }
    const resolved = palettes[name] ? name : "default";
    applyPaletteToElement(containerRef.current, resolved);
  }, [cfg?.shopUrl, cfg?.deckPalette]);

  const onLandingConfigChangeFromSidebar = useCallback((newConfig: LandingConfig) => {
    setConfig(newConfig);
  }, []);

  /** Register landing flow with dev sidebar store when config is loaded (canonical `?screen=` or slide builder fallback key). */
  useEffect(() => {
    if (!config?.screens?.length || registrationKey == null) return;
    registerJsonScreen(
      registrationKey,
      config as Parameters<typeof registerJsonScreen>[1],
      onLandingConfigChangeFromSidebar
    );
  }, [config, registrationKey, onLandingConfigChangeFromSidebar]);

  const devProps = useSyncExternalStore(subscribeDevSidebarProps, getDevSidebarProps, getDevSidebarProps);
  const selectedLandingNodeId = devProps?.selectedLandingNodeId ?? null;

  useEffect(() => {
    if (!slideBuilder || !orderedScreenIdsStr) return;
    const ids = orderedScreenIdsStr.split("|");
    const first = ids[0];
    if (!first) return;
    const sel = selectedLandingNodeId;
    if (sel == null || !ids.includes(sel)) {
      setSelectedLandingNodeId(first);
    }
  }, [slideBuilder, orderedScreenIdsStr, selectedLandingNodeId]);

  useEffect(() => {
    if (!slideBuilder || !orderedScreenIdsStr) return;
    const ids = orderedScreenIdsStr.split("|");
    if (selectedLandingNodeId && ids.includes(selectedLandingNodeId)) {
      setCurrentScreenId(selectedLandingNodeId);
    }
  }, [slideBuilder, selectedLandingNodeId, orderedScreenIdsStr]);

  useEffect(() => {
    if (!orderedScreens.length) return;
    if (currentScreenId == null || !orderedScreens.some((s) => s.id === currentScreenId)) {
      setCurrentScreenId(orderedScreens[0].id);
    }
  }, [orderedScreenIdsStr, currentScreenId, orderedScreens]);

  /** Gated checklist: restore answers + slide from localStorage (layout phase so persist effect sees restored state). */
  useLayoutEffect(() => {
    if (!isInteractiveGatedFlow || typeof window === "undefined") return;
    if (!orderedScreenIdsStr) return;
    const marker = `${walkthroughStorageKey}|${orderedScreenIdsStr}`;
    if (walkthroughHydratedKeyRef.current === marker) return;
    walkthroughHydratedKeyRef.current = marker;
    const allowed = new Set(orderedScreenIdsStr.split("|"));
    try {
      const raw = localStorage.getItem(walkthroughStorageKey);
      if (raw) {
        const p = JSON.parse(raw) as {
          v?: number;
          currentScreenId?: string;
          stepInputs?: Partial<StepInputs>;
          extra?: Record<string, unknown>;
        };
        if (p.v === 1) {
          if (p.stepInputs) setStepInputs((prev) => ({ ...prev, ...p.stepInputs }));
          if (p.extra) setWalkthroughExtraValues(p.extra);
          if (p.currentScreenId && allowed.has(p.currentScreenId)) {
            setCurrentScreenId(p.currentScreenId);
          }
          return;
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
    setStepInputs(INITIAL_STEP_INPUTS);
    setWalkthroughExtraValues({});
  }, [isInteractiveGatedFlow, walkthroughStorageKey, orderedScreenIdsStr]);

  /** Gated checklist: persist progression. */
  useEffect(() => {
    if (!isInteractiveGatedFlow || typeof window === "undefined") return;
    if (currentScreenId == null) return;
    try {
      localStorage.setItem(
        walkthroughStorageKey,
        JSON.stringify({
          v: 1,
          currentScreenId,
          stepInputs,
          extra: walkthroughExtraValues,
        })
      );
    } catch {
      /* quota / private mode */
    }
  }, [
    isInteractiveGatedFlow,
    walkthroughStorageKey,
    currentScreenId,
    stepInputs,
    walkthroughExtraValues,
  ]);

  useEffect(() => {
    setWalkthroughGateMessage(null);
  }, [stepInputs, walkthroughExtraValues, currentScreenId]);

  useEffect(() => {
    if (!isInteractiveGatedFlow) walkthroughHydratedKeyRef.current = null;
  }, [isInteractiveGatedFlow]);

  // Scroll selected node into view when selection changes (editor mode). Skip slide builder: single preview + smooth scroll can steal focus from inputs.
  useEffect(() => {
    if (!canEdit || slideBuilder || !selectedLandingNodeId) return;
    const el = document.querySelector(`[data-screen-id="${selectedLandingNodeId}"]`) ?? document.getElementById(selectedLandingNodeId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [canEdit, slideBuilder, selectedLandingNodeId]);

  const currentIndex =
    currentScreenId == null ? -1 : orderedScreens.findIndex((s) => s.id === currentScreenId);
  const currentScreen =
    currentIndex >= 0 ? orderedScreens[currentIndex] : (orderedScreens[0] ?? null);

  const getRevealSequence = useCallback((screen: Screen | null): string[] => {
    if (!screen) return [];
    const revealMode = screen.presentation?.reveal ?? "none";
    if (revealMode === "none") return [];
    if (revealMode === "custom") {
      return (screen.presentation?.revealSequence ?? []).filter((key) =>
        /^block:\d+$/.test(key)
      );
    }
    return screen.content.map((_, idx) => `block:${idx}`);
  }, []);

  const revealSequence = getRevealSequence(currentScreen);
  const revealMax = revealSequence.length;
  const canRevealForward = isPresenterMode && revealMax > 0 && presenterRevealStep < revealMax;
  const canRevealBackward = isPresenterMode && revealMax > 0 && presenterRevealStep > 0;

  const getPresenterScreen = useCallback(
    (screen: Screen | null): Screen | null => {
      if (!screen || !isPresenterMode) return screen;
      const sequence = getRevealSequence(screen);
      if (!sequence.length) return screen;
      const visibleKeys = new Set(sequence.slice(0, presenterRevealStep));
      const content = screen.content.filter((_, idx) => visibleKeys.has(`block:${idx}`));
      return { ...screen, content };
    },
    [getRevealSequence, isPresenterMode, presenterRevealStep]
  );

  const goToScreen = (id: string) => {
    setCurrentScreenId(id);
    setPresenterRevealStep(0);
    setWalkthroughGateMessage(null);
    if (slideBuilder) setSelectedLandingNodeId(id);
  };
  const goNext = () => {
    if (!currentScreen) return;
    if (canRevealForward) {
      setPresenterRevealStep((prev) => Math.min(prev + 1, revealMax));
      return;
    }
    if (isInteractiveGatedFlow) {
      const gate = canAdvanceWalkthroughScreen({
        screen: currentScreen,
        stepInputs,
        walkthroughExtra: walkthroughExtraValues,
      });
      if (gate.ok === false) {
        setWalkthroughGateMessage(gate.message);
        return;
      }
      setWalkthroughGateMessage(null);
    }
    if (currentScreen.nextScreenId) {
      goToScreen(currentScreen.nextScreenId);
      return;
    }
    if (currentIndex >= 0 && currentIndex < orderedScreens.length - 1) {
      goToScreen(orderedScreens[currentIndex + 1].id);
    }
  };
  const goBack = () => {
    if (canRevealBackward) {
      setPresenterRevealStep((prev) => Math.max(prev - 1, 0));
      return;
    }
    if (currentIndex > 0) goToScreen(orderedScreens[currentIndex - 1].id);
  };

  useEffect(() => {
    if ((!isPresenterMode && !isInteractiveGatedFlow) || currentScreen == null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (isKeyboardEventFromEditableField(e)) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goBack();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    isPresenterMode,
    isInteractiveGatedFlow,
    currentScreen,
    currentIndex,
    orderedScreens,
    slideBuilder,
    stepInputs,
    walkthroughExtraValues,
    presenterRevealStep,
    revealMax,
  ]);

  useEffect(() => {
    setLogoLoadFailed(false);
  }, [cfg?.header?.logoSrc]);

  useEffect(() => {
    if (!isPresenterMode) return;
    setFailedMedia(new Set());
  }, [isPresenterMode, currentScreenId]);

  const learnVersionOptions = useMemo(
    () => learnAvailableVersions.map((v) => ({ value: v, label: learnDeckVersionDisplayLabel(v) })),
    [learnAvailableVersions]
  );
  const learnFlowCatalogByKey = useMemo(() => {
    const byKey = new Map<string, LearnFlowCatalogItem>();
    for (const flow of learnFlowCatalog) {
      byKey.set(`${flow.appKey}/${flow.flowKey}`, flow);
    }
    return byKey;
  }, [learnFlowCatalog]);
  const learnFlowSelectOptions = useMemo((): { value: string; label: string }[] => {
    return learnFlowCatalog.map((flow) => ({
      value: `${flow.appKey}/${flow.flowKey}`,
      label: `${flow.appKey}/${flow.flowKey} - ${flow.title}`,
    }));
  }, [learnFlowCatalog]);
  const selectedCatalogFlowValue = learnDeck ? `${learnDeck.appKey}/${learnDeck.flowKey}` : "";

  const panelVersionOptions = useMemo((): { value: string; label: string }[] | null => {
    if (!learnDeck) return null;
    if (learnVersionOptions.length > 0) return learnVersionOptions;
    if (resolvedAvailableSeed.length > 0) {
      return resolvedAvailableSeed.map((v) => ({ value: v, label: learnDeckVersionDisplayLabel(v) }));
    }
    const v = String(selectedDeckVersion || "").trim();
    return v
      ? [{ value: v, label: learnDeckVersionDisplayLabel(v) }]
      : [{ value: "v1", label: learnDeckVersionDisplayLabel("v1") }];
  }, [learnDeck, learnVersionOptions, resolvedAvailableSeed, selectedDeckVersion]);

  const learnSchemaSelectOptions = useMemo(() => {
    if (!learnAllowedSchemas || learnAllowedSchemas.length <= 1) return [];
    return learnAllowedSchemas.map((s) => ({ value: s, label: s }));
  }, [learnAllowedSchemas]);

  const buildMergedDeckForPersist = useCallback((): LandingConfig | null => {
    if (!config) return null;
    const override = registrationKey != null ? getOverride(registrationKey) : undefined;
    const mergedScreens = mergeScreenOrderIntoScreens(config.screens, override);
    return { ...config, screens: mergedScreens };
  }, [config, registrationKey]);

  const handleSaveDraft = useCallback(async () => {
    if (!learnDeck || !config) return;
    const deck = buildMergedDeckForPersist();
    if (!deck) return;
    setDiskPersistBusy(true);
    try {
      const res = await fetch("/api/learn/save-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appKey: learnDeck.appKey,
          flowKey: learnDeck.flowKey,
          versionKey: selectedDeckVersion,
          deck,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || res.statusText);
      setConfig(deck);
      router.refresh();
      window.alert("Saved to disk.");
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Save failed");
    } finally {
      setDiskPersistBusy(false);
    }
  }, [learnDeck, config, selectedDeckVersion, buildMergedDeckForPersist, router]);

  const handleCreateVersion = useCallback(async () => {
    if (!learnDeck || !config) return;
    const deck = buildMergedDeckForPersist();
    if (!deck) return;
    const versionList =
      learnAvailableVersions.length > 0 ? learnAvailableVersions : resolvedAvailableSeed;
    const suggestedVersion = `${selectedDeckVersion}_copy`;
    const rawInput = window.prompt("New version name (saved as <name>.json):", suggestedVersion);
    if (rawInput == null) return;
    const toVersion = stripLearnVersionStemInput(rawInput);
    if (!toVersion) {
      window.alert("Version name is required.");
      return;
    }
    if (versionList.includes(toVersion)) {
      window.alert(`"${toVersion}.json" already exists.`);
      return;
    }
    setDiskPersistBusy(true);
    try {
      const saveRes = await fetch("/api/learn/save-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appKey: learnDeck.appKey,
          flowKey: learnDeck.flowKey,
          versionKey: selectedDeckVersion,
          deck,
        }),
      });
      const saveData = (await saveRes.json().catch(() => ({}))) as { error?: string };
      if (!saveRes.ok) throw new Error(saveData.error || saveRes.statusText || "Save before new version failed");

      const res = await fetch("/api/learn/create-version", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appKey: learnDeck.appKey,
          flowKey: learnDeck.flowKey,
          fromVersion: selectedDeckVersion,
          toVersion,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; availableVersions?: string[] };
      if (!res.ok) throw new Error(data.error || res.statusText);
      if (Array.isArray(data.availableVersions)) {
        setLearnAvailableVersions(data.availableVersions);
      }
      setConfig(deck);
      setSelectedDeckVersion(toVersion);
      setLearnManualSchema("");
      const sp = new URLSearchParams(searchParams.toString());
      sp.delete("version");
      sp.delete("variant");
      const q = sp.toString();
      router.replace(
        `/learn/${learnDeck.appKey}/${learnDeck.flowKey}/${encodeURIComponent(toVersion)}${q ? `?${q}` : ""}`
      );
      router.refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Create version failed");
    } finally {
      setDiskPersistBusy(false);
    }
  }, [
    learnDeck,
    config,
    learnAvailableVersions,
    resolvedAvailableSeed,
    selectedDeckVersion,
    router,
    searchParams,
    buildMergedDeckForPersist,
  ]);

  function updateScreenField(
    screenId: string,
    field: keyof Screen,
    value: string | undefined
  ) {
    if (!config) return;
    setConfig({
      ...config,
      screens: config.screens.map((s) =>
        s.id === screenId ? { ...s, [field]: value } : s
      ),
    });
  }

  function updateScreenContentBlock(screenId: string, blockIndex: number, text: string) {
    if (!config) return;
    setConfig({
      ...config,
      screens: config.screens.map((s) => {
        if (s.id !== screenId || !s.content?.[blockIndex]) return s;
        const content = [...s.content];
        const block = content[blockIndex];
        if (block && "text" in block) {
          content[blockIndex] = { ...block, text };
        }
        return { ...s, content };
      }),
    });
  }

  function updateScreenButtonLabel(screenId: string, buttonIndex: number, label: string) {
    if (!config) return;
    setConfig({
      ...config,
      screens: config.screens.map((s) => {
        if (s.id !== screenId || !s.buttons?.[buttonIndex]) return s;
        const buttons = [...s.buttons];
        buttons[buttonIndex] = { ...buttons[buttonIndex], label };
        return { ...s, buttons };
      }),
    });
  }

  function updateBadgeBlock(screenId: string, blockIndex: number, text: string) {
    if (!config) return;
    setConfig({
      ...config,
      screens: config.screens.map((s) => {
        if (s.id !== screenId || !s.content?.[blockIndex]) return s;
        const content = [...s.content];
        const block = content[blockIndex];
        if (block && block.type === "badge") {
          content[blockIndex] = { ...block, text };
        }
        return { ...s, content };
      }),
    });
  }

  function updateHeadingContentBlock(screenId: string, blockIndex: number, text: string) {
    if (!config) return;
    setConfig({
      ...config,
      screens: config.screens.map((s) => {
        if (s.id !== screenId || !s.content?.[blockIndex]) return s;
        const content = [...s.content];
        const block = content[blockIndex];
        if (block && block.type === "heading") {
          content[blockIndex] = { ...block, text };
        }
        return { ...s, content };
      }),
    });
  }

  function updateComparisonHeading(screenId: string, blockIndex: number, heading: string) {
    if (!config) return;
    setConfig({
      ...config,
      screens: config.screens.map((s) => {
        if (s.id !== screenId || !s.content?.[blockIndex]) return s;
        const content = [...s.content];
        const block = content[blockIndex];
        if (block && block.type === "comparison") {
          content[blockIndex] = { ...block, heading };
        }
        return { ...s, content };
      }),
    });
  }

  function updateComparisonColumnLabel(
    screenId: string,
    blockIndex: number,
    side: "left" | "right",
    text: string
  ) {
    if (!config) return;
    setConfig({
      ...config,
      screens: config.screens.map((s) => {
        if (s.id !== screenId || !s.content?.[blockIndex]) return s;
        const content = [...s.content];
        const block = content[blockIndex];
        if (block && block.type === "comparison") {
          content[blockIndex] = {
            ...block,
            columnLabels: { ...(block.columnLabels ?? {}), [side]: text },
          };
        }
        return { ...s, content };
      }),
    });
  }

  function updateComparisonRowCell(
    screenId: string,
    blockIndex: number,
    rowIndex: number,
    side: "left" | "right",
    text: string
  ) {
    if (!config) return;
    setConfig({
      ...config,
      screens: config.screens.map((s) => {
        if (s.id !== screenId || !s.content?.[blockIndex]) return s;
        const content = [...s.content];
        const block = content[blockIndex];
        if (block && block.type === "comparison" && block.rows[rowIndex]) {
          const rows = [...block.rows];
          rows[rowIndex] = { ...rows[rowIndex], [side]: text };
          content[blockIndex] = { ...block, rows };
        }
        return { ...s, content };
      }),
    });
  }

  function updateStatsItem(
    screenId: string,
    blockIndex: number,
    itemIndex: number,
    field: "label" | "value" | "hint",
    text: string
  ) {
    if (!config) return;
    setConfig({
      ...config,
      screens: config.screens.map((s) => {
        if (s.id !== screenId || !s.content?.[blockIndex]) return s;
        const content = [...s.content];
        const block = content[blockIndex];
        if (block && block.type === "stats" && block.items[itemIndex]) {
          const items = [...block.items];
          const item = items[itemIndex];
          items[itemIndex] =
            field === "hint"
              ? { ...item, hint: text.trim() ? text : undefined }
              : { ...item, [field]: text };
          content[blockIndex] = { ...block, items };
        }
        return { ...s, content };
      }),
    });
  }

  function updateTrustStripItemLabel(
    screenId: string,
    blockIndex: number,
    itemIndex: number,
    label: string
  ) {
    if (!config) return;
    setConfig({
      ...config,
      screens: config.screens.map((s) => {
        if (s.id !== screenId || !s.content?.[blockIndex]) return s;
        const content = [...s.content];
        const block = content[blockIndex];
        if (block && block.type === "trustStrip" && block.items[itemIndex]) {
          const items = [...block.items];
          items[itemIndex] = { ...items[itemIndex], label };
          content[blockIndex] = { ...block, items };
        }
        return { ...s, content };
      }),
    });
  }

  function updateIconFeaturesItem(
    screenId: string,
    blockIndex: number,
    itemIndex: number,
    field: "title" | "sub",
    text: string
  ) {
    if (!config) return;
    setConfig({
      ...config,
      screens: config.screens.map((s) => {
        if (s.id !== screenId || !s.content?.[blockIndex]) return s;
        const content = [...s.content];
        const block = content[blockIndex];
        if (block && block.type === "iconFeatures" && block.items[itemIndex]) {
          const items = [...block.items];
          const item = items[itemIndex];
          items[itemIndex] =
            field === "sub"
              ? { ...item, sub: text.trim() ? text : undefined }
              : { ...item, title: text };
          content[blockIndex] = { ...block, items };
        }
        return { ...s, content };
      }),
    });
  }

  function updateTestimonialField(
    screenId: string,
    blockIndex: number,
    field: "quote" | "author" | "role" | "location",
    text: string
  ) {
    if (!config) return;
    setConfig({
      ...config,
      screens: config.screens.map((s) => {
        if (s.id !== screenId || !s.content?.[blockIndex]) return s;
        const content = [...s.content];
        const block = content[blockIndex];
        if (block && block.type === "testimonial") {
          const v =
            field === "role" || field === "location"
              ? text.trim() || undefined
              : text;
          content[blockIndex] = { ...block, [field]: v };
        }
        return { ...s, content };
      }),
    });
  }

  function updateCtaBandField(
    screenId: string,
    blockIndex: number,
    field: "headline" | "sub",
    text: string
  ) {
    if (!config) return;
    setConfig({
      ...config,
      screens: config.screens.map((s) => {
        if (s.id !== screenId || !s.content?.[blockIndex]) return s;
        const content = [...s.content];
        const block = content[blockIndex];
        if (block && block.type === "ctaBand") {
          content[blockIndex] =
            field === "sub"
              ? { ...block, sub: text.trim() ? text : undefined }
              : { ...block, headline: text };
        }
        return { ...s, content };
      }),
    });
  }

  function updateHeaderShopNowLabel(label: string) {
    if (!config) return;
    setConfig({
      ...config,
      header: { ...config.header, shopNowLabel: label },
    });
  }

  /** Temporary: proves client mount + resolve state (remove after live learn host is verified). */
  const learnClientDebug =
    learnDeck != null ? (
      <div
        data-learn-deck-debug="1"
        style={{
          fontSize: 12,
          padding: "6px 10px",
          background: "#e0e7ff",
          color: "#312e81",
          borderBottom: "1px solid #6366f1",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        [learn client] {learnDeck.appKey}/{learnDeck.flowKey} · pathname={pathname || "—"} · v=
        {selectedDeckVersion} · config={config ? `${screens.length} screens` : "null"} · current=
        {currentScreen?.id ?? "null"} · err={configError ?? "—"}
      </div>
    ) : null;

  if (configError) {
    return (
      <>
        {learnClientDebug}
        <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
          Failed to load config: {configError}
        </div>
      </>
    );
  }

  if (!config || screens.length === 0 || currentScreen == null) {
    return (
      <>
        {learnClientDebug}
        <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
          Loading…
        </div>
      </>
    );
  }

  const isHero = currentScreen.layout === "hero";
  const isLightStep = currentScreen.lightTheme === true;
  const lightLayoutStep =
    (currentScreen.layout === "twoCol" ||
      currentScreen.layout === "proofPanel" ||
      currentScreen.layout === "splitProof") &&
    currentScreen.lightTheme === true;

  function isStepInputFieldId(id: string): id is keyof StepInputs {
    return (
      id === "containerLength" ||
      id === "roofRibHeight" ||
      id === "ventFitVerified" ||
      id === "ventCount" ||
      id === "orderSizeConfirmed"
    );
  }

  function readWalkthroughFieldValue(fieldId: string): unknown {
    if (isStepInputFieldId(fieldId)) return stepInputs[fieldId];
    return walkthroughExtraValues[fieldId];
  }

  function applyWalkthroughFieldValue(fieldId: string, value: unknown) {
    if (fieldId === "containerLength") {
      setStepInputs((p) => ({
        ...p,
        containerLength: value as StepInputs["containerLength"],
      }));
      return;
    }
    if (fieldId === "roofRibHeight") {
      setStepInputs((p) => ({ ...p, roofRibHeight: value as number | null }));
      return;
    }
    if (fieldId === "ventFitVerified") {
      setStepInputs((p) => ({ ...p, ventFitVerified: Boolean(value) }));
      return;
    }
    if (fieldId === "ventCount") {
      setStepInputs((p) => ({ ...p, ventCount: value as number | null }));
      return;
    }
    if (fieldId === "orderSizeConfirmed") {
      setStepInputs((p) => ({ ...p, orderSizeConfirmed: Boolean(value) }));
      return;
    }
    setWalkthroughExtraValues((prev) => ({ ...prev, [fieldId]: value }));
  }

  /** JSON-driven walkthrough inputs (Phase 3). When present, replaces legacy inlineControls on that slide. */
  function renderWalkthroughSchemaFields(screen: Screen, isLight: boolean): React.ReactNode {
    const defs = screen.walkthrough?.inputs;
    if (!defs?.length) return null;
    return (
      <>
        {defs.map((def) => {
          const fieldKey = `${screen.id}-${def.id}`;
          const raw = readWalkthroughFieldValue(def.id);
          if (def.type === "select") {
            return (
              <InlineSelect
                key={fieldKey}
                label={def.label}
                value={(typeof raw === "string" ? raw : null) as string | null}
                options={(def.options ?? []) as { value: string; label: string }[]}
                onChange={(v) => applyWalkthroughFieldValue(def.id, v)}
                isLight={isLight}
                ariaLabel={def.label}
              />
            );
          }
          if (def.type === "number") {
            return (
              <InlineNumberInput
                key={fieldKey}
                label={def.label}
                value={typeof raw === "number" && !Number.isNaN(raw) ? raw : null}
                onChange={(v) => applyWalkthroughFieldValue(def.id, v)}
                min={def.min}
                max={def.max}
                step={def.step ?? 0.1}
                placeholder={def.placeholder}
                isLight={isLight}
                ariaLabel={def.label}
              />
            );
          }
          if (def.type === "boolean") {
            return (
              <InlineCheckbox
                key={fieldKey}
                id={`wt-${fieldKey}`}
                label={def.trueLabel ?? def.label}
                checked={raw === true}
                onChange={(v) => applyWalkthroughFieldValue(def.id, v)}
                isLight={isLight}
                ariaLabel={def.label}
              />
            );
          }
          return (
            <InlineTextInput
              key={fieldKey}
              label={def.label}
              value={typeof raw === "string" ? raw : ""}
              onChange={(v) => applyWalkthroughFieldValue(def.id, v)}
              placeholder={def.placeholder}
              isLight={isLight}
              ariaLabel={def.label}
            />
          );
        })}
      </>
    );
  }

  /** Renders a single inline control by type. Driven by screen.inlineControls from config. */
  function renderInlineControl(type: InlineControlId, isLight: boolean): React.ReactNode {
    switch (type) {
      case "containerLength":
        return (
          <InlineSelect
            key="containerLength"
            label="Container length"
            value={stepInputs.containerLength}
            options={[{ value: "20ft", label: "20 ft" }, { value: "40ft", label: "40 ft" }]}
            onChange={(v) => setStepInputs((p) => ({ ...p, containerLength: v }))}
            isLight={isLight}
            ariaLabel="Container length"
          />
        );
      case "roofRibHeight":
        return (
          <InlineNumberInput
            key="roofRibHeight"
            label="Roof rib height (in.)"
            value={stepInputs.roofRibHeight}
            onChange={(v) => setStepInputs((p) => ({ ...p, roofRibHeight: v }))}
            min={0.5}
            max={5}
            step={0.1}
            placeholder="e.g. 2"
            validate={(v) => {
              if (v == null) return { valid: true };
              if (v >= ROOF_RIB_HEIGHT_MIN && v <= ROOF_RIB_HEIGHT_MAX) return { valid: true, message: "Within typical range." };
              return { valid: false, message: `Typical range is ${ROOF_RIB_HEIGHT_MIN}–${ROOF_RIB_HEIGHT_MAX} in. Confirm your measurement.` };
            }}
            isLight={isLight}
            ariaLabel="Roof rib height in inches"
          />
        );
      case "ventFitVerified":
        return (
          <InlineCheckbox
            key="ventFitVerified"
            id="vent-fit-verified"
            label="I've verified the 12″ vent fits my roof."
            checked={stepInputs.ventFitVerified}
            onChange={(v) => setStepInputs((p) => ({ ...p, ventFitVerified: v }))}
            isLight={isLight}
            ariaLabel="Verify 12 inch vent fits my roof"
          />
        );
      case "ventCount":
        return (
          <InlineNumberInput
            key="ventCount"
            label="Number of vents"
            value={stepInputs.ventCount}
            onChange={(v) => setStepInputs((p) => ({ ...p, ventCount: v }))}
            min={1}
            max={10}
            step={1}
            placeholder="1"
            validate={(v) => {
              if (v == null) return { valid: true };
              if (v >= 1 && v <= 10) return { valid: true, message: `We recommend ${v} vent(s) for your setup.` };
              return { valid: false, message: "Enter 1–10." };
            }}
            isLight={isLight}
            ariaLabel="Number of vents"
          />
        );
      case "orderSizeConfirmed":
        return (
          <InlineCheckbox
            key="orderSizeConfirmed"
            id="order-size-confirmed"
            label="I'll order the recommended size."
            checked={stepInputs.orderSizeConfirmed}
            onChange={(v) => setStepInputs((p) => ({ ...p, orderSizeConfirmed: v }))}
            isLight={isLight}
            ariaLabel="Order recommended size"
          />
        );
      default:
        return null;
    }
  }

  /** Renders inline verification controls from screen.inlineControls (config-driven). */
  function renderInlineUI(screen: Screen, isLight: boolean) {
    if (screen.walkthrough?.inputs?.length) {
      return renderWalkthroughSchemaFields(screen, isLight);
    }
    const controls = screen.inlineControls ?? [];
    if (!controls.length) return null;
    return <>{controls.map((type) => renderInlineControl(type, isLight))}</>;
  }

  /** Legacy summary output retained for backwards compatibility. */
  function getLegacyFinalRecommendationSummary(): string {
    const parts: string[] = [];
    if (stepInputs.containerLength) parts.push(`Container: ${stepInputs.containerLength}.`);
    if (stepInputs.roofRibHeight != null) parts.push(`Roof rib height: ${stepInputs.roofRibHeight} in.`);
    const vents = stepInputs.ventCount ?? 1;
    parts.push(`Recommended vents: ${vents} × 12-inch.`);
    if (stepInputs.ventFitVerified) parts.push("Vent fit verified.");
    if (stepInputs.orderSizeConfirmed) parts.push("Order size confirmed.");
    return parts.length ? parts.join(" ") : "Complete the steps above to see your recommendation.";
  }

  function getFinalRecommendationSummary(screen: Screen): string {
    return buildSummaryFromConfig({
      screens: orderedScreens,
      values: mergedWalkthroughFormValues,
      summaryConfig: screen.dynamicSummaryConfig,
      trackerConfig: cfg.stepTracker,
      legacyFallback: getLegacyFinalRecommendationSummary,
    });
  }

  function renderButtons(
    screen: Screen,
    useSteelStyle = false,
    isEdit?: boolean,
    onButtonLabelChange?: (buttonIndex: number, label: string) => void
  ) {
    const btnStyle = useSteelStyle ? stepNavButtonStyleSteel : stepNavButtonStyle;
    const labelNode = (btn: ButtonBlock, i: number) =>
      isEdit && onButtonLabelChange ? (
        <InlineEditableText
          value={btn.label}
          onChange={(v) => onButtonLabelChange(i, v)}
          isEditing
          as="span"
        />
      ) : (
        btn.label
      );
    const gatedNextAllowed =
      !isInteractiveGatedFlow ||
      canAdvanceWalkthroughScreen({
        screen,
        stepInputs,
        walkthroughExtra: walkthroughExtraValues,
      }).ok;

    return (
      <div className="cc-step-nav">
        {screen.buttons.map((btn, i) => {
          const nodeId = "nodeId" in btn ? btn.nodeId : undefined;
          if (btn.type === "link") {
            const href = resolveHref(btn, cfg);
            if (isEdit && onButtonLabelChange) {
              return (
                <EditableExternalLink
                  key={i}
                  href={href}
                  className="hero-cta"
                  style={{ display: "inline-block", textDecoration: "none", marginTop: 0, cursor: "pointer" }}
                  dataNodeId={nodeId}
                >
                  {labelNode(btn, i)}
                </EditableExternalLink>
              );
            }
            return (
              <a
                key={i}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-cta"
                style={{ display: "inline-block", textDecoration: "none", marginTop: 0 }}
                data-node-id={nodeId}
              >
                {labelNode(btn, i)}
              </a>
            );
          }
          if (btn.type === "goto") {
            if (isEdit && onButtonLabelChange) {
              return (
                <EditableNavButton
                  key={i}
                  className="hero-cta"
                  dataNodeId={nodeId}
                  onActivate={() => goToScreen(btn.target)}
                >
                  {labelNode(btn, i)}
                </EditableNavButton>
              );
            }
            return (
              <button
                key={i}
                type="button"
                className="hero-cta"
                onClick={() => goToScreen(btn.target)}
                data-node-id={nodeId}
              >
                {labelNode(btn, i)}
              </button>
            );
          }
          if (btn.type === "next") {
            const nextBlocked = isInteractiveGatedFlow && !gatedNextAllowed;
            if (isEdit && onButtonLabelChange) {
              return (
                <EditableNavButton
                  key={i}
                  className="hero-cta"
                  dataNodeId={nodeId}
                  disabled={nextBlocked}
                  onActivate={goNext}
                >
                  {labelNode(btn, i)}
                </EditableNavButton>
              );
            }
            return (
              <button
                key={i}
                type="button"
                className="hero-cta"
                onClick={goNext}
                disabled={nextBlocked}
                data-node-id={nodeId}
              >
                {labelNode(btn, i)}
              </button>
            );
          }
          if (btn.type === "back") {
            if (isEdit && onButtonLabelChange) {
              return (
                <EditableNavButton key={i} dataNodeId={nodeId} style={btnStyle} onActivate={goBack}>
                  {labelNode(btn, i)}
                </EditableNavButton>
              );
            }
            return (
              <button
                key={i}
                type="button"
                onClick={goBack}
                data-node-id={nodeId}
                style={btnStyle}
              >
                {labelNode(btn, i)}
              </button>
            );
          }
          return null;
        })}
      </div>
    );
  }

  function renderMediaItem(
    m: MediaBlock,
    i: number,
    ctx: {
      placement: "hero" | "stamped" | "card";
      /** Framing for proof layouts (CSS: .cc-media-slot--proofBand | --splitFrame). */
      surface?: "proofBand" | "splitFrame";
      /**
       * Layout picker tiles: must not write to global `failedMedia` (would blank the main slide)
       * or rely on lazy-loading inside scaled/overflow clips.
       */
      preview?: boolean;
    }
  ): React.ReactNode {
    const isPreview = ctx.preview === true;
    const markVideoFailed = (src: string) => {
      if (isPreview) return;
      setFailedMedia((prev) => new Set(prev).add(src));
    };

    const defaultObjectFit: "cover" | "contain" = (() => {
      if (ctx.surface === "splitFrame") return "cover";
      if (ctx.surface === "proofBand") return "cover";
      return ctx.placement === "card" ? "cover" : "contain";
    })();

    const slotClass = `cc-media-slot${ctx.surface ? ` cc-media-slot--${ctx.surface}` : ""}`;

    const wrapSlot = (inner: React.ReactNode) => (
      <div key={i} className={slotClass}>
        {inner}
      </div>
    );

    if (m.type === "video") {
      if (!isPreview && failedMedia.has(m.src)) {
        return wrapSlot(<MediaPlaceholder label={ctx.placement === "hero" ? "Intro video" : "Video"} />);
      }
      const fit = m.objectFit ?? defaultObjectFit;
      const videoEl = (
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={m.poster}
          preload={isPreview ? "metadata" : undefined}
          onError={() => markVideoFailed(m.src)}
          src={m.src}
          className="cc-media-video"
          style={{
            width: "100%",
            height: m.aspectRatio ? "100%" : "auto",
            maxHeight: m.maxHeight,
            objectFit: fit,
            display: "block",
          }}
        />
      );
      const videoBlock = (
        <>
          {m.aspectRatio ? (
            <div className="cc-media-frame" style={{ aspectRatio: m.aspectRatio }}>
              {videoEl}
            </div>
          ) : (
            videoEl
          )}
          {m.caption != null && (
            <p className={`cc-media-caption${ctx.surface === "proofBand" ? " cc-media-caption--overlay" : ""}`}>{m.caption}</p>
          )}
        </>
      );
      const inner = m.fullBleed ? <div className="cc-media-fullbleed">{videoBlock}</div> : videoBlock;
      return wrapSlot(inner);
    }

    if (m.type === "image") {
      const alt = m.decorative ? "" : m.alt;
      const img = (
        <img
          src={m.src}
          alt={alt}
          loading={isPreview ? "eager" : (m.loading ?? "lazy")}
          className="cc-media-img"
          style={{
            width: "100%",
            height: m.aspectRatio ? "100%" : "auto",
            objectFit: m.objectFit ?? defaultObjectFit,
            maxHeight: m.maxHeight,
            display: "block",
          }}
          {...(m.decorative ? { role: "presentation" as const } : {})}
        />
      );
      const imgBlock = m.aspectRatio ? (
        <div className="cc-media-frame" style={{ aspectRatio: m.aspectRatio }}>
          {img}
        </div>
      ) : (
        img
      );
      const inner = m.fullBleed ? <div className="cc-media-fullbleed">{imgBlock}</div> : imgBlock;
      return wrapSlot(inner);
    }

    if (m.type === "beforeAfter") {
      const inner = (
        <BeforeAfterSlider
          beforeSrc={m.before}
          afterSrc={m.after}
          altBefore={m.altBefore}
          altAfter={m.altAfter}
          darkenBefore
          objectFit={m.objectFit ?? (ctx.surface === "splitFrame" ? "cover" : "contain")}
        />
      );
      const wrapped = m.aspectRatio ? (
        <div className="cc-media-frame cc-media-frame--before-after" style={{ aspectRatio: m.aspectRatio }}>
          {inner}
        </div>
      ) : (
        inner
      );
      const outer = m.fullBleed ? <div className="cc-media-fullbleed">{wrapped}</div> : wrapped;
      return wrapSlot(outer);
    }

    if (m.type === "imageGrid") {
      const cols = m.columns ?? 2;
      return wrapSlot(
        <div
          className={`cc-image-grid cc-image-grid--cols-${cols}`}
          style={m.gap ? { gap: m.gap } : undefined}
        >
          {m.images.map((imgEl, j) => (
            <img
              key={j}
              src={imgEl.src}
              alt={imgEl.alt}
              loading={isPreview ? "eager" : "lazy"}
              className="cc-image-grid__img"
            />
          ))}
        </div>
      );
    }

    return null;
  }

  function renderScreen(
    screen: Screen,
    renderOpts?: { preview?: boolean; layoutOverride?: string }
  ) {
    const preview = renderOpts?.preview ?? false;
    const layoutKey = (renderOpts?.layoutOverride ?? screen.layout ?? "").toString();
    const effectiveCanEdit = !preview && canEdit;
    // SAFETY: Every layout must use renderContentBlocks(screen.content, ...) only. No screen.content.map or block.type filtering.
    const contentBlocksOpts: LandingContentBlocksOptions = effectiveCanEdit
      ? {
          isEditor: true,
          screenId: screen.id,
          onParagraphChange: (i, t) => updateScreenContentBlock(screen.id, i, t),
          onHeadingBlockChange: (i, t) => updateHeadingContentBlock(screen.id, i, t),
          onBadgeChange: (i, t) => updateBadgeBlock(screen.id, i, t),
          onTrustStripItemChange: (bi, ii, t) =>
            updateTrustStripItemLabel(screen.id, bi, ii, t),
          onComparisonHeadingChange: (i, h) => updateComparisonHeading(screen.id, i, h),
          onComparisonColumnLabelChange: (i, side, t) =>
            updateComparisonColumnLabel(screen.id, i, side, t),
          onComparisonRowCellChange: (i, ri, side, t) =>
            updateComparisonRowCell(screen.id, i, ri, side, t),
          onStatsItemChange: (i, ii, field, t) => updateStatsItem(screen.id, i, ii, field, t),
          onIconFeaturesItemChange: (i, ii, field, t) =>
            updateIconFeaturesItem(screen.id, i, ii, field, t),
          onTestimonialFieldChange: (i, field, t) =>
            updateTestimonialField(screen.id, i, field, t),
          onCtaBandFieldChange: (i, field, t) => updateCtaBandField(screen.id, i, field, t),
          checklistHeadingClassName: "cc-stamped-checklist-heading",
          checklistListClassName: "cc-stamped-checklist",
        }
      : {
          checklistHeadingClassName: "cc-stamped-checklist-heading",
          checklistListClassName: "cc-stamped-checklist",
        };
    const isSelected = effectiveCanEdit && selectedLandingNodeId === screen.id;
    const outlineStyle: React.CSSProperties = isSelected
      ? { outline: "2px solid var(--color-accent, #1a73e8)", outlineOffset: 2 }
      : {};
    const selectNodeProps = effectiveCanEdit
      ? {
          onClick: (e: React.MouseEvent) => {
            const t = e.target as HTMLElement;
            if (
              t.closest(
                "input, textarea, select, button, a[href], label, [role='link'], [role='button'], [aria-label='Click to edit']"
              )
            ) {
              return;
            }
            setSelectedLandingNodeId(screen.id);
          },
        }
      : {};
    const containerStyle: React.CSSProperties = effectiveCanEdit
      ? { ...outlineStyle, cursor: "pointer" }
      : outlineStyle;

    switch (layoutKey) {
      case "hero": {
        const videoBlock = screen.media.find((m) => m.type === "video");
        const heroLinkButton = screen.buttons.filter((b) => b.type === "link").slice(0, 1)[0];
        const heroLinkIndex = heroLinkButton ? screen.buttons.indexOf(heroLinkButton) : -1;
        return (
          <div style={containerStyle} data-screen-id={screen.id} {...selectNodeProps}>
            <section id={screen.id} className="landing-hero-video-wrap">
              {videoBlock && videoBlock.type === "video"
                ? renderMediaItem(videoBlock, screen.media.indexOf(videoBlock), { placement: "hero", preview })
                : null}
              {heroLinkButton &&
                (effectiveCanEdit ? (
                  <EditableExternalLink
                    href={resolveHref(heroLinkButton, cfg)}
                    className="landing-hero-shop-link"
                    style={{ cursor: "pointer" }}
                    dataNodeId={"nodeId" in heroLinkButton ? heroLinkButton.nodeId : undefined}
                  >
                    <InlineEditableText
                      value={heroLinkButton.label}
                      onChange={(v) => updateScreenButtonLabel(screen.id, heroLinkIndex, v)}
                      isEditing
                      as="span"
                    />
                  </EditableExternalLink>
                ) : (
                  <a
                    href={resolveHref(heroLinkButton, cfg)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="landing-hero-shop-link"
                    data-node-id={"nodeId" in heroLinkButton ? heroLinkButton.nodeId : undefined}
                  >
                    {heroLinkButton.label}
                  </a>
                ))}
            </section>
            <section id="explore-container" className="hero-intro">
              <div style={{ minHeight: "1.2em" }}>
                <InlineEditableText
                  value={screen.title}
                  onChange={(v) => updateScreenField(screen.id, "title", v)}
                  isEditing={effectiveCanEdit}
                  as="h1"
                  className="hero-title"
                />
              </div>
              {screen.subtitle != null || effectiveCanEdit ? (
                <InlineEditableText
                  value={screen.subtitle ?? ""}
                  onChange={(v) => updateScreenField(screen.id, "subtitle", v || undefined)}
                  isEditing={effectiveCanEdit}
                  as="p"
                  className="hero-subtitle"
                  multiline
                />
              ) : null}
              {renderContentBlocks(screen.content, contentBlocksOpts)}
              {screen.buttons.filter((b) => b.type === "goto").map((btn, j) => {
                const idx = screen.buttons.indexOf(btn);
                return effectiveCanEdit ? (
                  <EditableNavButton
                    key={j}
                    className="hero-cta"
                    dataNodeId={btn.nodeId}
                    onActivate={() => goToScreen(btn.target)}
                  >
                    <InlineEditableText
                      value={btn.label}
                      onChange={(v) => updateScreenButtonLabel(screen.id, idx, v)}
                      isEditing
                      as="span"
                    />
                  </EditableNavButton>
                ) : (
                  <button key={j} type="button" className="hero-cta" onClick={() => goToScreen(btn.target)} data-node-id={btn.nodeId}>
                    {btn.label}
                  </button>
                );
              })}
            </section>
          </div>
        );
      }

      case "stamped":
        return (
          <section id={screen.id} className="landing-content-block" style={containerStyle} {...selectNodeProps}>
            <section className="cc-stamped-section">
              <div style={{ minHeight: "1.2em" }}>
                <InlineEditableText
                  value={screen.title}
                  onChange={(v) => updateScreenField(screen.id, "title", v)}
                  isEditing={effectiveCanEdit}
                  as="h2"
                  className="cc-stamped-heading"
                />
              </div>
              <div className="cc-stamped-description">
                {renderContentBlocks(screen.content, contentBlocksOpts)}
              </div>
              <div className="landing-phone-video-wrap cc-stamped-media">
                {screen.media.map((m, i) => renderMediaItem(m, i, { placement: "stamped", preview }))}
              </div>
              {renderInlineUI(screen, true)}
              {renderButtons(screen, false, effectiveCanEdit, (idx, label) => updateScreenButtonLabel(screen.id, idx, label))}
            </section>
          </section>
        );

      case "twoCol": {
        const useLightCard = screen.lightTheme === true;
        const twoColContent = (
          <div className="cc-two-col cc-step-card">
            <div
              className={`cc-media-card${useLightCard ? " cc-media-card--light" : ""}`}
            >
              {screen.media.map((m, i) => renderMediaItem(m, i, { placement: "card", preview }))}
            </div>
            <div className={`cc-text${useLightCard ? " cc-text--on-light" : ""}`}>
              <div style={{ minHeight: "1.2em" }}>
                <InlineEditableText
                  value={screen.title}
                  onChange={(v) => updateScreenField(screen.id, "title", v)}
                  isEditing={effectiveCanEdit}
                  as="h2"
                />
              </div>
              <div>
                {renderContentBlocks(screen.content, contentBlocksOpts)}
              </div>
              {renderInlineUI(screen, useLightCard)}
              {!useLightCard && renderButtons(screen, true, effectiveCanEdit, (idx, label) => updateScreenButtonLabel(screen.id, idx, label))}
            </div>
          </div>
        );
        if (useLightCard) {
          return (
            <section id={screen.id} className="cc-step-section cc-step-section--light" style={containerStyle} {...selectNodeProps}>
              <div className="landing-content-block">
                {twoColContent}
                {renderButtons(screen, false, effectiveCanEdit, (idx, label) => updateScreenButtonLabel(screen.id, idx, label))}
              </div>
            </section>
          );
        }
        return (
          <section id={screen.id} className="landing-content-block" style={containerStyle} {...selectNodeProps}>
            {twoColContent}
          </section>
        );
      }

      case "twoColImageLeft":
        return (
          <div className="landing-content-block" style={containerStyle} data-screen-id={screen.id} {...selectNodeProps}>
            <div className="cc-two-col cc-step-card">
              <div className="cc-media-card">
                {screen.media.map((m, i) => renderMediaItem(m, i, { placement: "card", preview }))}
              </div>
              <div className="cc-text">
                <div style={{ minHeight: "1.2em" }}>
                  <InlineEditableText
                    value={screen.title}
                    onChange={(v) => updateScreenField(screen.id, "title", v)}
                    isEditing={effectiveCanEdit}
                    as="h2"
                  />
                </div>
                {renderContentBlocks(screen.content, contentBlocksOpts)}
                {renderInlineUI(screen, false)}
                {renderButtons(screen, true, effectiveCanEdit, (idx, label) => updateScreenButtonLabel(screen.id, idx, label))}
              </div>
            </div>
          </div>
        );

      case "proofPanel": {
        const useLight = screen.lightTheme === true;
        const panelInner = (
          <div className={`cc-proof-panel${useLight ? " cc-proof-panel--light" : ""}`}>
            <div className="cc-proof-panel__media">
              {screen.media.map((m, i) =>
                renderMediaItem(m, i, { placement: "card", surface: "proofBand", preview })
              )}
            </div>
            <div className="cc-proof-panel__body">
              <div className="cc-proof-panel__head">
                <div style={{ minHeight: "1.2em" }}>
                  <InlineEditableText
                    value={screen.title}
                    onChange={(v) => updateScreenField(screen.id, "title", v)}
                    isEditing={effectiveCanEdit}
                    as="h2"
                    className="cc-proof-panel__title"
                  />
                </div>
              </div>
              <div className="cc-proof-panel__main">
                <div className="cc-proof-panel__content cc-onboarding-stack">
                  {renderContentBlocks(screen.content, contentBlocksOpts)}
                </div>
                {renderInlineUI(screen, useLight)}
              </div>
              <div className="cc-proof-panel__cta" data-zone="cta">
                {renderButtons(screen, !useLight, effectiveCanEdit, (idx, label) => updateScreenButtonLabel(screen.id, idx, label))}
              </div>
            </div>
          </div>
        );
        if (useLight) {
          return (
            <section id={screen.id} className="cc-step-section cc-step-section--light" style={containerStyle} data-screen-id={screen.id} {...selectNodeProps}>
              <div className="landing-content-block">{panelInner}</div>
            </section>
          );
        }
        return (
          <section id={screen.id} className="landing-content-block" style={containerStyle} data-screen-id={screen.id} {...selectNodeProps}>
            {panelInner}
          </section>
        );
      }

      case "splitProof": {
        const useLight = screen.lightTheme === true;
        const splitInner = (
          <div className={`cc-split-proof${useLight ? " cc-split-proof--light" : ""}`}>
            <div className="cc-split-proof__grid">
              <div className="cc-split-proof__media cc-media-card">
                {screen.media.map((m, i) =>
                  renderMediaItem(m, i, { placement: "card", surface: "splitFrame", preview })
                )}
              </div>
              <div className={`cc-split-proof__copy${useLight ? " cc-text--on-light" : ""}`}>
                <div className="cc-split-proof__head">
                  <div style={{ minHeight: "1.2em" }}>
                    <InlineEditableText
                      value={screen.title}
                      onChange={(v) => updateScreenField(screen.id, "title", v)}
                      isEditing={effectiveCanEdit}
                      as="h2"
                      className="cc-split-proof__title"
                    />
                  </div>
                </div>
                <div className="cc-split-proof__stack cc-onboarding-stack">
                  {renderContentBlocks(screen.content, contentBlocksOpts)}
                </div>
                {renderInlineUI(screen, useLight)}
                <div className="cc-split-proof__cta" data-zone="cta">
                  {renderButtons(screen, !useLight, effectiveCanEdit, (idx, label) => updateScreenButtonLabel(screen.id, idx, label))}
                </div>
              </div>
            </div>
          </div>
        );
        if (useLight) {
          return (
            <section id={screen.id} className="cc-step-section cc-step-section--light" style={containerStyle} data-screen-id={screen.id} {...selectNodeProps}>
              <div className="landing-content-block">{splitInner}</div>
            </section>
          );
        }
        return (
          <section id={screen.id} className="landing-content-block" style={containerStyle} data-screen-id={screen.id} {...selectNodeProps}>
            {splitInner}
          </section>
        );
      }

      case "textOnly":
        return (
          <div className="landing-content-block" style={containerStyle} data-screen-id={screen.id} {...selectNodeProps}>
            <div className="cc-two-col">
              <div className="cc-text">
                <div style={{ minHeight: "1.2em" }}>
                  <InlineEditableText
                    value={screen.title}
                    onChange={(v) => updateScreenField(screen.id, "title", v)}
                    isEditing={effectiveCanEdit}
                    as="h2"
                  />
                </div>
                {screen.dynamicSummary ? (
                  <p style={{ marginBottom: 16 }}>{getFinalRecommendationSummary(screen)}</p>
                ) : (
                  renderContentBlocks(screen.content, contentBlocksOpts)
                )}
                {screen.buttons.map((btn, i) => {
                  if (btn.type === "link") {
                    const href = resolveHref(btn, cfg);
                    return effectiveCanEdit ? (
                      <EditableExternalLink
                        key={i}
                        href={href}
                        className="hero-cta"
                        style={{ display: "inline-block", textDecoration: "none", marginTop: 16, cursor: "pointer" }}
                        dataNodeId={"nodeId" in btn ? btn.nodeId : undefined}
                      >
                        <InlineEditableText
                          value={btn.label}
                          onChange={(v) => updateScreenButtonLabel(screen.id, i, v)}
                          isEditing
                          as="span"
                        />
                      </EditableExternalLink>
                    ) : (
                      <a
                        key={i}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hero-cta"
                        style={{ display: "inline-block", textDecoration: "none", marginTop: 16 }}
                        data-node-id={"nodeId" in btn ? btn.nodeId : undefined}
                      >
                        {btn.label}
                      </a>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  /**
   * Read-only layout preview: same markup as the main canvas with a temporary `layout` id.
   * Phase 2+ slide builder: wrap in a scaled viewport; callers pass real `screen` data from JSON.
   */
  function renderScreenPreview(screen: Screen, layoutOverride: string) {
    return renderScreen(screen, { preview: true, layoutOverride });
  }

  const orderForMutations =
    registrationKey != null && orderOverride?.length ? orderOverride : undefined;

  /** Reorder `screens[]` to match `nextOrder`. Pass `baseConfig` after add/duplicate so the map includes new ids (closure `config` would be stale). */
  function applySlideOrder(nextOrder: string[], baseConfig?: LandingConfig) {
    const base = baseConfig ?? config;
    if (!base) return;
    if (registrationKey) {
      setOverride(registrationKey, nextOrder);
    } else {
      const map = new Map(base.screens.map((s) => [s.id, s]));
      const reordered = nextOrder.map((id) => map.get(id)).filter((s): s is Screen => s != null);
      setConfig({ ...base, screens: reordered });
    }
  }

  function handleSlideBuilderExport() {
    if (!config) return;
    const override = registrationKey != null ? getOverride(registrationKey) : undefined;
    const merged = mergeScreenOrderIntoScreens(config.screens, override);
    const out = { ...config, screens: merged };
    downloadLandingJson("landing-export.json", JSON.stringify(out, null, 2));
  }

  function handleSlideBuilderAdd() {
    if (!config) return;
    const { config: next, newOrder, newId } = addScreenAtEnd(
      config as unknown as { screens: Record<string, unknown>[] },
      orderForMutations
    );
    const nextLanding = next as LandingConfig;
    if (registrationKey) {
      setConfig(nextLanding);
      setOverride(registrationKey, newOrder);
    } else {
      applySlideOrder(newOrder, nextLanding);
    }
    setSelectedLandingNodeId(newId);
  }

  function handleSlideBuilderDuplicate() {
    if (!config || !selectedLandingNodeId) return;
    const res = duplicateScreenById(
      config as unknown as { screens: Record<string, unknown>[] },
      selectedLandingNodeId,
      orderForMutations
    );
    if (!res) return;
    const nextLanding = res.config as LandingConfig;
    if (registrationKey) {
      setConfig(nextLanding);
      setOverride(registrationKey, res.newOrder);
    } else {
      applySlideOrder(res.newOrder, nextLanding);
    }
    setSelectedLandingNodeId(res.newId);
  }

  function handleSlideBuilderDelete() {
    if (!config || !selectedLandingNodeId) return;
    const res = deleteScreenById(
      config as unknown as { screens: Record<string, unknown>[] },
      selectedLandingNodeId,
      orderForMutations
    );
    if (!res) return;
    const nextLanding = res.config as LandingConfig;
    if (registrationKey) {
      setConfig(nextLanding);
      setOverride(registrationKey, res.newOrder);
    } else {
      applySlideOrder(res.newOrder, nextLanding);
    }
    setSelectedLandingNodeId(res.newOrder[0] ?? null);
  }

  function handleSlideBuilderInspectorChange(patch: Partial<EditableNode>) {
    if (!config || !selectedLandingNodeId) return;
    setConfig(
      patchLandingScreen(
        config as unknown as Parameters<typeof patchLandingScreen>[0],
        selectedLandingNodeId,
        patch as Record<string, unknown>
      ) as LandingConfig
    );
  }

  function handleDeckPaletteChange(paletteName: string) {
    if (!config) return;
    if (paletteName === "") {
      const { deckPalette: _drop, ...rest } = config;
      setConfig(rest as LandingConfig);
      return;
    }
    setConfig({ ...config, deckPalette: paletteName });
  }

  function handleDeckVersionChange(version: string) {
    setSelectedDeckVersion(version);
    if (learnDeck) {
      setSelectedDeckVariant("");
      const sp = new URLSearchParams(searchParams.toString());
      sp.delete("version");
      sp.delete("variant");
      const q = sp.toString();
      router.replace(
        `/learn/${learnDeck.appKey}/${learnDeck.flowKey}/${encodeURIComponent(version)}${q ? `?${q}` : ""}`
      );
      return;
    }
    if (selectedDeckVariant !== "") {
      setSelectedDeckVariant("");
    }
  }

  function handleCatalogFlowChange(value: string) {
    if (!learnDeck) return;
    const slash = value.indexOf("/");
    if (slash <= 0 || slash >= value.length - 1) return;
    const nextApp = normalizeDeckAppKey(value.slice(0, slash));
    const nextFlow = value.slice(slash + 1).trim();
    if (!nextApp || !nextFlow) return;
    const selected = learnFlowCatalogByKey.get(`${nextApp}/${nextFlow}`);
    const nextVersion =
      selected && selected.availableVersions.includes(selectedDeckVersion)
        ? selectedDeckVersion
        : selected?.defaultVersion ?? selected?.availableVersions[0] ?? "v1";
    setSelectedDeckVersion(nextVersion);
    setLearnAvailableVersions(selected?.availableVersions ?? []);
    setLearnManualSchema("");
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("version");
    sp.delete("variant");
    const q = sp.toString();
    router.replace(
      `/learn/${encodeURIComponent(nextApp)}/${encodeURIComponent(nextFlow)}/${encodeURIComponent(nextVersion)}${q ? `?${q}` : ""}`
    );
  }

  function handleDeckVariantChange(variant: string) {
    setSelectedDeckVariant(variant);
  }

  function handleLearnSchemaChange(schema: string) {
    setLearnManualSchema(schema);
  }

  function handleSlideBuilderMoveUp() {
    if (!selectedLandingNodeId || !orderedScreens.length) return;
    const ids = orderedScreens.map((s) => s.id);
    applySlideOrder(moveIdInOrder(ids, selectedLandingNodeId, "up"));
  }

  function handleSlideBuilderMoveDown() {
    if (!selectedLandingNodeId || !orderedScreens.length) return;
    const ids = orderedScreens.map((s) => s.id);
    applySlideOrder(moveIdInOrder(ids, selectedLandingNodeId, "down"));
  }

  const slideBuilderScreen =
    selectedLandingNodeId && orderedScreens.some((s) => s.id === selectedLandingNodeId)
      ? (orderedScreens.find((s) => s.id === selectedLandingNodeId) ?? orderedScreens[0])
      : orderedScreens[0];

  const slideBuilderInspectorNode: EditableNode | null =
    slideBuilder && selectedLandingNodeId
      ? ((orderedScreens.find((s) => s.id === selectedLandingNodeId) ?? null) as unknown as EditableNode)
      : null;

  const slideBuilderCanvasMaxPx = slideBuilder
    ? getSlideBuilderCanvasMaxWidthPx(shellDevice, slideBuilderCanvasFullWidth)
    : undefined;
  const slideBuilderLayoutPreviewLogicalPx = slideBuilder
    ? getSlideBuilderLayoutPreviewLogicalWidthPx(shellDevice, slideBuilderCanvasFullWidth)
    : 1200;

  const stepLabels = orderedScreens.map((s) => s.stepLabel);
  const showStepProgress = wizardConfig?.steps.showProgress ?? true;
  const progressStyle = wizardConfig?.steps.progressStyle ?? "stepper";
  const navPlacement = wizardConfig?.navigation.placement ?? "bottom";

  return (
    <>
      {learnClientDebug}
    <div
      ref={containerRef}
      className={`landing-container-creations${currentScreen.layout === "hero" ? " landing-step-hero" : ""}${currentScreen.layout === "stamped" ? " landing-step-stamped" : ""}${lightLayoutStep ? " measure-step-active" : ""}${currentScreen.layout === "proofPanel" || currentScreen.layout === "splitProof" ? " landing-step-proof" : ""}`}
      data-landing="container-creations"
      data-slide-builder={slideBuilder ? "1" : undefined}
      data-runtime-mode={runtimeMode}
      data-structure-type="wizard"
      data-wizard-progress-style={progressStyle}
      data-wizard-nav-placement={navPlacement}
      data-wizard-linear={wizardConfig?.linear ?? true}
    >
      {!isPresenterMode && (
        <header
          className={`landing-shop-bar ${isLightStep ? "landing-shop-bar--theme-light" : "landing-shop-bar--theme-steel"}`}
        >
          <a href={cfg.shopUrl} target="_blank" rel="noopener noreferrer" className="landing-shop-logo-link" data-node-id="logo-link">
            {!logoLoadFailed ? (
              <img
                src={cfg.header.logoSrc}
                alt={cfg.header.logoAlt}
                className="landing-shop-logo"
                onError={() => setLogoLoadFailed(true)}
              />
            ) : (
              <span style={{ fontWeight: 700, letterSpacing: "0.03em", fontSize: 14 }}>
                {cfg.header.logoAlt || "Container Creations"}
              </span>
            )}
          </a>
          {canEdit ? (
            <EditableExternalLink
              href={cfg.shopUrl}
              className="landing-shop-cta"
              style={{ cursor: "pointer" }}
              dataNodeId="shop-now-header"
            >
              <InlineEditableText
                value={cfg.header.shopNowLabel}
                onChange={updateHeaderShopNowLabel}
                isEditing
                as="span"
              />
            </EditableExternalLink>
          ) : (
            <a
              href={cfg.shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="landing-shop-cta"
              data-node-id="shop-now-header"
            >
              {cfg.header.shopNowLabel}
            </a>
          )}
        </header>
      )}

      <main
        className={`landing-cc-main${lightLayoutStep && !canEdit ? " landing-cc-main--fill" : ""}${slideBuilder ? " landing-cc-main--slide-builder" : ""}${isPresenterMode ? " landing-cc-main--presenter" : ""}${isWalkthroughMode ? " landing-cc-main--walkthrough" : ""}`}
      >
        {slideBuilder ? (
          <div
            className="landing-slide-builder-columns"
            style={{
              display: "flex",
              flex: 1,
              flexShrink: 0,
              minHeight: 0,
              alignItems: "stretch",
              width: "100%",
              minWidth: 0,
            }}
          >
            <LandingSlideBuilderPanel
              slides={orderedScreens.map((s) => ({
                id: s.id,
                stepLabel: s.stepLabel,
                title: s.title,
                layout: s.layout,
                slideTypeLabel: SLIDE_TYPE_LABELS[inferSlideTypeFromNode(s)],
              }))}
              catalogFlowOptions={learnDeck ? learnFlowSelectOptions : null}
              catalogFlowValue={selectedCatalogFlowValue}
              showCatalogFlowSelect={Boolean(learnDeck && learnFlowSelectOptions.length > 0)}
              onCatalogFlowChange={learnDeck ? handleCatalogFlowChange : undefined}
              deckVersion={selectedDeckVersion}
              deckVariant={learnSchemaSelectOptions.length > 1 ? learnManualSchema : selectedDeckVariant}
              versionOptions={panelVersionOptions}
              showVariantSelect={learnDeck ? learnSchemaSelectOptions.length > 1 : true}
              variantSelectLabel={learnDeck ? "Schema" : "Deck variant"}
              variantOptions={learnDeck ? learnSchemaSelectOptions : BUILDER_VARIANT_OPTIONS}
              onDeckVersionChange={handleDeckVersionChange}
              onDeckVariantChange={
                learnSchemaSelectOptions.length > 1 ? handleLearnSchemaChange : handleDeckVariantChange
              }
              deckPalette={cfg?.deckPalette ?? ""}
              paletteIds={Object.keys(palettes).sort()}
              onDeckPaletteChange={handleDeckPaletteChange}
              selectedId={selectedLandingNodeId}
              onSelect={(id) => setSelectedLandingNodeId(id)}
              onAdd={handleSlideBuilderAdd}
              onDuplicate={handleSlideBuilderDuplicate}
              onDelete={handleSlideBuilderDelete}
              onMoveUp={handleSlideBuilderMoveUp}
              onMoveDown={handleSlideBuilderMoveDown}
              onExport={handleSlideBuilderExport}
              onSaveDraft={learnDeck ? handleSaveDraft : null}
              onCreateVersion={learnDeck ? handleCreateVersion : null}
              diskPersistBusy={diskPersistBusy}
              canDelete={orderedScreens.length > 1}
              mergeNote={null}
              canvasFullWidth={slideBuilderCanvasFullWidth}
              onCanvasFullWidthChange={setSlideBuilderCanvasFullWidth}
            />
            <div className="landing-slide-builder-center">
              <div className="landing-slide-builder-center-scroll">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                    padding: "8px 12px",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      maxWidth: slideBuilderCanvasMaxPx ?? undefined,
                      minWidth: 0,
                    }}
                  >
                    {/* Single-column builder canvas; device modes cap width via parent + data-card-device. */}
                    <div className="dev-flow-single" data-card-device={cardDevice}>
                      {slideBuilderScreen ? (
                        <div className="dev-step">
                          <h3 style={{ padding: "0 12px" }}>
                            Slide {orderedScreens.findIndex((s) => s.id === slideBuilderScreen.id) + 1} –{" "}
                            {slideBuilderScreen.stepLabel}
                          </h3>
                          <div
                            className="landing-screen-presentation"
                            {...landingScreenPresentationAttrs(slideBuilderScreen)}
                          >
                            {renderScreen(slideBuilderScreen)}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <LandingSlideBuilderInspector
              node={slideBuilderInspectorNode}
              screenIds={orderedScreens.map((s) => s.id)}
              selectedNodeId={selectedLandingNodeId}
              onSelectNode={(id) => setSelectedLandingNodeId(id)}
              onChange={handleSlideBuilderInspectorChange}
              slideLayoutPreview={
                slideBuilderScreen
                  ? {
                      deckPalette: cfg?.deckPalette ?? "",
                      renderPreview: (layoutId: string) =>
                        renderScreenPreview(slideBuilderScreen, layoutId),
                      contentLogicalWidth: slideBuilderLayoutPreviewLogicalPx,
                    }
                  : null
              }
            />
          </div>
        ) : isPresenterMode ? (
          <div style={{ display: "grid", gap: 16, width: "100%" }}>
            {orderedScreens.map((screen) =>
              currentScreenId === screen.id ? (
                <div key={screen.id} className="landing-screen-presentation" {...landingScreenPresentationAttrs(screen)}>
                  {renderScreen(getPresenterScreen(screen) ?? screen)}
                </div>
              ) : null
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 12,
                padding: "0 0 12px",
                flexWrap: "wrap",
              }}
            >
              <button type="button" onClick={goBack} disabled={currentIndex <= 0} style={stepNavButtonStyleSteel}>
                Prev
              </button>
              <span style={{ minWidth: 96, textAlign: "center", opacity: 0.9 }}>
                {Math.max(currentIndex + 1, 1)} / {orderedScreens.length}
              </span>
              {revealMax > 0 ? (
                <span style={{ minWidth: 110, textAlign: "center", opacity: 0.8, fontSize: 12 }}>
                  Reveal {presenterRevealStep} / {revealMax}
                </span>
              ) : null}
              <button
                type="button"
                onClick={goNext}
                disabled={currentIndex >= orderedScreens.length - 1 && !currentScreen.nextScreenId}
                style={stepNavButtonStyleSteel}
              >
                Next
              </button>
            </div>
          </div>
        ) : isEditor && !isWalkthroughMode ? (
          <div
            className={shellDevice === "phoneGrid" ? "dev-flow-grid editor-cards-phone" : "dev-flow-single"}
            data-card-device={cardDevice}
          >
            {orderedScreens.map((screen, index) => (
              <div key={screen.id} className="dev-step">
                <h3>Step {index + 1} – {screen.stepLabel}</h3>
                <div className="landing-screen-presentation" {...landingScreenPresentationAttrs(screen)}>
                  {renderScreen(screen)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {isInteractiveGatedFlow && walkthroughGateMessage ? (
              <div
                role="alert"
                className="cc-walkthrough-gate"
                style={{
                  margin: "0 1rem 12px",
                  padding: "12px 14px",
                  borderRadius: 8,
                  background: "#fff7ed",
                  border: "1px solid #fdba74",
                  color: "#9a3412",
                  fontSize: "0.9375rem",
                }}
              >
                {walkthroughGateMessage}
              </div>
            ) : null}
            {orderedScreens.map((screen) =>
              currentScreenId === screen.id ? (
                <div key={screen.id} className="landing-screen-presentation" {...landingScreenPresentationAttrs(screen)}>
                  {renderScreen(screen)}
                </div>
              ) : null
            )}

            {showStepProgress && (
            <aside className="stepTracker" aria-label={cfg.stepTracker.title} data-wizard-progress-style={progressStyle}>
              <h3 className="stepTracker-title">{cfg.stepTracker.title}</h3>
              <p className="stepTracker-description">{cfg.stepTracker.description}</p>
              <ul className="stepTracker-list">
                {stepLabels.map((label, i) => {
                  const status = i < currentIndex ? "done" : i === currentIndex ? "current" : "todo";
                  const icon = status === "done" ? "✔" : status === "current" ? "➜" : "○";
                  const screen = orderedScreens[i];
                  const responseText = getScreenTrackerResponse({
                    screen,
                    values: mergedWalkthroughFormValues,
                    trackerConfig: cfg.stepTracker,
                    status,
                  });
                  return (
                    <li key={label}>
                      <button
                        type="button"
                        onClick={() => {
                          if (isInteractiveGatedFlow && i > currentIndex) return;
                          setCurrentScreenId(screen.id);
                        }}
                        disabled={isInteractiveGatedFlow && i > currentIndex}
                        className={`stepTracker-item stepTracker-item--${status}`}
                        data-node-id={`step-tracker-${i}`}
                      >
                        <span className="stepTracker-icon" aria-hidden>{icon}</span>
                        <span>
                          <span className="stepTracker-label">{label}</span>
                          {responseText ? (
                            <span
                              className="stepTracker-response"
                              style={{
                                display: "block",
                                fontSize: "0.85rem",
                                opacity: 0.85,
                                marginTop: 2,
                                textAlign: "left",
                              }}
                            >
                              {responseText}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>
            )}
          </>
        )}
      </main>
    </div>
    </>
  );
}
