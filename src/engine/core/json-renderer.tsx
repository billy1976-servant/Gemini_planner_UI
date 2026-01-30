"use client";
import React from "react";
import Registry from "./registry";
import { resolveParams } from "./palette-resolver";
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
        outline: "1px dashed #ccc",
        margin: 4,
        padding: 4,
        position: "relative",
      }}
    >
      <div
        style={{
          fontSize: 10,
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
   PROFILE → SECTION RESOLVER
====================================================== */
function applyProfileToNode(node: any, profile: any): any {
  if (!node || !profile) return node;


  const next = { ...node };


  if (node.type === "section" && node.role && profile.sections?.[node.role]) {
    next.layout = {
      ...profile.sections[node.role],
      ...(node.layout ?? {}),
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


  const def = (definitions as any)[profiledNode.type] ?? {};
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


  const resolvedParams = resolveParams(
    variantPreset,
    sizePreset,
    profiledNode.params ?? {}
  );


  const resolvedNode = {
    ...profiledNode,
    params: resolvedParams,
  };


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


  let renderedChildren = null;
  if (Array.isArray(resolvedNode.children)) {
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


    resolvedNode.params.moleculeLayout = {
      ...moleculeSpec,
      params: layoutParams,
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


