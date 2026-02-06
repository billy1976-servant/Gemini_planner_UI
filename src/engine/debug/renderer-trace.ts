/**
 * Lightweight passive trace for JSON → Profile Resolver → Layout Decision → Component Render.
 * Only emits when __PIPELINE_DEBUGGER_ENABLED__ is true (set by Pipeline Debugger on mount).
 * Zero impact on production rendering.
 */

export type RendererTraceEvent =
  | {
      stage: "profile-resolution";
      nodeId: string;
      sectionKey?: string;
      requestedLayout?: string;
      stateOverride?: string;
      presetOverride?: string;
      templateDefault?: string;
      finalLayout: string;
      reason: string;
    }
  | {
      stage: "component-render";
      nodeId: string;
      layoutId: string;
      component: string;
    }
  | {
      stage: "renderer-error";
      nodeId?: string;
      message: string;
    };

let listeners: ((e: RendererTraceEvent) => void)[] = [];

export function emitRendererTrace(e: RendererTraceEvent) {
  if (typeof window !== "undefined" && (window as any).__PIPELINE_DEBUGGER_ENABLED__) {
    listeners.forEach((l) => l(e));
  }
}

export function subscribeRendererTrace(cb: (e: RendererTraceEvent) => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}
