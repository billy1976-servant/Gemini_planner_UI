"use client";
import React from "react";
import Registry from "./registry";
import { resolveParams } from "./palette-resolver";
import { getVisualPresetForMolecule } from "@/layout/visual-preset-resolver";
import { getSpacingForScale } from "@/layout/spacing-scale-resolver";
import { getCardPreset } from "@/layout/card-preset-resolver";
import { resolveMoleculeLayout } from "@/layout/molecule-layout-resolver";
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

const EXPECTED_PARAMS: Record<string, string[]> = {
  button: ["surface", "label", "trigger"],
  section: ["surface", "title"],
  card: ["surface", "title", "body", "media"],
  toolbar: ["surface", "item"],
  list: ["surface", "item"],
  footer: ["surface", "item"],
};

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
====================================================== */
const NON_ACTIONABLE_TYPES = new Set(["section", "field", "avatar"]);

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
  if (!node?.when) return true;


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
    return false;
  }


  return stateValue === equals;
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
   PROFILE → SECTION RESOLVER
====================================================== */
function applyProfileToNode(node: any, profile: any): any {
  if (!node || !profile) return node;


  const next = { ...node };

  // 🔑 Template = defaults, organ = overrides. When mode === "custom", skip template section logic.
  const isSection = node.type?.toLowerCase?.() === "section";
  const layoutMode = profile?.mode ?? "template";

  if (layoutMode === "template" && isSection && node.role && profile.sections?.[node.role]) {
    const sectionDef = profile.sections[node.role];
    // Template provides defaults; organ layout overrides.
    next.layout = {
      ...sectionDef,
      ...(node.layout ?? {}),
    };
    // moleculeLayout: template supplies gap/padding/type; organ layout wins for justify/align.
    const layoutType = sectionDef.type === "stack" ? "stacked" : sectionDef.type;
    const templateParams = sectionDef.params ?? {};
    const organLayoutParams = node.layout?.params ?? {};
    const mergedLayoutParams = {
      ...templateParams,
      ...(node.params?.moleculeLayout?.params ?? {}),
    };
    if (organLayoutParams.justify !== undefined) mergedLayoutParams.justify = organLayoutParams.justify;
    if (organLayoutParams.align !== undefined) mergedLayoutParams.align = organLayoutParams.align;

    const containerWidth =
      profile.widthByRole?.[node.role] ?? profile.containerWidth;
    next.params = {
      ...(next.params ?? {}),
      moleculeLayout: {
        type: layoutType,
        params: mergedLayoutParams,
        ...(node.params?.moleculeLayout ? { type: node.params.moleculeLayout.type, preset: node.params.moleculeLayout.preset } : {}),
      },
      ...(containerWidth != null ? { containerWidth } : {}),
      ...(node.role === "hero" && profile.heroMode != null
        ? { heroMode: profile.heroMode }
        : {}),
      ...(node.role === "hero" &&
      profile.sectionBackgroundPattern === "hero-accent"
        ? { backgroundVariant: "hero-accent" }
        : {}),
      // Hero sections use headline typography role for the title
      ...(node.role === "hero"
        ? {
            title: {
              ...(next.params?.title && typeof next.params.title === "object" ? next.params.title : {}),
              size: "textRole.headline.size",
              weight: "textRole.headline.weight",
              lineHeight: "textRole.headline.lineHeight",
            },
          }
        : {}),
    };
  }


  if (Array.isArray(node.children)) {
    next.children = node.children.map((child) =>
      applyProfileToNode(child, profile)
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
  defaultState?: any
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
    ? applyProfileToNode(node, profile)
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
  const finalParams =
    Object.keys(spacingOverlay).length > 0
      ? deepMergeParams(paramsAfterSectionLayout, spacingOverlay)
      : paramsAfterSectionLayout;


  const resolvedNode = {
    ...profiledNode,
    params: finalParams,
  };

  logParamsDiagnostic(typeKey, resolvedNode.id, finalParams);

  const Component = (Registry as any)[resolvedNode.type];


  if (!Component) {
    return (
      <MaybeDebugWrapper node={resolvedNode}>
        <div style={{ color: "red" }}>
          Missing registry entry: <b>{resolvedNode.type}</b>
        </div>
      </MaybeDebugWrapper>
    );
  }


  if (!isValidReactComponentType(Component)) {
    console.error("INVALID REGISTRY COMPONENT TYPE", resolvedNode.type);
    return null;
  }


  /* ======================================================
     PHASE 6: REPEATERS / COLLECTIONS
     If node has items array, render each item as a Card or custom block
     ====================================================== */
  let renderedChildren = null;
  
  if (Array.isArray(resolvedNode.items) && resolvedNode.items.length > 0) {
    // Repeater mode: render items array
    const itemType = resolvedNode.params?.repeater?.itemType || "card";
    
    renderedChildren = resolvedNode.items.map((item: any, i: number) => {
      const itemNode = {
        type: itemType === "feature-card" ? "Card" : "Card",
        id: item.id || `item-${i}`,
        content: {
          title: item.title,
          body: item.body,
          media: item.icon || item.image,
        },
        params: item.params || {},
      };
      
      const uniqueKey = item.id || `item-${i}`;
      return renderNode({ ...itemNode, key: uniqueKey }, profile, stateSnapshot, defaultState);
    });
  } else if (Array.isArray(resolvedNode.children)) {
    // Normal mode: render children
    renderedChildren = resolvedNode.children.map((child: any, i: number) => {
      // 🔑 Use child.id if available, otherwise use index + type for unique key
      const uniqueKey = child.id || `${child.type}-${i}`;
      return renderNode({ ...child, key: uniqueKey }, profile, stateSnapshot, defaultState);
    });
  }


  if (moleculeSpec?.type) {
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


  delete props.type;
  delete props.key;


  const LayoutComponent =
    resolvedNode.layout?.type &&
    (Registry as any)[resolvedNode.layout.type];


  const wrappedChildren = LayoutComponent ? (
    <LayoutComponent params={resolvedNode.layout?.params}>
      {renderedChildren}
    </LayoutComponent>
  ) : (
    renderedChildren
  );


  return (
    <MaybeDebugWrapper node={resolvedNode}>
      <Component {...props}>{wrappedChildren}</Component>
    </MaybeDebugWrapper>
  );
}


/* ======================================================
   ROOT — REACTIVE SNAPSHOT
====================================================== */
export default function JsonRenderer({
  node,
  defaultState,
  profileOverride,
}: {
  node: any;
  defaultState?: any;
  /**
   * Optional experience profile JSON providing `sections` mapping for role-based section layout.
   * If omitted, JsonRenderer falls back to the layout-store snapshot (legacy behavior).
   */
  profileOverride?: any;
}) {
  // 🔑 Track if user has interacted (state changed from default) - use reactive state after interaction
  const hasInteracted = React.useRef(false);
  const lastDefaultState = React.useRef(defaultState?.currentView);
  
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


  return renderNode(node, profile, stateSnapshot, effectiveDefaultState);
}


