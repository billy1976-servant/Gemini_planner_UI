"use client";
import React from "react";
import Registry from "./registry";
import { resolveParams } from "./palette-resolver";
import definitions from "@/components/molecules/molecules.json";
import {
  subscribePalette,
  getPaletteName,
} from "@/engine/core/palette-store";
import {
  subscribeLayout,
  getLayout,
} from "@/engine/core/layout-store";
import {
  subscribeState,
  getState,
} from "@/state/state-store";
import { useSyncExternalStore } from "react";
import { JsonSkinEngine } from "@/logic/engines/json-skin.engine";
import {
  getSectionLayoutId,
  evaluateCompatibility,
  getVisualPresetForMolecule,
  getSpacingForScale,
  getCardPreset,
  resolveMoleculeLayout,
  getCardLayoutPreset,
  getDefaultCardPresetForSectionPreset,
  SAFE_DEFAULT_CARD_PRESET_ID,
} from "@/layout";
import { logRuntimeDecision } from "@/engine/devtools/runtime-decision-trace";
import { NON_ACTIONABLE_TYPES } from "@/contracts/renderer-contract";
import { EXPECTED_PARAMS } from "@/contracts/expected-params";
import { trace } from "@/devtools/interaction-tracer.store";
import { PipelineDebugStore } from "@/devtools/pipeline-debug-store";
import { recordStage } from "@/engine/debug/pipelineStageTrace";
import { emitRendererTrace } from "@/engine/debug/renderer-trace";
import { getExperienceVisibility } from "@/engine/core/experience-visibility";
import { pushTrace } from "@/devtools/runtime-trace-store";
import { addTraceEvent, endInteraction } from "@/03_Runtime/debug/pipeline-trace-aggregator";
import { startTrace, endTrace, isEnabled } from "@/diagnostics/traceStore";
import { OriginTraceProvider } from "@/03_Runtime/diagnostics/OriginTraceContext";
import { isDueOn } from "@/logic/engines/structure/recurrence.engine";
import { sortByPriority } from "@/logic/engines/structure/prioritization.engine";


/* ======================================================
   LAYOUT INVESTIGATION KILL SWITCH
====================================================== */
const DISABLE_ENGINE_LAYOUT = false; // Re-enabled: engine overrides and template resolution active

/** When true: ignore missing layout warnings, always render content, never block slots. */
const LAYOUT_RECOVERY_MODE = true;


/* ======================================================
   TRACE (QUIET + DEDUPED)
====================================================== */
const TRACE = true;
const JR =
  (globalThis as any).__JR_TRACE__ ??
  ((globalThis as any).__JR_TRACE__ = {
    cycle: 0,
    seen: new Set<string>(),
  });


function beginCycle() {
  JR.cycle++;
  JR.seen.clear();
}


function traceOnce(key: string, ...args: any[]) {
  if (!TRACE) return;
  const k = `${JR.cycle}:${key}`;
  if (JR.seen.has(k)) return;
  JR.seen.add(k);
  // Removed console.log - use trace store instead
}


/* ======================================================
   DEBUG WRAPPER — VISUAL ONLY
====================================================== */
export function DebugWrapper({ node, children }: any) {
  return (
    <div
      data-node-id={node?.id}
      style={{
        outline: "1px dashed var(--debug-outline)",
        margin: "var(--spacing-1)",
        padding: "var(--spacing-1)",
        position: "relative",
      }}
    >
      <div
        style={{
          fontSize: "var(--font-size-xs)",
          opacity: 0.5,
          pointerEvents: "none",
        }}
      >
        {node?.type} {node?.id ? `#${node.id}` : ""}
      </div>
      {children}
    </div>
  );
}

function isDebugMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const sp = new URLSearchParams(window.location.search);
    return sp.get("debug") === "1";
  } catch {
    return false;
  }
}

function isTraceUI(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("trace") === "ui";
  } catch {
    return false;
  }
}

function isLayoutDebug(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("layoutDebug") === "1";
  } catch {
    return false;
  }
}

function SectionLayoutDebugOverlay({ node, children }: { node: any; children: React.ReactNode }) {
  const sectionKey = node?.id ?? "—";
  const role = node?.role ?? "—";
  const variant = node?.variant ?? "—";
  const layoutId = (node as any)?._effectiveLayoutPreset ?? node?.layout ?? "—";
  const containerWidth = node?.params?.containerWidth ?? "—";
  const layoutType = node?.params?.moleculeLayout?.type ?? "—";
  return (
    <div style={{ position: "relative", outline: "2px solid var(--color-outline, #888)" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          fontSize: "var(--font-size-xs)",
          background: "rgba(0,0,0,0.85)",
          color: "#eee",
          padding: "var(--spacing-1) var(--spacing-2)",
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--spacing-2)",
          zIndex: 1,
        }}
        data-section-debug
      >
        <span>sectionKey: {sectionKey}</span>
        <span>role: {role}</span>
        <span>variant: {String(variant)}</span>
        <span>layout (section layout id): {String(layoutId)}</span>
        <span>containerWidth: {String(containerWidth)}</span>
        <span>layoutType: {String(layoutType)}</span>
      </div>
      <div style={{ padding: 0, margin: 0 }}>{children}</div>
    </div>
  );
}

function logParamsDiagnostic(typeKey: string, id: string | undefined, params: any) {
  if (!isTraceUI()) return;
  const expected = EXPECTED_PARAMS[typeKey];
  if (!expected) return;
  const keys = Object.keys(params ?? {});
  const missing = expected.filter((k) => !(k in (params ?? {})));
  const status = missing.length === 0 ? "OK" : "MISSING";
  const msg = missing.length === 0
    ? `[JsonRenderer] ${typeKey}${id ? `#${id}` : ""}: params OK (${keys.join(", ")})`
    : `[JsonRenderer] ${typeKey}${id ? `#${id}` : ""}: params MISSING (expected ${missing.join(", ")}) — received (${keys.join(", ") || "none"})`;
  console.log(msg);
}

function MaybeDebugWrapper({ node, children, screenPath }: { node: any; children: React.ReactNode; screenPath?: string }) {
  // Default: real UI (no debug boxes)
  // Opt-in: `?debug=1` brings back DebugWrapper overlays
  if (isDebugMode()) return <DebugWrapper node={node}>{children}</DebugWrapper>;

  // Preserve `data-node-id` for tooling (e.g. visual-proof selectors) without affecting layout.
  // `data-media-url` lets LayoutMoleculeRenderer partitionChildren find the media child when section uses split layout.
  // `display: contents` avoids extra box-model impact.
  // Inspector: data-hi-* for diagnostic overlay (element id, path, molecule).
  const media = node?.content?.media;
  const mediaUrl =
    typeof media === "string"
      ? media
      : (media as { url?: string })?.url
        ? (media as { url: string }).url
        : undefined;
  const stableId = node?.id ?? node?.role ?? (screenPath ?? "");
  return (
    <div
      data-node-id={node?.id}
      data-media-url={mediaUrl}
      data-hi-element="true"
      data-hi-id={stableId}
      data-hi-path={screenPath ?? stableId}
      data-hi-molecule={node?.type ?? ""}
      style={{ display: "contents" }}
    >
      {children}
    </div>
  );
}


/* ======================================================
   BEHAVIOR CONTRACT (Packet 11) — strip invalid at runtime
   Source: @/contracts/renderer-contract (single source)
====================================================== */

function isCloseOnlyBehavior(behavior: any): boolean {
  if (!behavior || typeof behavior !== "object") return false;
  if (behavior.type === "Navigation" && behavior?.params?.verb === "close") return true;
  if (behavior.type === "Action" && behavior?.params?.name === "close") return true;
  return false;
}

function shouldStripBehavior(nodeType: string, behavior: any): boolean {
  const t = typeof nodeType === "string" ? nodeType.trim().toLowerCase() : "";
  if (NON_ACTIONABLE_TYPES.has(t)) return true;
  if (t === "modal" && behavior && typeof behavior === "object" && !isCloseOnlyBehavior(behavior)) return true;
  return false;
}

/* ======================================================
   INTERNAL GUARDS
====================================================== */
function isValidReactComponentType(x: any) {
  if (!x) return false;
  if (typeof x === "string") return true;
  if (typeof x === "function") return true;
  if (typeof x === "object" && (x as any).$$typeof) return true;
  return false;
}


/* ======================================================
   CONDITIONAL VISIBILITY (FIXED)
====================================================== */
function shouldRenderNode(node: any, state: any, defaultState?: any): boolean {
  // No condition → always render
  if (!node?.when) {
    const nodeKey = node?.id ?? node?.role ?? "anonymous";
    PipelineDebugStore.setVisibility(nodeKey, true);
    PipelineDebugStore.recordSectionRender(nodeKey, { visible: true, controlledByStateKeys: [] });
    return true;
  }


  const { state: key, equals } = node.when;
  if (!key) return true;

  // Resolve state value: support dotted path (e.g. "values.structure.calendarView")
  function getByPath(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    const parts = path.trim().split(".").filter(Boolean);
    let v: any = obj;
    for (const part of parts) {
      v = v != null && typeof v === "object" ? v[part] : undefined;
    }
    return v;
  }

  // 🔒 Authoritative gating:
  // 🔑 CRITICAL: Use reactive state if it exists (user interactions), fallback to defaultState for initial render
  let stateValue: any;
  if (key.includes(".")) {
    stateValue = getByPath(state, key) ?? getByPath(defaultState, key);
  } else {
    if (state?.[key] !== undefined) {
      stateValue = state[key];
    } else if (defaultState?.[key] !== undefined) {
      stateValue = defaultState[key];
    } else {
      stateValue = undefined;
    }
  }
  
  // Debug logging removed - use trace store instead
  
  // If state key doesn't exist in either, don't render (prevents showing wrong content)
  // V6: treat undefined calendarView as "day" so Day view shows when user first opens Plan
  if (stateValue === undefined && (key !== "values.structure.calendarView" || equals !== "day")) {
    logRuntimeDecision({
      timestamp: Date.now(),
      engineId: "renderer",
      decisionType: "visibility-check",
      inputsSeen: { nodeId: node?.id, key, equals, stateValue: undefined },
      ruleApplied: "when.key missing in state and defaultState",
      decisionMade: false,
      downstreamEffect: "node not rendered",
    });
    return false;
  }
  if (stateValue === undefined && key === "values.structure.calendarView" && equals === "day") {
    stateValue = "day";
  }

  const visible = stateValue === equals;
  const nodeKey = node?.id ?? node?.role ?? "anonymous";
  PipelineDebugStore.setVisibility(nodeKey, visible);
  PipelineDebugStore.recordSectionRender(nodeKey, {
    visible,
    controlledByStateKeys: key ? [key] : [],
  });
  if (!visible) {
    logRuntimeDecision({
      timestamp: Date.now(),
      engineId: "renderer",
      decisionType: "visibility-check",
      inputsSeen: { nodeId: node?.id, key, equals, stateValue },
      ruleApplied: "when.equals !== stateValue",
      decisionMade: false,
      downstreamEffect: "node not rendered",
    });
  }
  return visible;
}


/* ======================================================
   TEMPLATE VISUAL: merge spacing overlay into section params (surface + moleculeLayout.params)
====================================================== */
function deepMergeParams(
  params: Record<string, any>,
  overlay: Record<string, any>
): Record<string, any> {
  const result = { ...params };
  for (const k of Object.keys(overlay)) {
    if (k === "layout" && result.moleculeLayout?.params != null) {
      result.moleculeLayout = {
        ...result.moleculeLayout,
        params: { ...result.moleculeLayout.params, ...(overlay.layout ?? {}) },
      };
    } else {
      const ov = overlay[k];
      result[k] =
        ov != null && typeof ov === "object" && !Array.isArray(ov)
          ? { ...(result[k] ?? {}), ...ov }
          : ov !== undefined
          ? ov
          : result[k];
    }
  }
  return result;
}

/* ======================================================
   PROFILE → SECTION RESOLVER (+ LAYOUT PRESET OVERRIDES)
   Section preset: container layout only.
   Card preset: mediaPosition, contentAlign for Card children.
====================================================== */
function applyProfileToNode(
  node: any,
  profile: any,
  sectionLayoutPresetOverrides?: Record<string, string>,
  cardLayoutPresetOverrides?: Record<string, string>,
  parentSectionKey?: string | null,
  parentSectionLayoutId?: string | null,
  organInternalLayoutOverrides?: Record<string, string>,
  forceCardCompatibility?: boolean
): any {
  if (!node || !profile) return node;

  const next = { ...node };

  // 🔑 Template = defaults, organ = overrides. When mode === "custom", skip template section logic.
  const isSection = node.type?.toLowerCase?.() === "section";
  const isCard = node.type?.toLowerCase() === "card";
  const layoutMode = profile?.mode ?? "template";

  // Layout from Layout Engine / Preset only — never from node. Strip layout keys from section params so JSON cannot supply layout.
  // Section vertical spacing is engine-only; template/preset spacing is intentionally ignored.
  if (isSection && next.params && typeof next.params === "object") {
    const p = next.params as Record<string, unknown>;
    delete p.moleculeLayout;
    delete p.layoutPreset;
    delete p.layout;
    delete p.containerWidth;
    delete p.backgroundVariant;
    delete p.split;
    delete p.gap;
    delete p.padding;
  }
  // Per-section: set a single layout-2 string id (OrganPanel overrides, explicit node.layout, template default).
  // Single authority: layout.getSectionLayoutId (override → node.layout → template role → template default).
  if (isSection) {
    // Guard: Ensure sectionKey is never empty, null, or undefined
    // Use node.id, node.role, or generate anonymous identifier
    let sectionKey = (node.id ?? node.role) ?? "";
    if (!sectionKey || !sectionKey.trim()) {
      // Generate deterministic anonymous identifier if no id/role exists
      // Use a combination of type and a hash-like identifier based on node structure
      const nodeHash = typeof node === "object" && node !== null
        ? String(Math.abs(JSON.stringify(node).split("").reduce((acc, char) => {
            const hash = ((acc << 5) - acc) + char.charCodeAt(0);
            return hash & hash;
          }, 0))).slice(0, 8)
        : String(Date.now()).slice(-8);
      sectionKey = `anonymous_section_${nodeHash}`;
      
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[applyProfileToNode] Generated anonymous sectionKey "${sectionKey}" for section without id/role:`,
          { nodeType: node.type, nodeId: node.id, nodeRole: node.role }
        );
      }
    } else {
      sectionKey = sectionKey.trim();
    }
    
    const templateId = (profile?.id ?? null) as string | null;
    const { layoutId, ruleApplied, variantParams, variantContainerWidth } = getSectionLayoutId(
      {
        sectionKey,
        node,
        templateId,
        sectionLayoutPresetOverrides,
        defaultSectionLayoutIdFromProfile: (profile as { defaultSectionLayoutId?: string } | null)?.defaultSectionLayoutId,
        templateProfile: profile as any,
      },
      { includeRule: true }
    );
    const overrideId = sectionLayoutPresetOverrides?.[sectionKey]?.trim() ?? null;
    const existingLayoutId =
      typeof node.layout === "string" && (node.layout as string).trim()
        ? (node.layout as string).trim()
        : null;
    const templateDefaultLayoutId = (profile as { defaultSectionLayoutId?: string } | null)?.defaultSectionLayoutId ?? null;
    
    // Layout resolution traced via trace store
    if (process.env.NODE_ENV === "development") {
      pushTrace({
        system: "renderer",
        sectionId: sectionKey,
        action: "layout-resolution",
        input: {
          templateId: templateId ?? "(none)",
          templateDefault: templateDefaultLayoutId ?? "(none)",
          engineOverride: overrideId ?? "(none)",
        },
        decision: layoutId,
        final: {
          resolvedLayoutId: layoutId,
          ruleApplied,
          engineDisabled: DISABLE_ENGINE_LAYOUT,
        },
      });
    }
    
    logRuntimeDecision({
      timestamp: Date.now(),
      engineId: "renderer",
      decisionType: "layout-choice",
      inputsSeen: {
        sectionKey,
        overrideId: overrideId ?? null,
        existingLayoutId: existingLayoutId ?? null,
        layoutMode: layoutMode ?? null,
      },
      ruleApplied,
      decisionMade: layoutId,
      downstreamEffect: "section layout + compatibility",
    });
    
    // KILL SWITCH: Temporarily disable engine overrides to verify JSON integrity
    // Note: layoutId is now guaranteed to be a string (never undefined) due to fallback in getSectionLayoutId
    const finalLayoutId = DISABLE_ENGINE_LAYOUT
      ? (existingLayoutId || templateDefaultLayoutId || layoutId)
      : layoutId;
    
    if (process.env.NODE_ENV === "development" && DISABLE_ENGINE_LAYOUT && finalLayoutId !== layoutId) {
      // Removed console.log - use trace store instead
    }
    
    next.layout = finalLayoutId;
    (next as any)._effectiveLayoutPreset = layoutId;
    // Template authority: containerWidth from layoutVariants[role] else profile.widthByRole[role]; merged into params for SectionCompound/layout.
    const nodeRole = (node.role ?? "").toString().trim();
    const containerWidthFromProfile = (profile as { widthByRole?: Record<string, string> } | null)?.widthByRole?.[nodeRole];
    const effectiveContainerWidth = variantContainerWidth ?? containerWidthFromProfile ?? undefined;
    (next as any)._variantParams = effectiveContainerWidth
      ? { ...variantParams, containerWidth: effectiveContainerWidth }
      : variantParams;
    (next as any)._variantContainerWidth = variantContainerWidth ?? undefined;
    if (process.env.NODE_ENV === "development") {
      PipelineDebugStore.mark("json-renderer", "applyProfileToNode.section", {
        sectionKey,
        layoutId: layoutId,
        ruleApplied,
      });
      // Duplicate layout diagnosis: trace sectionKey + resolved layoutId + ruleApplied (expected: multiple sections can share same layout; detect duplicate keys / override collision).
      PipelineDebugStore.mark("json-renderer", "section-layout-diagnosis", {
        sectionKey,
        resolvedLayoutId: layoutId,
        ruleApplied,
      });
    }
    // sectionKey is now guaranteed to be non-empty due to guard above
    const resolvedSectionKey = sectionKey;
    const cardVal = cardLayoutPresetOverrides?.[sectionKey];
    const organVal = organInternalLayoutOverrides?.[sectionKey];
    const resolutionChain: Array<{ source: string; found?: boolean; value?: string; used?: boolean }> = [
      { source: "section override", found: !!overrideId, value: overrideId ?? undefined },
      { source: "card override", found: !!cardVal, value: cardVal },
      { source: "organ override", found: !!organVal, value: organVal },
      { source: "template default", used: ruleApplied === "template role" || ruleApplied === "template default" },
    ];
    if (process.env.NODE_ENV === "development") {
      PipelineDebugStore.setResolverInputSnapshot({
        sectionKey: resolvedSectionKey,
        overrideLayout: overrideId ?? undefined,
        nodeLayout: typeof node.layout === "string" ? node.layout : undefined,
        finalChosenLayout: layoutId,
      });
      recordStage("resolver-input", "pass", {
        sectionKey: resolvedSectionKey,
        chosenLayout: layoutId ?? null,
      });
    }
    PipelineDebugStore.setLayout(resolvedSectionKey, layoutId ?? "");
    if (process.env.NODE_ENV === "development") {
      let activeSection = PipelineDebugStore.getSnapshot().lastEvent?.target ?? null;
      if (activeSection?.startsWith("section-layout-preset-")) activeSection = activeSection.slice("section-layout-preset-".length);
      if (activeSection?.startsWith("card-layout-preset-")) activeSection = activeSection.slice("card-layout-preset-".length);
      if (activeSection?.startsWith("organ-internal-layout-")) activeSection = activeSection.slice("organ-internal-layout-".length);
      const isTargetSection = activeSection && (resolvedSectionKey === activeSection || sectionKey === activeSection);
      if (isTargetSection) {
        const ts = Date.now();
        recordStage("resolver", "pass", {
          sectionKey: resolvedSectionKey,
          requested: existingLayoutId ?? node.layout ?? null,
          sectionOverride: overrideId ?? null,
          cardOverride: cardVal ?? null,
          organOverride: organVal ?? null,
          finalLayout: layoutId ?? null,
          chain: resolutionChain,
          ts,
        });
        recordStage("layout", "pass", {
          sectionKey: resolvedSectionKey,
          layoutResolved: layoutId ?? "",
          layoutRequested: existingLayoutId ?? null,
          ts,
        });
      }
    }
    PipelineDebugStore.recordSectionRender(resolvedSectionKey, {
      layoutRequested: existingLayoutId ?? (typeof node.layout === "string" ? node.layout : null),
      layoutResolved: layoutId ?? "",
      resolutionChain,
    });
    const reason =
      ruleApplied === "override"
        ? "state"
        : ruleApplied === "explicit node.layout"
        ? "preset"
        : ruleApplied === "template role" || ruleApplied === "template default"
        ? "template"
        : "fallback";
    
    // Trace renderer resolution
    pushTrace({
      system: "renderer",
      sectionId: resolvedSectionKey,
      nodeId: node?.id ?? node?.role,
      action: "renderSection",
      input: {
        node: { id: node?.id, role: node?.role, layout: existingLayoutId },
        overrideId,
        cardOverride: cardVal,
        organOverride: organVal,
      },
      decision: layoutId,
      override: overrideId || undefined,
      final: {
        layoutId,
        layoutRequested: existingLayoutId,
        layoutResolved: layoutId ?? "",
        reason,
        resolutionChain,
      },
    });
    
    // Add to consolidated trace aggregator
    addTraceEvent({
      system: "renderer",
      sectionId: resolvedSectionKey,
      nodeId: node?.id ?? node?.role,
      action: "renderSection",
      input: {
        node: { id: node?.id, role: node?.role, layout: existingLayoutId },
        overrideId,
        cardOverride: cardVal,
        organOverride: organVal,
      },
      decision: layoutId,
      override: overrideId || undefined,
      final: {
        layoutId,
        layoutRequested: existingLayoutId,
        layoutResolved: layoutId ?? "",
        reason,
        resolutionChain,
      },
    });
    
    emitRendererTrace({
      stage: "profile-resolution",
      nodeId: resolvedSectionKey || (node?.id ?? node?.role ?? "anonymous"),
      sectionKey: resolvedSectionKey || undefined,
      requestedLayout: existingLayoutId ?? undefined,
      stateOverride: overrideId ?? undefined,
      presetOverride: undefined,
      templateDefault: (ruleApplied === "template role" || ruleApplied === "template default" ? layoutId : undefined) ?? undefined,
      finalLayout: layoutId ?? "",
      reason,
    });
    
    const compatibility = evaluateCompatibility({
      sectionNode: node,
      sectionLayoutId: next.layout ?? null,
      cardLayoutId: cardLayoutPresetOverrides?.[sectionKey] ?? null,
      organId: node.role ?? null,
      organInternalLayoutId: organInternalLayoutOverrides?.[sectionKey] ?? null,
      forceCardValid: forceCardCompatibility === true,
    });
    // Layout compatibility traced via trace store
  }

  // Per-section card layout preset: override → first allowed for section → safe default. Single source.
  if (isCard && parentSectionKey) {
    const overrideId = cardLayoutPresetOverrides?.[parentSectionKey] ?? null;
    const defaultForSection =
      parentSectionLayoutId != null ? getDefaultCardPresetForSectionPreset(parentSectionLayoutId) : null;
    
    // TEMP SAFE MODE: Log fallback hits but do NOT assign default card preset
    let cardPresetId: string | null = null;
    
    if (overrideId) {
      cardPresetId = overrideId;
    } else if (defaultForSection) {
      cardPresetId = defaultForSection;
    } else {
      // FALLBACK HIT: Safe default card preset would be used
      console.warn("[FALLBACK HIT]", {
        sectionKey: parentSectionKey,
        requestedLayout: parentSectionLayoutId ?? "(none)",
        templateDefault: defaultForSection ?? "(none)",
        override: overrideId ?? "(none)",
        safeDefault: SAFE_DEFAULT_CARD_PRESET_ID,
        source: "SAFE_DEFAULT_CARD_PRESET_ID",
      });
      // Do NOT assign fallback - leave as null to expose missing JSON
      cardPresetId = null;
    }
    const cardPreset = getCardLayoutPreset(cardPresetId);
    const layoutBefore = typeof node.layout === "string" ? node.layout : "(none)";
    // Card layout chain traced via trace store
    if (process.env.NODE_ENV === "development") {
      pushTrace({
        system: "renderer",
        sectionId: parentSectionKey ?? "",
        action: "card-layout-resolution",
        input: {
          cardOverridesSectionKey: cardLayoutPresetOverrides?.[parentSectionKey] ?? "(none)",
          overrideId: overrideId ?? "(none)",
          defaultForSection: defaultForSection ?? "(none)",
        },
        decision: cardPresetId ?? null,
        final: {
          resolvedCardPresetId: cardPresetId,
          nodeType: node.type,
          layoutBefore,
          layoutAfter: cardPresetId,
        },
      });
    }
    if (cardPreset) {
      next.params = {
        ...(next.params ?? {}),
        ...(cardPreset.mediaPosition != null ? { mediaPosition: cardPreset.mediaPosition } : {}),
        ...(cardPreset.contentAlign != null ? { contentAlign: cardPreset.contentAlign } : {}),
      };
      next.layout = cardPresetId;
      // Card preset application traced via trace store
      if (process.env.NODE_ENV === "development") {
        pushTrace({
          system: "renderer",
          sectionId: parentSectionKey ?? "",
          action: "card-preset-applied",
          input: { cardPresetId },
          decision: "applied",
          final: { templateDefault: "—", FINAL: "card preset applied" },
        });
      }
    } else {
      next.layout = cardPresetId;
    }
  }

  if (Array.isArray(node.children)) {
    const sectionKey = isSection ? ((node.id ?? node.role) ?? "") : parentSectionKey ?? null;
    next.children = node.children.map((child) =>
      applyProfileToNode(child, profile, sectionLayoutPresetOverrides, cardLayoutPresetOverrides, sectionKey, next.layout ?? null, organInternalLayoutOverrides, forceCardCompatibility)
    );
  }

  return next;
}


/* ======================================================
   PURE RENDER — NO HOOKS, NO STATE ACCESS
====================================================== */
/** Experience context for visibility filter (optional). When absent, all nodes render. */
export type ExperienceContext = {
  experience: string;
  currentStepIndex: number;
  sectionKeys: string[];
  activeSectionKey?: string | null;
  onSelectSection?: (sectionKey: string) => void;
  /** Optional labels for section keys (e.g. "Hero", "Features") for collapsed panel title. */
  sectionLabels?: Record<string, string>;
};

/** Passed when rendering a section as child of screen for engine-owned spacing. */
export type SectionContext = { sectionIndex: number; totalSections: number };

export function renderNode(
  node: any,
  profile: any,
  stateSnapshot: any,
  defaultState?: any,
  sectionLayoutPresetOverrides?: Record<string, string>,
  cardLayoutPresetOverrides?: Record<string, string>,
  organInternalLayoutOverrides?: Record<string, string>,
  experienceContext?: ExperienceContext | null,
  depth: number = 0,
  forceCardCompatibility?: boolean,
  paletteOverride?: string,
  nodePath?: string,
  sectionContext?: SectionContext | null
): any {
  if (!node) return null;
  const effectivePath = nodePath ?? (node?.id ?? node?.role ?? `n_${depth}`);

  // ✅ JSON-SKIN ENGINE INTEGRATION (ONLY for json-skin type)
  if (node.type === "json-skin") {
    return (
      <MaybeDebugWrapper node={node} screenPath={node?.id ?? node?.role ?? "json-skin"}>
        <JsonSkinEngine screen={node} />
      </MaybeDebugWrapper>
    );
  }

  // Experience visibility filter (runtime-only; no JSON mutation)
  if (experienceContext?.experience) {
    const visibility = getExperienceVisibility(
      experienceContext.experience,
      node,
      depth,
      experienceContext.currentStepIndex,
      experienceContext.sectionKeys,
      experienceContext.activeSectionKey
    );
    if (visibility === "hide") return null;
    if (visibility === "collapse") {
      const sectionKey = (node.id ?? node.role) ?? "";
      const label =
        experienceContext.sectionLabels?.[sectionKey] ??
        (sectionKey ? sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1).replace(/-/g, " ") : "Section");
      const onSelect = experienceContext.onSelectSection;
      return (
        <div
          key={node.key ?? node.id}
          role="button"
          tabIndex={0}
          data-experience-collapsed
          data-section-id={sectionKey || undefined}
          data-experience="app"
          onClick={() => onSelect?.(sectionKey)}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect?.(sectionKey);
            }
          }}
          style={{
            padding: 0,
            margin: 0,
            background: "var(--color-surface-2, #f5f5f5)",
            borderRadius: "var(--radius-2, 6px)",
            border: "1px solid var(--color-border, #e0e0e0)",
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 500 }}>{label}</span>
        </div>
      );
    }
  }

  if (!shouldRenderNode(node, stateSnapshot, defaultState)) return null;

  const profiledNode = profile
    ? applyProfileToNode(node, profile, sectionLayoutPresetOverrides, cardLayoutPresetOverrides, null, null, organInternalLayoutOverrides, forceCardCompatibility)
    : node;


  const typeKey = profiledNode.type?.toLowerCase?.() ?? "";
  const def =
    (definitions as any)[profiledNode.type] ??
    (definitions as any)[typeKey] ??
    {};
  // Variant selection (definition-driven, deterministic):
  // 1) Use node.variant if present
  // 2) Else use "default" if present in def.variants
  // 3) Else use "filled" if present
  // 4) Else use first key of def.variants
  const variants: Record<string, any> | undefined = def.variants;
  const requestedVariant =
    typeof profiledNode.variant === "string" && profiledNode.variant.length > 0
      ? profiledNode.variant
      : undefined;
  const variantKey =
    requestedVariant ??
    (variants && Object.prototype.hasOwnProperty.call(variants, "default")
      ? "default"
      : variants && Object.prototype.hasOwnProperty.call(variants, "filled")
      ? "filled"
      : variants
      ? Object.keys(variants)[0]
      : undefined);
  const variantPreset = (variantKey && variants ? variants[variantKey] : null) ?? {};
  const sizePreset =
    def.sizes?.[profiledNode.size || "md"] ?? {};


  const moleculeSpec = profiledNode.params?.moleculeLayout;

  const visualPresetOverlay = getVisualPresetForMolecule(
    profiledNode.type,
    profile?.visualPreset,
    profile?.id
  );

  // Template visual architecture: card preset overlay for Card
  const cardPresetOverlay =
    typeKey === "card" && profile?.cardPreset
      ? getCardPreset(profile.cardPreset)
      : {};

  const elementId = profiledNode.id ?? profiledNode.role ?? effectivePath;
  if (isEnabled()) startTrace("render", elementId, effectivePath, profiledNode.type ?? typeKey);

  const resolvedParams = resolveParams(
    { ...visualPresetOverlay, ...cardPresetOverlay },
    variantPreset,
    sizePreset,
    profiledNode.params ?? {},
    paletteOverride
  );

  // Template visual architecture: section preset layout (gap/padding) merged into moleculeLayout.params
  const sectionPresetLayoutOverlay =
    typeKey === "section" && visualPresetOverlay?.layout
      ? { layout: visualPresetOverlay.layout }
      : {};
  const paramsAfterSectionLayout =
    Object.keys(sectionPresetLayoutOverlay).length > 0
      ? deepMergeParams(resolvedParams, sectionPresetLayoutOverlay)
      : resolvedParams;

  // Template visual architecture: spacing scale overlay for Section (PHASE I: section gap from layout-definitions only)
  const spacingOverlayRaw =
    typeKey === "section" && profile?.spacingScale
      ? getSpacingForScale(profile.spacingScale, "section")
      : {};
  // Section vertical spacing is engine-only; template/preset spacing is intentionally ignored. Strip spacing-scale section.layout.gap.
  const spacingOverlay =
    typeKey === "section" && spacingOverlayRaw?.layout && "gap" in spacingOverlayRaw.layout
      ? (() => {
          const { layout, ...rest } = spacingOverlayRaw;
          const { gap: _sectionGap, ...layoutRest } = layout as Record<string, unknown>;
          return { ...rest, layout: layoutRest };
        })()
      : spacingOverlayRaw;
  let paramsAfterSpacing =
    Object.keys(spacingOverlay).length > 0
      ? deepMergeParams(paramsAfterSectionLayout, spacingOverlay)
      : paramsAfterSectionLayout;

  // Section vertical spacing is engine-only; template/preset spacing is intentionally ignored. Strip layoutVariants gap/layout.gap.
  const rawVariantParams =
    typeKey === "section" && (profiledNode as any)._variantParams
      ? (profiledNode as any)._variantParams
      : {};
  const variantParamsOverlay =
    typeKey === "section" && rawVariantParams && (rawVariantParams.gap != null || (rawVariantParams as any).layout?.gap != null)
      ? (() => {
          const { gap: _g, layout, ...rest } = rawVariantParams as Record<string, unknown>;
          const out: Record<string, unknown> = { ...rest };
          if (layout && typeof layout === "object" && layout !== null) {
            const { gap: _lg, ...layoutRest } = layout as Record<string, unknown>;
            out.layout = layoutRest;
          }
          return out;
        })()
      : rawVariantParams;
  let finalParams =
    Object.keys(variantParamsOverlay).length > 0
      ? deepMergeParams(paramsAfterSpacing, variantParamsOverlay)
      : paramsAfterSpacing;

  const resolvedNode = {
    ...profiledNode,
    params: finalParams,
  };

  PipelineDebugStore.recordSectionRender(resolvedNode.id ?? resolvedNode.role ?? "anonymous", {
    cardMoleculeType: resolvedNode.type,
  });
  logParamsDiagnostic(typeKey, resolvedNode.id, finalParams);

  // Hero section traced via trace store

  const Component = (Registry as any)[resolvedNode.type];


  if (!Component) {
    emitRendererTrace({
      stage: "renderer-error",
      nodeId: resolvedNode.id ?? resolvedNode.role,
      message: `Missing registry entry: ${resolvedNode.type}`,
    });
    return (
      <MaybeDebugWrapper node={resolvedNode} screenPath={effectivePath}>
        <div
          style={{
            background: "#f5f5f5",
            borderRadius: 12,
            padding: "16px 20px",
            color: "#6b7280",
            fontSize: 14,
            fontWeight: 400,
          }}
        >
          Module loading…
        </div>
      </MaybeDebugWrapper>
    );
  }


  if (!isValidReactComponentType(Component)) {
    emitRendererTrace({
      stage: "renderer-error",
      nodeId: resolvedNode.id ?? resolvedNode.role,
      message: `Invalid registry component type: ${resolvedNode.type}`,
    });
    console.error("INVALID REGISTRY COMPONENT TYPE", resolvedNode.type);
    return null;
  }


  /* ======================================================
     PHASE 6: REPEATERS / COLLECTIONS
     If node has items array, render each item as a Card or custom block
     ====================================================== */
  let renderedChildren = null;
  
  if (Array.isArray(resolvedNode.items) && resolvedNode.items.length > 0) {
    // Repeater mode: render items array; apply card layout preset when parent is a section
    const itemType = resolvedNode.params?.repeater?.itemType || "card";
    const parentSectionKey =
      (resolvedNode.type?.toLowerCase?.() === "section")
        ? ((resolvedNode.id ?? resolvedNode.role) ?? "")
        : "";
    const sectionLayoutId = resolvedNode.layout ?? null;
    const overrideId = parentSectionKey ? (cardLayoutPresetOverrides?.[parentSectionKey] ?? null) : null;
    const defaultForSection = sectionLayoutId != null ? getDefaultCardPresetForSectionPreset(sectionLayoutId) : null;
    
    // TEMP SAFE MODE: Log fallback hits but do NOT assign default card preset
    let cardPresetId: string | null = null;
    
    if (parentSectionKey) {
      if (overrideId) {
        cardPresetId = overrideId;
      } else if (defaultForSection) {
        cardPresetId = defaultForSection;
      } else {
        // FALLBACK HIT: Safe default card preset would be used
        console.warn("[FALLBACK HIT]", {
          sectionKey: parentSectionKey,
          requestedLayout: sectionLayoutId ?? "(none)",
          templateDefault: defaultForSection ?? "(none)",
          override: overrideId ?? "(none)",
          safeDefault: SAFE_DEFAULT_CARD_PRESET_ID,
          source: "SAFE_DEFAULT_CARD_PRESET_ID (repeater)",
        });
        // Do NOT assign fallback - leave as null to expose missing JSON
        cardPresetId = null;
      }
    }
    const cardPreset = cardPresetId ? getCardLayoutPreset(cardPresetId) : null;
    // Repeater card layout chain traced via trace store
    if (process.env.NODE_ENV === "development") {
      pushTrace({
        system: "renderer",
        sectionId: parentSectionKey ?? "",
        action: "repeater-card-layout-resolution",
        input: {
          cardOverridesSectionKey: cardLayoutPresetOverrides?.[parentSectionKey] ?? "(none)",
          overrideId: overrideId ?? "(none)",
          defaultForSection: defaultForSection ?? "(none)",
        },
        decision: cardPresetId ?? null,
        final: {
          resolvedCardPresetId: cardPresetId,
          nodeType: "section(items)",
        },
      });
    }

    renderedChildren = resolvedNode.items.map((item: any, i: number) => {
      let itemParams = item.params || {};
      if (cardPreset && (itemType === "card" || itemType === "feature-card")) {
        itemParams = {
          ...itemParams,
          ...(cardPreset.mediaPosition != null ? { mediaPosition: cardPreset.mediaPosition } : {}),
          ...(cardPreset.contentAlign != null ? { contentAlign: cardPreset.contentAlign } : {}),
        };
      }
      const itemNode: any = {
        type: itemType === "feature-card" ? "Card" : "Card",
        id: item.id || `item-${i}`,
        content: {
          title: item.title,
          body: item.body,
          media: item.icon || item.image,
        },
        params: itemParams,
      };
      if (cardPresetId) itemNode.layout = cardPresetId;

      const uniqueKey = item.id || `item-${i}`;
      return renderNode({ ...itemNode, key: uniqueKey }, profile, stateSnapshot, defaultState, sectionLayoutPresetOverrides, cardLayoutPresetOverrides, organInternalLayoutOverrides, experienceContext, depth + 1, forceCardCompatibility, paletteOverride, `${effectivePath}.items[${i}]`);
    });
  } else if (Array.isArray(resolvedNode.children)) {
    // Normal mode: render children
    const isScreen = depth === 0 && (typeKey === "screen" || resolvedNode.type === "screen");
    renderedChildren = resolvedNode.children.map((child: any, i: number) => {
      const uniqueKey = child.id || `${child.type}-${i}`;
      const childSectionContext =
        isScreen && (child.type?.toLowerCase?.() === "section")
          ? { sectionIndex: i, totalSections: resolvedNode.children.length }
          : undefined;
      return renderNode(
        { ...child, key: uniqueKey },
        profile,
        stateSnapshot,
        defaultState,
        sectionLayoutPresetOverrides,
        cardLayoutPresetOverrides,
        organInternalLayoutOverrides,
        experienceContext,
        depth + 1,
        forceCardCompatibility,
        paletteOverride,
        `${effectivePath}.children[${i}]`,
        childSectionContext ?? undefined
      );
    });
  }


  // Section layout is driven by section.layout id; do not overwrite params.moleculeLayout for sections.
  if (moleculeSpec?.type && typeKey !== "section") {
    const layoutParams = resolveMoleculeLayout(
      moleculeSpec.type,
      moleculeSpec.preset,
      moleculeSpec.params
    );
    // Preserve preset/spacing-scale gap/padding; layout definition fills flow/direction/defaults
    const mergedLayoutParams = {
      ...layoutParams,
      ...(resolvedNode.params.moleculeLayout?.params ?? {}),
    };
    resolvedNode.params.moleculeLayout = {
      ...moleculeSpec,
      params: mergedLayoutParams,
    };
  }


  const rawBehavior = resolvedNode.behavior ?? {};
  const behavior =
    shouldStripBehavior(resolvedNode.type, rawBehavior) ? {} : rawBehavior;

  const props: any = {
    ...resolvedNode,
    params: resolvedNode.params,
    content: resolvedNode.content ?? {},
    behavior,
    onTap: resolvedNode.onTap,
  };

  // Phase C: journal display injection (display-only)
  if (resolvedNode.type === "JournalHistory" || resolvedNode.type === "journalhistory") {
    const track = props.params?.track;
    const entry = typeof track === "string" && track.length > 0
      ? getState()?.journal?.[track]?.entry
      : undefined;

    const entries = Array.isArray(entry)
      ? entry
      : typeof entry === "string" && entry.length > 0
      ? [entry]
      : [];

    props.params = {
      ...(props.params ?? {}),
      entries,
    };
  }

  // Phase B: minimal state → Field value binding (no general adapter yet)
  // If we have a state-backed value for this fieldKey, pass it into FieldAtom as a controlled value.
  if (
    (resolvedNode.type === "field" || resolvedNode.type === "Field") &&
    resolvedNode.params?.field?.fieldKey
  ) {
    const fk = resolvedNode.params.field.fieldKey;
    if (typeof fk === "string" && fk.length > 0) {
      const nextValue =
        stateSnapshot?.values && stateSnapshot.values[fk] !== undefined
          ? stateSnapshot.values[fk]
          : stateSnapshot?.[fk];
      if (nextValue !== undefined) {
        props.params = {
          ...(props.params ?? {}),
          field: {
            ...(props.params?.field ?? {}),
            value: nextValue,
          },
        };
      }
    }
  }

  // Phase B: state binding for Select — controlled value from stateSnapshot (same pattern as Field).
  if (
    (resolvedNode.type === "select" || resolvedNode.type === "Select") &&
    (resolvedNode.params?.field?.fieldKey || resolvedNode.params?.key)
  ) {
    const key =
      typeof resolvedNode.params?.field?.fieldKey === "string" &&
      resolvedNode.params.field.fieldKey.length > 0
        ? resolvedNode.params.field.fieldKey
        : resolvedNode.params?.key;
    if (typeof key === "string" && key.length > 0) {
      const nextValue =
        stateSnapshot?.values && stateSnapshot.values[key] !== undefined
          ? stateSnapshot.values[key]
          : stateSnapshot?.[key];
      if (nextValue !== undefined) {
        props.params = {
          ...(props.params ?? {}),
          value: nextValue,
        };
      }
    }
  }

  // Phase C: state binding for Stepper — pass currentView for active tab styling
  if (
    (resolvedNode.type === "stepper" || resolvedNode.type === "Stepper") &&
    stateSnapshot?.currentView !== undefined
  ) {
    props.activeValue = stateSnapshot.currentView;
  }

  // Phase C: List itemsFromState — resolve state path to items; map to List content.items
  const isList = resolvedNode.type === "List" || resolvedNode.type === "list";
  const itemsFromStatePath = resolvedNode.content?.itemsFromState;
  if (isList && typeof itemsFromStatePath === "string" && stateSnapshot?.values) {
    const pathParts = itemsFromStatePath.trim().split(".").filter(Boolean);
    let value: unknown = stateSnapshot.values;
    for (const part of pathParts) {
      value = value != null && typeof value === "object" && part in value
        ? (value as Record<string, unknown>)[part]
        : undefined;
    }
    if (Array.isArray(value)) {
      const mapper = resolvedNode.content?.itemsFromStateMapper;
      const defaultMap = (item: any) => ({
        label: item?.title ?? item?.label ?? String(item?.id ?? ""),
        behavior: item?.id != null
          ? { type: "Action", params: { name: "structure:updateItem", id: item.id } }
          : undefined,
      });
      const mapFn = mapper === "structureToList" || mapper === "structureToListItem" ? defaultMap : defaultMap;
      props.content = { ...(props.content ?? {}), items: value.map((item: any) => mapFn(item)) };
    }
  }

  // Phase C: List blocksFromState (V6) — resolve blocksByDate[selectedDate] for day layout
  const blocksFromStatePath = resolvedNode.content?.blocksFromState;
  const blocksFromStateDateKey = resolvedNode.content?.blocksFromStateDateKey;
  if (
    isList &&
    typeof blocksFromStatePath === "string" &&
    stateSnapshot?.values
  ) {
    const pathParts = blocksFromStatePath.trim().split(".").filter(Boolean);
    let blocksByDate: unknown = stateSnapshot.values;
    for (const part of pathParts) {
      blocksByDate =
        blocksByDate != null && typeof blocksByDate === "object" && part in (blocksByDate as object)
          ? (blocksByDate as Record<string, unknown>)[part]
          : undefined;
    }
    let dateKey: string | undefined;
    if (typeof blocksFromStateDateKey === "string") {
      const datePathParts = blocksFromStateDateKey.trim().split(".").filter(Boolean);
      let v: unknown = stateSnapshot.values;
      for (const part of datePathParts) {
        v = v != null && typeof v === "object" && part in (v as object) ? (v as Record<string, unknown>)[part] : undefined;
      }
      dateKey = typeof v === "string" ? v : undefined;
    }
    if (!dateKey) {
      const now = new Date();
      dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    }
    const blocks =
      blocksByDate != null && typeof blocksByDate === "object" && dateKey in (blocksByDate as object)
        ? (blocksByDate as Record<string, unknown>)[dateKey]
        : undefined;
    if (Array.isArray(blocks)) {
      const blockItems = blocks.map((block: any) => ({
        label: block?.label ?? (block?.start != null && block?.end != null ? `${block.start}–${block.end}` : "Block"),
        behavior: undefined,
      }));
      props.content = { ...(props.content ?? {}), items: blockItems };
    }
  }

  // Phase C: List scheduledFromState (V6) — tasks due on selectedDate, sorted by priority
  const scheduledFromStatePath = resolvedNode.content?.scheduledFromState;
  const scheduledFromStateDateKey = resolvedNode.content?.scheduledFromStateDateKey;
  if (
    isList &&
    typeof scheduledFromStatePath === "string" &&
    stateSnapshot?.values
  ) {
    const pathParts = scheduledFromStatePath.trim().split(".").filter(Boolean);
    let slice: any = stateSnapshot.values;
    for (const part of pathParts) {
      slice = slice != null && typeof slice === "object" && part in slice ? slice[part] : undefined;
    }
    let dateKey: string | undefined;
    if (typeof scheduledFromStateDateKey === "string") {
      const datePathParts = scheduledFromStateDateKey.trim().split(".").filter(Boolean);
      let v: unknown = stateSnapshot.values;
      for (const part of datePathParts) {
        v = v != null && typeof v === "object" && part in (v as object) ? (v as Record<string, unknown>)[part] : undefined;
      }
      dateKey = typeof v === "string" ? v : undefined;
    }
    if (!dateKey) {
      const now = new Date();
      dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    }
    const date = new Date(dateKey + "T12:00:00");
    const items: any[] = Array.isArray(slice?.items) ? slice.items : [];
    const rules = slice?.rules ?? {};
    const dueItems = items.filter((item: any) => isDueOn(item, date));
    const sorted = sortByPriority(dueItems, date, rules);
    const scheduledItems = sorted.map((item: any) => ({
      label: item?.title ?? item?.id ?? "",
      behavior: item?.id != null
        ? { type: "Action", params: { name: "structure:updateItem", id: item.id } }
        : undefined,
    }));
    props.content = { ...(props.content ?? {}), items: scheduledItems };
  }

  // Phase C: List cellsFromState (V6) — path to array (e.g. monthRollup), map to list items
  const cellsFromStatePath = resolvedNode.content?.cellsFromState;
  if (isList && typeof cellsFromStatePath === "string" && stateSnapshot?.values) {
    const pathParts = cellsFromStatePath.trim().split(".").filter(Boolean);
    let value: unknown = stateSnapshot.values;
    for (const part of pathParts) {
      value = value != null && typeof value === "object" && part in (value as object) ? (value as Record<string, unknown>)[part] : undefined;
    }
    if (Array.isArray(value)) {
      const cellItems = value.map((cell: any) => ({
        label:
          cell?.period != null && typeof cell?.count === "number"
            ? `${cell.period} (${cell.count})`
            : cell?.label ?? String(cell?.period ?? ""),
        behavior: undefined,
      }));
      props.content = { ...(props.content ?? {}), items: cellItems };
    }
  }

  // Phase C: Card bodyFromState (V6) — resolve path and set content.body (e.g. stats)
  const isCard = resolvedNode.type === "Card" || resolvedNode.type === "card";
  const bodyFromStatePath = resolvedNode.content?.bodyFromState;
  if (isCard && typeof bodyFromStatePath === "string" && stateSnapshot?.values) {
    const pathParts = bodyFromStatePath.trim().split(".").filter(Boolean);
    let value: unknown = stateSnapshot.values;
    for (const part of pathParts) {
      value = value != null && typeof value === "object" && part in (value as object) ? (value as Record<string, unknown>)[part] : undefined;
    }
    if (value != null) {
      const body =
        typeof value === "string"
          ? value
          : typeof value === "object" &&
              value !== null &&
              "todayCount" in value &&
              "weekCount" in value
            ? `Today: ${(value as any).todayCount} | Week: ${(value as any).weekCount} | Month: ${(value as any).monthCount ?? 0}`
            : JSON.stringify(value);
      props.content = { ...(props.content ?? {}), body };
    }
  }

  delete props.type;
  delete props.key;
  // Section layout: driven by layout-2 id only (set in applyProfileToNode); strip legacy keys.
  delete (props as any).layoutPreset;
  delete (props as any).layout;
  // Pass through section layout id and templateId so SectionCompound can use LayoutMoleculeRenderer with context.
  if (typeKey === "section") {
    if (resolvedNode.layout != null) {
      (props as any).layout = resolvedNode.layout;
    } else if (LAYOUT_RECOVERY_MODE) {
      (props as any).layout = "content-stack";
    }
    const templateId = profile?.id;
    if (templateId) {
      (props as any).templateId = templateId;
    }
    // Engine-owned spacing: pass section index and total for context-aware padding/gap
    (props as any).sectionIndex = sectionContext?.sectionIndex ?? 0;
    (props as any).totalSections = sectionContext?.totalSections ?? 1;
  }

  const nodeIdForTrace = resolvedNode.id ?? resolvedNode.role ?? "anonymous";
  const layoutIdForTrace = resolvedNode.layout != null ? String(resolvedNode.layout) : "";
  const componentName = (Component as any).displayName ?? (Component as any).name ?? resolvedNode.type ?? "Unknown";
  emitRendererTrace({
    stage: "component-render",
    nodeId: nodeIdForTrace,
    layoutId: layoutIdForTrace,
    component: componentName,
  });

  if (isEnabled()) endTrace();

  const rawContent = (
    <MaybeDebugWrapper node={resolvedNode} screenPath={effectivePath}>
      <Component {...props}>{renderedChildren}</Component>
    </MaybeDebugWrapper>
  );

  const content =
    typeKey === "section"
      ? (
        <OriginTraceProvider
          value={{
            sectionId: (resolvedNode.id ?? resolvedNode.role ?? "") || undefined,
            layoutId: (resolvedNode.layout ?? (resolvedNode as any)._effectiveLayoutPreset) ?? undefined,
            jsonPath: effectivePath,
          }}
        >
          {rawContent}
        </OriginTraceProvider>
      )
      : (
        <OriginTraceProvider
          value={{
            moleculeId: (resolvedNode.type ?? resolvedNode.id ?? "") || undefined,
            jsonPath: effectivePath,
          }}
        >
          {rawContent}
        </OriginTraceProvider>
      );

  if (typeKey === "section" && isLayoutDebug()) {
    return <SectionLayoutDebugOverlay node={resolvedNode}>{content}</SectionLayoutDebugOverlay>;
  }
  return content;
}


/* ======================================================
   ROOT — REACTIVE SNAPSHOT
====================================================== */
/** Map behavior profile to transition hint for optional CSS (calm=longer, fast=shorter, default=normal). */
function getBehaviorTransitionHint(profile: string): string {
  if (profile === "calm") return "calm";
  if (profile === "fast") return "fast";
  return "default";
}

/** Motion duration scale from behavior profile: calm=slower, fast=snappier, others=1. Single source for --motion-duration-scale. */
function getMotionDurationScale(profile: string): number {
  if (profile === "calm") return 1.25;
  if (profile === "fast") return 0.85;
  return 1;
}

export default function JsonRenderer({
  node,
  defaultState,
  profileOverride,
  sectionLayoutPresetOverrides,
  cardLayoutPresetOverrides,
  organInternalLayoutOverrides,
  screenId,
  behaviorProfile: behaviorProfileProp,
  experience,
  currentStepIndex,
  sectionKeys,
  activeSectionKey,
  onSelectSection,
  sectionLabels: sectionLabelsProp,
  forceCardCompatibility,
  paletteOverride,
}: {
  node: any;
  defaultState?: any;
  /**
   * Optional experience profile JSON providing `sections` mapping for role-based section layout.
   * If omitted, JsonRenderer falls back to the layout-store snapshot.
   */
  profileOverride?: any;
  /** Per-section section layout preset overrides (sectionKey -> presetId). */
  sectionLayoutPresetOverrides?: Record<string, string>;
  /** Per-section card layout preset overrides (sectionKey -> presetId). */
  cardLayoutPresetOverrides?: Record<string, string>;
  /** Per-section organ internal layout overrides (sectionKey -> internalLayoutId). */
  organInternalLayoutOverrides?: Record<string, string>;
  /** Screen key for this render (e.g. for override lookup). */
  screenId?: string;
  /** Behavior profile from state.values.behaviorProfile (calm/fast/default etc). Applied as attr + class on root wrapper only. */
  behaviorProfile?: string;
  /** Experience mode (website | app | learning). When set, experience-visibility filter is applied. */
  experience?: string;
  /** Current step index for learning experience (0-based). */
  currentStepIndex?: number;
  /** Ordered section keys for step/panel visibility. */
  sectionKeys?: string[];
  /** App mode: which section panel is expanded (section key). */
  activeSectionKey?: string | null;
  /** App mode: callback when user clicks a collapsed panel to expand it. */
  onSelectSection?: (sectionKey: string) => void;
  /** Optional labels for section keys (for collapsed panel title in app mode). */
  sectionLabels?: Record<string, string>;
  /** When true, treat card layout as valid for compatibility (e.g. preview tiles so overrides always render). */
  forceCardCompatibility?: boolean;
  /** When set (e.g. palette preview tile), token resolution uses this palette instead of the global store. */
  paletteOverride?: string;
}) {
  // 🔑 Track if user has interacted (state changed from default) - use reactive state after interaction
  const hasInteracted = React.useRef(false);
  const lastDefaultState = React.useRef(defaultState?.currentView);

  // Mount/unmount lifecycle removed from console - use trace store if needed
  React.useEffect(() => {
    // Removed console.log
    return () => {
      // Removed console.log
    };
  }, []);

  // 🔑 LIFECYCLE: Mount/unmount traced via trace store if needed
  React.useEffect(() => {
    // Reset interaction flag when defaultState changes (new screen loaded)
    if (lastDefaultState.current !== defaultState?.currentView) {
      hasInteracted.current = false;
      lastDefaultState.current = defaultState?.currentView;
    }
    
    return () => {
      // Reset when unmounting (new screen loading)
      hasInteracted.current = false;
    };
  }, [node?.id, defaultState?.currentView]); // Reset when screen changes

  // TSX passthrough (unchanged)
  if (node && typeof node === "object" && (node as any).$$typeof) {
    return node;
  }


  beginCycle();

  // Proof diagnostic: section keys passed from page (from collectSectionKeysAndNodes on tree children).
  console.log("SECTION_KEYS_DETECTED", sectionKeys ?? []);
  if (!sectionKeys || sectionKeys.length === 0) {
    console.log("NO_SECTIONS_FOUND_IN_TREE");
  }

  if (process.env.NODE_ENV === "development") {
    const templateId = profileOverride?.id ?? null;
    recordStage("jsonRenderer", "pass", {
      templateId,
      hasDoc: !!node,
      overrideKeys: {
        section: Object.keys(sectionLayoutPresetOverrides ?? {}).slice(0, 8),
        card: Object.keys(cardLayoutPresetOverrides ?? {}).slice(0, 8),
        organ: Object.keys(organInternalLayoutOverrides ?? {}).slice(0, 8),
      },
      ts: Date.now(),
    });
    PipelineDebugStore.setJsonRendererPropsSnapshot({
      sectionLayoutPresetOverrides: sectionLayoutPresetOverrides ?? {},
      cardLayoutPresetOverrides: cardLayoutPresetOverrides ?? {},
      organInternalLayoutOverrides: organInternalLayoutOverrides ?? {},
      screenId: screenId ?? null,
    });
    if (process.env.NODE_ENV === "development") {
      PipelineDebugStore.mark("json-renderer", "props-snapshot", {
        screenId: screenId ?? null,
        overrideKeys: {
          section: Object.keys(sectionLayoutPresetOverrides ?? {}).slice(0, 8),
          card: Object.keys(cardLayoutPresetOverrides ?? {}).slice(0, 8),
        },
      });
    }
  }

  useSyncExternalStore(
    subscribePalette,
    getPaletteName,
    () => "default"
  );


  const layoutSnapshot = useSyncExternalStore(
    subscribeLayout,
    getLayout,
    getLayout
  );
  const profile = profileOverride ?? layoutSnapshot;

  // Layout preview pipeline traced via trace store
  if (process.env.NODE_ENV === "development") {
    pushTrace({
      system: "renderer",
      sectionId: "",
      action: "layout-preview-pipeline",
      input: { layoutSnapshotTemplateId: (layoutSnapshot as any)?.templateId },
      decision: null,
      final: null,
    });
  }

  // 🔍 PHASE 1 VERIFICATION: Log profile sections and visualPreset
  React.useEffect(() => {
    if (profile?.sections) {
      // Profile active traced via trace store
      if (process.env.NODE_ENV === "development") {
        pushTrace({
          system: "renderer",
          sectionId: "",
          action: "profile-active",
          input: {
            visualPreset: profile.visualPreset,
            templateId: (layoutSnapshot as any)?.templateId,
          },
          decision: null,
          final: null,
        });
      }
    }
  }, [profile?.sections, profile?.visualPreset, (layoutSnapshot as any)?.templateId]);

  // 🔍 UI PIPELINE TRACE: Add ?trace=ui to URL to log params per molecule + TextAtom breakdown
  React.useEffect(() => {
    if (isTraceUI()) {
      // UI pipeline trace active - use trace store
    }
  }, []);


  // 🔑 Single authoritative reactive snapshot
  const rawState = useSyncExternalStore(
    subscribeState,
    getState,
    getState
  );

  // Flatten state for shouldRenderNode access (currentView at root level)
  // 🔑 CRITICAL: Use defaultState until user interacts, then switch to reactive state
  // This ensures: initial render shows correct view (localhost), behaviors work after clicks (Cursor)
  // Track if state has changed from default (user interaction)
  if (rawState?.currentView !== undefined && rawState?.currentView !== defaultState?.currentView) {
    hasInteracted.current = true;
  }
  
  const effectiveCurrentView = !hasInteracted.current && defaultState?.currentView
    ? defaultState.currentView  // Before interaction: use defaultState
    : (rawState?.currentView ?? defaultState?.currentView);  // After interaction: use reactive state
  
  const stateSnapshot = {
    ...rawState,
    ...rawState?.values,
    // IMPORTANT: ensure state.values can never override currentView (breaks `when` gating)
    currentView: effectiveCurrentView,
  };

  // Contract migration (Phase 1.3): do NOT read state from the node tree.
  // Default state must be supplied externally (e.g. by screen-loader / page.tsx).
  const effectiveDefaultState = defaultState;


  traceOnce("root", "Root render");
  trace({ time: Date.now(), type: "render", label: node?.type ?? "unknown" });
  PipelineDebugStore.setLastRenderRoot(node?.id ?? "unknown");

  // Behavior profile: prop from page or state.values.behaviorProfile; applied only as attr/class on root wrapper.
  const behaviorProfile = behaviorProfileProp ?? (rawState?.values?.behaviorProfile as string) ?? "default";
  const behaviorTransition = getBehaviorTransitionHint(behaviorProfile);

  console.log("SYSTEM_STATE", {
    behavior: rawState?.values?.behaviorProfile,
    template: rawState?.values?.templateId ?? profile?.id,
    palette: rawState?.values?.paletteName ?? (typeof getPaletteName === "function" ? getPaletteName() : undefined),
    styling: rawState?.values?.stylingPreset,
    layoutOverride: screenId ? rawState?.layoutByScreen?.[screenId] : rawState?.layoutByScreen,
  });

  const experienceContext: ExperienceContext | null =
    experience && sectionKeys
      ? {
          experience,
          currentStepIndex: currentStepIndex ?? 0,
          sectionKeys,
          activeSectionKey: activeSectionKey ?? undefined,
          onSelectSection,
          sectionLabels: sectionLabelsProp,
        }
      : null;

  PipelineDebugStore.startRenderPass();
  const result = renderNode(node, profile, stateSnapshot, effectiveDefaultState, sectionLayoutPresetOverrides, cardLayoutPresetOverrides, organInternalLayoutOverrides, experienceContext, 0, forceCardCompatibility, paletteOverride, node?.id ?? node?.role ?? "root");
  PipelineDebugStore.endRenderPass();
  recordStage("render", "pass", "Render cycle completed");
  
  // End interaction after render completes
  if (process.env.NODE_ENV === "development") {
    endInteraction();
  }

  const rootJsonPath = node?.id ?? node?.role ?? "root";
  const isJournalScreen = typeof screenId === "string" && screenId.toLowerCase().includes("journal");
  const rootClassName = [
    `behavior-${behaviorProfile}`,
    isJournalScreen ? "compact-form" : "",
  ].filter(Boolean).join(" ");

  console.log("BEHAVIOR_SCALE", {
    behaviorProfile,
    scale: getMotionDurationScale(behaviorProfile),
  });

  return (
    <OriginTraceProvider value={{ screenId: screenId ?? undefined, jsonPath: rootJsonPath }}>
      <div
        data-render-source="json"
        data-screen-id={screenId ?? ""}
        data-json-path={rootJsonPath}
        data-behavior-profile={behaviorProfile}
        data-behavior-transition={behaviorTransition}
        className={rootClassName}
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          marginLeft: "auto",
          marginRight: "auto",
          ["--motion-duration-scale" as string]: String(getMotionDurationScale(behaviorProfile)),
        }}
      >
        {result}
      </div>
    </OriginTraceProvider>
  );
}


