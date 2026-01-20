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
      <DebugWrapper node={node}>
        <JsonSkinEngine screen={node} />
      </DebugWrapper>
    );
  }

  if (!shouldRenderNode(node, stateSnapshot, defaultState)) return null;


  const profiledNode = profile
    ? applyProfileToNode(node, profile)
    : node;


  const def = (definitions as any)[profiledNode.type] ?? {};
  const variantPreset =
    def.variants?.[profiledNode.variant || "filled"] ?? {};
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
      <DebugWrapper node={resolvedNode}>
        <div style={{ color: "red" }}>
          Missing registry entry: <b>{resolvedNode.type}</b>
        </div>
      </DebugWrapper>
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


  const props: any = {
    ...resolvedNode,
    params: resolvedNode.params,
    content: resolvedNode.content ?? {},
    behavior: resolvedNode.behavior ?? {},
    onTap: resolvedNode.onTap,
  };


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
    <DebugWrapper node={resolvedNode}>
      <Component {...props}>{wrappedChildren}</Component>
    </DebugWrapper>
  );
}


/* ======================================================
   ROOT — REACTIVE SNAPSHOT
====================================================== */
export default function JsonRenderer({ node, defaultState }: { node: any; defaultState?: any }) {
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


  const profile = useSyncExternalStore(
    subscribeLayout,
    getLayout,
    getLayout
  );


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
    currentView: effectiveCurrentView,
    ...rawState?.values,
  };

  // Use defaultState from JSON if provided (for initial render before state is initialized)
  const effectiveDefaultState = defaultState ?? node?.state;


  traceOnce("root", "Root render");


  return renderNode(node, profile, stateSnapshot, effectiveDefaultState);
}


