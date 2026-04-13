"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
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
import { getOverride, subscribe } from "@/04_Presentation/components/organs/tsx/website/node-order-override-store";
import { useWizardConfig } from "@/lib/tsx-structure/engines/wizard";
import {
  renderContentBlocks,
  type LandingContentBlock,
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

const CONFIG_URL = "/api/container-creations-landing-config";

export type ContainerCreationsLandingRendererProps = {
  /** Dev instrumentation id (e.g. `landing-2`). Defaults to `landing-2`. */
  componentName?: string;
  /**
   * Default JSON version when the URL has no `variant` query.
   * Sent as `version` to the config API (e.g. `"2"` → `landing-2.json`).
   * Defaults to `"2"` for `/landing-2` parity; omit props only when using those defaults.
   */
  configVersion?: string;
};

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
};

type LandingConfig = {
  shopUrl: string;
  header: { logoSrc: string; logoAlt: string; shopNowLabel: string };
  stepTracker: StepTrackerResponseConfig;
  screens: Screen[];
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

export default function ContainerCreationsLandingRenderer({
  componentName = "landing-2",
  configVersion = "2",
}: ContainerCreationsLandingRendererProps = {}) {
  const wizardConfig = useWizardConfig();
  const containerRef = useRef<HTMLDivElement>(null);
  const editorMode = useSyncExternalStore(subscribeEditorMode, getEditorMode, getEditorMode);
  const isEditor = editorMode === "editor";
  const shellDevice = useSyncExternalStore(
    subscribeDevicePreviewMode,
    getDevicePreviewMode,
    getDevicePreviewMode
  );
  const cardDevice = getCardDevice(shellDevice, editorMode);

  const [config, setConfig] = useState<LandingConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  const cfg = config;
  const screens = cfg?.screens ?? [];
  const searchParams = useSearchParams();
  const canonicalKey = getCanonicalScreenKey(searchParams);
  const orderOverride = useSyncExternalStore(
    subscribe,
    () => getOverride(canonicalKey ?? ""),
    () => getOverride(canonicalKey ?? "")
  );
  const orderedScreens =
    orderOverride?.length && screens.length > 0
      ? orderOverride
          .map((id) => screens.find((s) => s.id === id))
          .filter((s): s is Screen => s != null)
      : screens;
  const [currentScreenId, setCurrentScreenId] = useState<string | null>(null);
  const [failedMedia, setFailedMedia] = useState<Set<string>>(new Set());
  const [stepInputs, setStepInputs] = useState<StepInputs>(INITIAL_STEP_INPUTS);

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const variant = params.get("variant");
    const urlVersion = params.get("version");
    const qp = new URLSearchParams();
    if (variant) {
      qp.set("variant", variant);
    } else {
      const v = urlVersion ?? configVersion;
      if (v) qp.set("version", v);
    }
    qp.set("t", String(Date.now()));
    const url = `${CONFIG_URL}?${qp.toString()}`;
    fetch(url, { cache: "no-store", headers: { Pragma: "no-cache" } })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data) => {
        setConfig(data as LandingConfig);
        if (Array.isArray(data?.screens) && data.screens.length > 0) {
          setCurrentScreenId(data.screens[0].id);
        }
      })
      .catch((err) => setConfigError(err?.message ?? "Failed to load config"));
  }, [configVersion]);

  useEffect(() => {
    logContainerNodeIdsAfterRender(containerRef, componentName);
  });

  /** Register landing flow with dev node sidebar when config is loaded. Delay until canonical key exists (no fallback). */
  useEffect(() => {
    if (!config?.screens?.length || canonicalKey == null) return;
    registerJsonScreen(canonicalKey, config as Parameters<typeof registerJsonScreen>[1], (newConfig) => setConfig(newConfig as LandingConfig));
  }, [config, canonicalKey]);

  const devProps = useSyncExternalStore(subscribeDevSidebarProps, getDevSidebarProps, getDevSidebarProps);
  const selectedLandingNodeId = devProps?.selectedLandingNodeId ?? null;

  // Scroll selected node into view when selection changes (editor mode)
  useEffect(() => {
    if (!isEditor || !selectedLandingNodeId) return;
    const el = document.querySelector(`[data-screen-id="${selectedLandingNodeId}"]`) ?? document.getElementById(selectedLandingNodeId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isEditor, selectedLandingNodeId]);

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

  if (configError) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
        Failed to load config: {configError}
      </div>
    );
  }

  if (!config || screens.length === 0 || currentScreenId == null) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
        Loading…
      </div>
    );
  }

  const currentIndex = orderedScreens.findIndex((s) => s.id === currentScreenId);
  const currentScreen = orderedScreens[currentIndex] ?? orderedScreens[0];

  const isHero = currentScreen.layout === "hero";
  const isLightStep = currentScreen.lightTheme === true;
  const lightLayoutStep =
    (currentScreen.layout === "twoCol" ||
      currentScreen.layout === "proofPanel" ||
      currentScreen.layout === "splitProof") &&
    currentScreen.lightTheme === true;

  const goToScreen = (id: string) => setCurrentScreenId(id);
  const goNext = () => {
    if (currentScreen.nextScreenId) {
      setCurrentScreenId(currentScreen.nextScreenId);
    } else if (currentIndex < orderedScreens.length - 1) {
      setCurrentScreenId(orderedScreens[currentIndex + 1].id);
    }
  };
  const goBack = () => {
    if (currentIndex > 0) setCurrentScreenId(orderedScreens[currentIndex - 1].id);
  };

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
      values: stepInputs as Record<string, unknown>,
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
    return (
      <div className="cc-step-nav">
        {screen.buttons.map((btn, i) => {
          const nodeId = "nodeId" in btn ? btn.nodeId : undefined;
          if (btn.type === "link") {
            const href = resolveHref(btn, cfg);
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
            return (
              <button
                key={i}
                type="button"
                className="hero-cta"
                onClick={goNext}
                data-node-id={nodeId}
              >
                {labelNode(btn, i)}
              </button>
            );
          }
          if (btn.type === "back") {
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
    }
  ): React.ReactNode {
    const markVideoFailed = (src: string) => {
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
      if (failedMedia.has(m.src)) {
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
          loading={m.loading ?? "lazy"}
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
            <img key={j} src={imgEl.src} alt={imgEl.alt} loading="lazy" className="cc-image-grid__img" />
          ))}
        </div>
      );
    }

    return null;
  }

  function renderScreen(screen: Screen) {
    // SAFETY: Every layout must use renderContentBlocks(screen.content, ...) only. No screen.content.map or block.type filtering.
    const isSelected = isEditor && selectedLandingNodeId === screen.id;
    const outlineStyle: React.CSSProperties = isSelected
      ? { outline: "2px solid var(--color-accent, #1a73e8)", outlineOffset: 2 }
      : {};
    const selectNodeProps = isEditor
      ? {
          onClick: () => setSelectedLandingNodeId(screen.id),
          role: "button" as const,
          tabIndex: 0,
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedLandingNodeId(screen.id);
            }
          },
        }
      : {};
    const containerStyle: React.CSSProperties = isEditor ? { ...outlineStyle, cursor: "pointer" } : outlineStyle;

    switch (screen.layout) {
      case "hero": {
        const videoBlock = screen.media.find((m) => m.type === "video");
        const heroLinkButton = screen.buttons.filter((b) => b.type === "link").slice(0, 1)[0];
        const heroLinkIndex = heroLinkButton ? screen.buttons.indexOf(heroLinkButton) : -1;
        return (
          <div style={containerStyle} data-screen-id={screen.id} {...selectNodeProps}>
            <section id={screen.id} className="landing-hero-video-wrap">
              {videoBlock && videoBlock.type === "video"
                ? renderMediaItem(videoBlock, screen.media.indexOf(videoBlock), { placement: "hero" })
                : null}
              {heroLinkButton && (
                <a
                  href={resolveHref(heroLinkButton, cfg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="landing-hero-shop-link"
                  data-node-id={"nodeId" in heroLinkButton ? heroLinkButton.nodeId : undefined}
                >
                  {isEditor ? (
                    <InlineEditableText
                      value={heroLinkButton.label}
                      onChange={(v) => updateScreenButtonLabel(screen.id, heroLinkIndex, v)}
                      isEditing
                      as="span"
                    />
                  ) : (
                    heroLinkButton.label
                  )}
                </a>
              )}
            </section>
            <section id="explore-container" className="hero-intro">
              <div style={{ minHeight: "1.2em" }}>
                <InlineEditableText
                  value={screen.title}
                  onChange={(v) => updateScreenField(screen.id, "title", v)}
                  isEditing={isEditor}
                  as="h1"
                  className="hero-title"
                />
              </div>
              {screen.subtitle != null || isEditor ? (
                <InlineEditableText
                  value={screen.subtitle ?? ""}
                  onChange={(v) => updateScreenField(screen.id, "subtitle", v || undefined)}
                  isEditing={isEditor}
                  as="p"
                  className="hero-subtitle"
                  multiline
                />
              ) : null}
              {renderContentBlocks(screen.content, isEditor ? { isEditor: true, screenId: screen.id, onParagraphChange: (i, t) => updateScreenContentBlock(screen.id, i, t), checklistHeadingClassName: "cc-stamped-checklist-heading", checklistListClassName: "cc-stamped-checklist" } : { checklistHeadingClassName: "cc-stamped-checklist-heading", checklistListClassName: "cc-stamped-checklist" })}
              {screen.buttons.filter((b) => b.type === "goto").map((btn, j) => {
                const idx = screen.buttons.indexOf(btn);
                return (
                  <button key={j} type="button" className="hero-cta" onClick={() => goToScreen(btn.target)} data-node-id={btn.nodeId}>
                    {isEditor ? <InlineEditableText value={btn.label} onChange={(v) => updateScreenButtonLabel(screen.id, idx, v)} isEditing as="span" /> : btn.label}
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
                  isEditing={isEditor}
                  as="h2"
                  className="cc-stamped-heading"
                />
              </div>
              <div className="cc-stamped-description">
                {renderContentBlocks(screen.content, isEditor ? { isEditor: true, screenId: screen.id, onParagraphChange: (i, t) => updateScreenContentBlock(screen.id, i, t), checklistHeadingClassName: "cc-stamped-checklist-heading", checklistListClassName: "cc-stamped-checklist" } : { checklistHeadingClassName: "cc-stamped-checklist-heading", checklistListClassName: "cc-stamped-checklist" })}
              </div>
              <div className="landing-phone-video-wrap cc-stamped-media">
                {screen.media.map((m, i) => renderMediaItem(m, i, { placement: "stamped" }))}
              </div>
              {renderInlineUI(screen, true)}
              {renderButtons(screen, false, isEditor, (idx, label) => updateScreenButtonLabel(screen.id, idx, label))}
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
              {screen.media.map((m, i) => renderMediaItem(m, i, { placement: "card" }))}
            </div>
            <div className={`cc-text${useLightCard ? " cc-text--on-light" : ""}`}>
              <div style={{ minHeight: "1.2em" }}>
                <InlineEditableText
                  value={screen.title}
                  onChange={(v) => updateScreenField(screen.id, "title", v)}
                  isEditing={isEditor}
                  as="h2"
                />
              </div>
              <div>
                {renderContentBlocks(screen.content, isEditor ? { isEditor: true, screenId: screen.id, onParagraphChange: (i, t) => updateScreenContentBlock(screen.id, i, t), checklistHeadingClassName: "cc-stamped-checklist-heading", checklistListClassName: "cc-stamped-checklist" } : { checklistHeadingClassName: "cc-stamped-checklist-heading", checklistListClassName: "cc-stamped-checklist" })}
              </div>
              {renderInlineUI(screen, useLightCard)}
              {!useLightCard && renderButtons(screen, true, isEditor, (idx, label) => updateScreenButtonLabel(screen.id, idx, label))}
            </div>
          </div>
        );
        if (useLightCard) {
          return (
            <section id={screen.id} className="cc-step-section cc-step-section--light" style={containerStyle} {...selectNodeProps}>
              <div className="landing-content-block">
                {twoColContent}
                {renderButtons(screen, false, isEditor, (idx, label) => updateScreenButtonLabel(screen.id, idx, label))}
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
                {screen.media.map((m, i) => renderMediaItem(m, i, { placement: "card" }))}
              </div>
              <div className="cc-text">
                <div style={{ minHeight: "1.2em" }}>
                  <InlineEditableText
                    value={screen.title}
                    onChange={(v) => updateScreenField(screen.id, "title", v)}
                    isEditing={isEditor}
                    as="h2"
                  />
                </div>
                {renderContentBlocks(screen.content, isEditor ? { isEditor: true, screenId: screen.id, onParagraphChange: (i, t) => updateScreenContentBlock(screen.id, i, t), checklistHeadingClassName: "cc-stamped-checklist-heading", checklistListClassName: "cc-stamped-checklist" } : { checklistHeadingClassName: "cc-stamped-checklist-heading", checklistListClassName: "cc-stamped-checklist" })}
                {renderInlineUI(screen, false)}
                {renderButtons(screen, true, isEditor, (idx, label) => updateScreenButtonLabel(screen.id, idx, label))}
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
                renderMediaItem(m, i, { placement: "card", surface: "proofBand" })
              )}
            </div>
            <div className="cc-proof-panel__body">
              <div className="cc-proof-panel__head">
                <div style={{ minHeight: "1.2em" }}>
                  <InlineEditableText
                    value={screen.title}
                    onChange={(v) => updateScreenField(screen.id, "title", v)}
                    isEditing={isEditor}
                    as="h2"
                    className="cc-proof-panel__title"
                  />
                </div>
              </div>
              <div className="cc-proof-panel__main">
                <div className="cc-proof-panel__content cc-onboarding-stack">
                  {renderContentBlocks(screen.content, isEditor ? { isEditor: true, screenId: screen.id, onParagraphChange: (i, t) => updateScreenContentBlock(screen.id, i, t), checklistHeadingClassName: "cc-stamped-checklist-heading", checklistListClassName: "cc-stamped-checklist" } : { checklistHeadingClassName: "cc-stamped-checklist-heading", checklistListClassName: "cc-stamped-checklist" })}
                </div>
                {renderInlineUI(screen, useLight)}
              </div>
              <div className="cc-proof-panel__cta" data-zone="cta">
                {renderButtons(screen, !useLight, isEditor, (idx, label) => updateScreenButtonLabel(screen.id, idx, label))}
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
                  renderMediaItem(m, i, { placement: "card", surface: "splitFrame" })
                )}
              </div>
              <div className={`cc-split-proof__copy${useLight ? " cc-text--on-light" : ""}`}>
                <div className="cc-split-proof__head">
                  <div style={{ minHeight: "1.2em" }}>
                    <InlineEditableText
                      value={screen.title}
                      onChange={(v) => updateScreenField(screen.id, "title", v)}
                      isEditing={isEditor}
                      as="h2"
                      className="cc-split-proof__title"
                    />
                  </div>
                </div>
                <div className="cc-split-proof__stack cc-onboarding-stack">
                  {renderContentBlocks(screen.content, isEditor ? { isEditor: true, screenId: screen.id, onParagraphChange: (i, t) => updateScreenContentBlock(screen.id, i, t), checklistHeadingClassName: "cc-stamped-checklist-heading", checklistListClassName: "cc-stamped-checklist" } : { checklistHeadingClassName: "cc-stamped-checklist-heading", checklistListClassName: "cc-stamped-checklist" })}
                </div>
                {renderInlineUI(screen, useLight)}
                <div className="cc-split-proof__cta" data-zone="cta">
                  {renderButtons(screen, !useLight, isEditor, (idx, label) => updateScreenButtonLabel(screen.id, idx, label))}
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
                    isEditing={isEditor}
                    as="h2"
                  />
                </div>
                {screen.dynamicSummary ? (
                  <p style={{ marginBottom: 16 }}>{getFinalRecommendationSummary(screen)}</p>
                ) : (
                  renderContentBlocks(screen.content, isEditor ? { isEditor: true, screenId: screen.id, onParagraphChange: (i, t) => updateScreenContentBlock(screen.id, i, t), checklistHeadingClassName: "cc-stamped-checklist-heading", checklistListClassName: "cc-stamped-checklist" } : { checklistHeadingClassName: "cc-stamped-checklist-heading", checklistListClassName: "cc-stamped-checklist" })
                )}
                {screen.buttons.map((btn, i) => {
                  if (btn.type === "link") {
                    return (
                      <a
                        key={i}
                        href={resolveHref(btn, cfg)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hero-cta"
                        style={{ display: "inline-block", textDecoration: "none", marginTop: 16 }}
                        data-node-id={"nodeId" in btn ? btn.nodeId : undefined}
                      >
                        {isEditor ? <InlineEditableText value={btn.label} onChange={(v) => updateScreenButtonLabel(screen.id, i, v)} isEditing as="span" /> : btn.label}
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

  const stepLabels = orderedScreens.map((s) => s.stepLabel);
  const showStepProgress = wizardConfig?.steps.showProgress ?? true;
  const progressStyle = wizardConfig?.steps.progressStyle ?? "stepper";
  const navPlacement = wizardConfig?.navigation.placement ?? "bottom";

  return (
    <div
      ref={containerRef}
      className={`landing-container-creations${currentScreen.layout === "hero" ? " landing-step-hero" : ""}${currentScreen.layout === "stamped" ? " landing-step-stamped" : ""}${lightLayoutStep ? " measure-step-active" : ""}${currentScreen.layout === "proofPanel" || currentScreen.layout === "splitProof" ? " landing-step-proof" : ""}`}
      data-landing="container-creations"
      data-structure-type="wizard"
      data-wizard-progress-style={progressStyle}
      data-wizard-nav-placement={navPlacement}
      data-wizard-linear={wizardConfig?.linear ?? true}
    >
      <header
        className={`landing-shop-bar ${isLightStep ? "landing-shop-bar--theme-light" : "landing-shop-bar--theme-steel"}`}
      >
        <a href={cfg.shopUrl} target="_blank" rel="noopener noreferrer" className="landing-shop-logo-link" data-node-id="logo-link">
          <img
            src={cfg.header.logoSrc}
            alt={cfg.header.logoAlt}
            className="landing-shop-logo"
          />
        </a>
        <a
          href={cfg.shopUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="landing-shop-cta"
          data-node-id="shop-now-header"
        >
          {cfg.header.shopNowLabel}
        </a>
      </header>

      <main
        className={`landing-cc-main${lightLayoutStep && !isEditor ? " landing-cc-main--fill" : ""}`}
      >
        {isEditor ? (
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
                    values: stepInputs as Record<string, unknown>,
                    trackerConfig: cfg.stepTracker,
                    status,
                  });
                  return (
                    <li key={label}>
                      <button
                        type="button"
                        onClick={() => setCurrentScreenId(screen.id)}
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
  );
}
