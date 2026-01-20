"use client";
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
function shouldRenderNode(node: any, state: any): boolean {
  // No condition → always render
  if (!node?.when) return true;


  const { state: key, equals } = node.when;
  if (!key) return true;


  // 🔒 Authoritative gating:
  // If the state key does not exist yet, DO NOT render
  if (!state || !(key in state)) return false;


  return state[key] === equals;
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
  stateSnapshot: any
): any {
  if (!node) return null;
  if (!shouldRenderNode(node, stateSnapshot)) return null;


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
    renderedChildren = resolvedNode.children.map((child: any, i: number) =>
      renderNode({ ...child, key: i }, profile, stateSnapshot)
    );
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
export default function JsonRenderer({ node }: { node: any }) {
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
  const stateSnapshot = useSyncExternalStore(
    subscribeState,
    getState,
    getState
  );


  traceOnce("root", "Root render");


  return renderNode(node, profile, stateSnapshot);
}


