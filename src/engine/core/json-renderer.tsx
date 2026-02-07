"use client";
import React from "react";
import Registry from "./registry";
import { resolveParams } from "./palette-resolver";
import definitions from "@/compounds/ui/index";
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
} from "@/layout";
import { logRuntimeDecision } from "@/engine/devtools/runtime-decision-trace";
import { NON_ACTIONABLE_TYPES } from "@/contracts/renderer-contract";
import { EXPECTED_PARAMS } from "@/contracts/expected-params";
import { trace } from "@/devtools/interaction-tracer.store";
import { PipelineDebugStore } from "@/devtools/pipeline-debug-store";
import { recordStage } from "@/engine/debug/pipelineStageTrace";
import { emitRendererTrace } from "@/engine/debug/renderer-trace";


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
  console.log("[JsonRenderer]", ...args);
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
      <div style={{ paddingTop: "var(--spacing-6)" }}>{children}</div>
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

function MaybeDebugWrapper({ node, children }: any) {
  // Default: real UI (no debug boxes)
  // Opt-in: `?debug=1` brings back DebugWrapper overlays
  if (isDebugMode()) return <DebugWrapper node={node}>{children}</DebugWrapper>;

  // Preserve `data-node-id` for tooling (e.g. visual-proof selectors) without affecting layout.
  // `display: contents` avoids extra box-model impact.
  return (
    <div data-node-id={node?.id} style={{ display: "contents" }}>
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


  // 🔒 Authoritative gating:
  // 🔑 CRITICAL: Use reactive state if it exists (user interactions), fallback to defaultState for initial render
  // This ensures behaviors work (reactive state) while initial render shows correct view (defaultState)
  let stateValue: any;
  
  // Reactive state takes priority (user has interacted)
  if (state?.[key] !== undefined) {
    stateValue = state[key];
  } else if (defaultState?.[key] !== undefined) {
    // No reactive state yet - use defaultState for initial render
    stateValue = defaultState[key];
  } else {
    stateValue = undefined;
  }
  
  // Debug logging
  if (key === "currentView") {
    console.log("[shouldRenderNode]", {
      nodeId: node?.id,
      key,
      equals,
      stateValue,
      stateCurrentView: state?.currentView,
      defaultStateCurrentView: defaultState?.currentView,
      usingDefault: defaultState?.[key] !== undefined && state?.[key] !== defaultState[key],
      willRender: stateValue === equals,
    });
  }
  
  // If state key doesn't exist in either, don't render (prevents showing wrong content)
  if (stateValue === undefined) {
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
  organInternalLayoutOverrides?: Record<string, string>
): any {
  if (!node || !profile) return node;

  const next = { ...node };

  // 🔑 Template = defaults, organ = overrides. When mode === "custom", skip template section logic.
  const isSection = node.type?.toLowerCase?.() === "section";
  const isCard = node.type?.toLowerCase() === "card";
  const layoutMode = profile?.mode ?? "template";

  // Layout from Layout Engine / Preset only — never from node. Strip layout keys from section params so JSON cannot supply layout.
  if (isSection && next.params && typeof next.params === "object") {
    const p = next.params as Record<string, unknown>;
    delete p.moleculeLayout;
    delete p.layoutPreset;
    delete p.layout;
    delete p.containerWidth;
    delete p.backgroundVariant;
    delete p.split;
  }
  // Per-section: set a single layout-2 string id (OrganPanel overrides, explicit node.layout, template default).
  // Single authority: layout.getSectionLayoutId (override → node.layout → template role → template default).
  if (isSection) {
    const sectionKey = (node.id ?? node.role) ?? "";
    const templateId = (profile?.id ?? null) as string | null;
    const { layoutId, ruleApplied } = getSectionLayoutId(
      {
        sectionKey,
        node,
        templateId,
        sectionLayoutPresetOverrides,
        defaultSectionLayoutIdFromProfile: (profile as { defaultSectionLayoutId?: string } | null)?.defaultSectionLayoutId,
      },
      { includeRule: true }
    );
    const overrideId = sectionLayoutPresetOverrides?.[sectionKey]?.trim() ?? null;
    const existingLayoutId =
      typeof node.layout === "string" && (node.layout as string).trim()
        ? (node.layout as string).trim()
        : null;
    console.log("FLOW 5 — RENDERER INPUT", {
      sectionId: sectionKey,
      sectionOverride: sectionLayoutPresetOverrides?.[sectionKey],
      finalLayout: layoutId,
    });
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
      decisionMade: layoutId ?? null,
      downstreamEffect: "section layout + compatibility",
    });
    next.layout = layoutId;
    (next as any)._effectiveLayoutPreset = layoutId;
    if (process.env.NODE_ENV === "development") {
      PipelineDebugStore.mark("json-renderer", "applyProfileToNode.section", {
        sectionKey,
        layoutId: layoutId ?? null,
      });
    }
    const resolvedSectionKey = (sectionKey && sectionKey.trim()) ? sectionKey : (node?.id ?? node?.role ?? "anonymous");
    const cardVal = cardLayoutPresetOverrides?.[sectionKey];
    const organVal = organInternalLayoutOverrides?.[sectionKey];
    console.log("RESOLVER INPUT", resolvedSectionKey, {
      sectionOverride: overrideId ?? undefined,
      cardOverride: cardVal,
      organOverride: organVal,
      chosenLayout: layoutId ?? undefined,
    });
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
        finalChosenLayout: layoutId ?? undefined,
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
    if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
      console.debug("[LAYOUT RESOLVE]", {
        nodeId: sectionKey || (node.id ?? node.role),
        sectionLayout: existingLayoutId ?? "—",
        cardLayout: "—",
        profileOverride: overrideId ?? "—",
        templateDefault: (ruleApplied === "template role" || ruleApplied === "template default" ? layoutId : undefined) ?? "—",
        FINAL: layoutId ?? "undefined",
      });
    }
    const compatibility = evaluateCompatibility({
      sectionNode: node,
      sectionLayoutId: next.layout ?? null,
      cardLayoutId: cardLayoutPresetOverrides?.[sectionKey] ?? null,
      organId: node.role ?? null,
      organInternalLayoutId: organInternalLayoutOverrides?.[sectionKey] ?? null,
    });
    if (process.env.NODE_ENV === "development") {
      console.debug("Layout compatibility:", compatibility);
    }
  }

  // Per-section card layout preset: merge mediaPosition, contentAlign into Card children only.
  if (isCard && parentSectionKey && cardLayoutPresetOverrides?.[parentSectionKey]) {
    const cardPresetId = cardLayoutPresetOverrides[parentSectionKey];
    const cardPreset = getCardLayoutPreset(cardPresetId);
    if (cardPreset) {
      next.params = {
        ...(next.params ?? {}),
        ...(cardPreset.mediaPosition != null ? { mediaPosition: cardPreset.mediaPosition } : {}),
        ...(cardPreset.contentAlign != null ? { contentAlign: cardPreset.contentAlign } : {}),
      };
      if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
        console.log("[JsonRenderer] Card preset applied", {
          sectionKey: parentSectionKey,
          cardPresetId,
          mediaPosition: cardPreset.mediaPosition,
          contentAlign: cardPreset.contentAlign,
        });
        console.debug("[LAYOUT RESOLVE]", {
          nodeId: node.id ?? node.role ?? parentSectionKey,
          sectionLayout: "—",
          cardLayout: cardPresetId,
          profileOverride: cardPresetId,
          templateDefault: "—",
          FINAL: "card preset applied",
        });
      }
    }
  }

  if (Array.isArray(node.children)) {
    const sectionKey = isSection ? ((node.id ?? node.role) ?? "") : parentSectionKey ?? null;
    next.children = node.children.map((child) =>
      applyProfileToNode(child, profile, sectionLayoutPresetOverrides, cardLayoutPresetOverrides, sectionKey, organInternalLayoutOverrides)
    );
  }

  return next;
}


/* ======================================================
   PURE RENDER — NO HOOKS, NO STATE ACCESS
====================================================== */
export function renderNode(
  node: any,
  profile: any,
  stateSnapshot: any,
  defaultState?: any,
  sectionLayoutPresetOverrides?: Record<string, string>,
  cardLayoutPresetOverrides?: Record<string, string>,
  organInternalLayoutOverrides?: Record<string, string>
): any {
  if (!node) return null;

  // ✅ JSON-SKIN ENGINE INTEGRATION (ONLY for json-skin type)
  if (node.type === "json-skin") {
    return (
      <MaybeDebugWrapper node={node}>
        <JsonSkinEngine screen={node} />
      </MaybeDebugWrapper>
    );
  }

  if (!shouldRenderNode(node, stateSnapshot, defaultState)) return null;

  const profiledNode = profile
    ? applyProfileToNode(node, profile, sectionLayoutPresetOverrides, cardLayoutPresetOverrides, null, organInternalLayoutOverrides)
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

  const resolvedParams = resolveParams(
    { ...visualPresetOverlay, ...cardPresetOverlay },
    variantPreset,
    sizePreset,
    profiledNode.params ?? {}
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

  // Template visual architecture: spacing scale overlay for Section
  const spacingOverlay =
    typeKey === "section" && profile?.spacingScale
      ? getSpacingForScale(profile.spacingScale, "section")
      : {};
  let finalParams =
    Object.keys(spacingOverlay).length > 0
      ? deepMergeParams(paramsAfterSectionLayout, spacingOverlay)
      : paramsAfterSectionLayout;

  const resolvedNode = {
    ...profiledNode,
    params: finalParams,
  };

  PipelineDebugStore.recordSectionRender(resolvedNode.id ?? resolvedNode.role ?? "anonymous", {
    cardMoleculeType: resolvedNode.type,
  });
  logParamsDiagnostic(typeKey, resolvedNode.id, finalParams);

  // Hero section only: log section layout id (diagnose preset → layout).
  if (typeKey === "section" && (profiledNode.role ?? resolvedNode.role) === "hero") {
    console.log("[JsonRenderer] HERO SECTION (layout-2)", {
      id: resolvedNode.id,
      layout: resolvedNode.layout,
      _effectiveLayoutPreset: (profiledNode as any)._effectiveLayoutPreset,
    });
  }

  const Component = (Registry as any)[resolvedNode.type];


  if (!Component) {
    emitRendererTrace({
      stage: "renderer-error",
      nodeId: resolvedNode.id ?? resolvedNode.role,
      message: `Missing registry entry: ${resolvedNode.type}`,
    });
    return (
      <MaybeDebugWrapper node={resolvedNode}>
        <div style={{ color: "red" }}>
          Missing registry entry: <b>{resolvedNode.type}</b>
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
    const cardPresetId = parentSectionKey && cardLayoutPresetOverrides?.[parentSectionKey]
      ? cardLayoutPresetOverrides[parentSectionKey]
      : null;
    const cardPreset = cardPresetId ? getCardLayoutPreset(cardPresetId) : null;

    renderedChildren = resolvedNode.items.map((item: any, i: number) => {
      let itemParams = item.params || {};
      if (cardPreset && (itemType === "card" || itemType === "feature-card")) {
        itemParams = {
          ...itemParams,
          ...(cardPreset.mediaPosition != null ? { mediaPosition: cardPreset.mediaPosition } : {}),
          ...(cardPreset.contentAlign != null ? { contentAlign: cardPreset.contentAlign } : {}),
        };
      }
      const itemNode = {
        type: itemType === "feature-card" ? "Card" : "Card",
        id: item.id || `item-${i}`,
        content: {
          title: item.title,
          body: item.body,
          media: item.icon || item.image,
        },
        params: itemParams,
      };

      const uniqueKey = item.id || `item-${i}`;
      return renderNode({ ...itemNode, key: uniqueKey }, profile, stateSnapshot, defaultState, sectionLayoutPresetOverrides, cardLayoutPresetOverrides, organInternalLayoutOverrides);
    });
  } else if (Array.isArray(resolvedNode.children)) {
    // Normal mode: render children
    renderedChildren = resolvedNode.children.map((child: any, i: number) => {
      // 🔑 Use child.id if available, otherwise use index + type for unique key
      const uniqueKey = child.id || `${child.type}-${i}`;
      return renderNode({ ...child, key: uniqueKey }, profile, stateSnapshot, defaultState, sectionLayoutPresetOverrides, cardLayoutPresetOverrides, organInternalLayoutOverrides);
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


  delete props.type;
  delete props.key;
  // Section layout: driven by layout-2 id only (set in applyProfileToNode); strip legacy keys.
  delete (props as any).layoutPreset;
  delete (props as any).layout;
  // Pass through section layout id so SectionCompound can use LayoutMoleculeRenderer.
  if (typeKey === "section" && resolvedNode.layout != null) {
    (props as any).layout = resolvedNode.layout;
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

  const content = (
    <MaybeDebugWrapper node={resolvedNode}>
      <Component {...props}>{renderedChildren}</Component>
    </MaybeDebugWrapper>
  );

  if (typeKey === "section" && isLayoutDebug()) {
    return <SectionLayoutDebugOverlay node={resolvedNode}>{content}</SectionLayoutDebugOverlay>;
  }
  return content;
}


/* ======================================================
   ROOT — REACTIVE SNAPSHOT
====================================================== */
export default function JsonRenderer({
  node,
  defaultState,
  profileOverride,
  sectionLayoutPresetOverrides,
  cardLayoutPresetOverrides,
  organInternalLayoutOverrides,
  screenId,
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
}) {
  // 🔑 Track if user has interacted (state changed from default) - use reactive state after interaction
  const hasInteracted = React.useRef(false);
  const lastDefaultState = React.useRef(defaultState?.currentView);

  React.useEffect(() => {
    console.log("[MOUNT]", "JsonRenderer");
    return () => console.log("[UNMOUNT]", "JsonRenderer");
  }, []);

  // 🔑 LIFECYCLE: Log mount/unmount
  React.useEffect(() => {
    console.log("[JsonRenderer] ✅ MOUNTED", {
      nodeId: node?.id,
      nodeType: node?.type,
      defaultStateCurrentView: defaultState?.currentView,
    });
    
    // Reset interaction flag when defaultState changes (new screen loaded)
    if (lastDefaultState.current !== defaultState?.currentView) {
      hasInteracted.current = false;
      lastDefaultState.current = defaultState?.currentView;
    }
    
    return () => {
      console.log("[JsonRenderer] ❌ UNMOUNTED", {
        nodeId: node?.id,
        nodeType: node?.type,
      });
      // Reset when unmounting (new screen loading)
      hasInteracted.current = false;
    };
  }, [node?.id, defaultState?.currentView]); // Reset when screen changes

  // TSX passthrough (unchanged)
  if (node && typeof node === "object" && (node as any).$$typeof) {
    return node;
  }


  beginCycle();

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

  // 🔍 PHASE 1 VERIFICATION: Log profile sections and visualPreset
  React.useEffect(() => {
    if (profile?.sections) {
      console.log("[JsonRenderer] 🎨 Profile active", {
        hasSections: !!profile.sections,
        sectionRoles: Object.keys(profile.sections),
        visualPreset: profile.visualPreset,
        templateId: (layoutSnapshot as any)?.templateId,
      });
    }
  }, [profile?.sections, profile?.visualPreset, (layoutSnapshot as any)?.templateId]);

  // 🔍 UI PIPELINE TRACE: Add ?trace=ui to URL to log params per molecule + TextAtom breakdown
  React.useEffect(() => {
    if (isTraceUI()) {
      console.log("[JsonRenderer] 📋 UI pipeline trace ACTIVE — params per molecule + TextAtom empty-params warnings");
    }
  }, []);


  // 🔑 Single authoritative reactive snapshot
  const rawState = useSyncExternalStore(
    subscribeState,
    getState,
    getState
  );

  // Debug: Log state changes
  console.log("[JsonRenderer] State snapshot", {
    rawStateCurrentView: rawState?.currentView,
    defaultStateCurrentView: defaultState?.currentView,
    nodeId: node?.id,
    nodeType: node?.type,
    hasChildren: !!node?.children,
    childrenCount: node?.children?.length,
    rawStateKeys: rawState ? Object.keys(rawState) : [],
  });

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

  PipelineDebugStore.startRenderPass();
  const result = renderNode(node, profile, stateSnapshot, effectiveDefaultState, sectionLayoutPresetOverrides, cardLayoutPresetOverrides, organInternalLayoutOverrides);
  PipelineDebugStore.endRenderPass();
  recordStage("render", "pass", "Render cycle completed");
  return result;
}


